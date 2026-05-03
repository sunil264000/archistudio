import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orderId } = await req.json();
    if (!orderId) throw new Error("Missing orderId");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check current payment status
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .select("id, status, user_id, course_id, amount, metadata, created_at")
      .eq("gateway_order_id", orderId)
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ status: "not_found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already completed, return success
    if (payment.status === "completed") {
      return new Response(
        JSON.stringify({ status: "completed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (payment.status === "failed") {
      return new Response(
        JSON.stringify({ status: "failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment still pending - verify directly with Cashfree API
    const appId = Deno.env.get("CASHFREE_APP_ID");
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");

    if (!appId || !secretKey) {
      return new Response(
        JSON.stringify({ status: "pending" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const cfResponse = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
      headers: {
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
    });

    const cfData = await cfResponse.json();
    console.log("Cashfree order status:", cfData.order_status, "for", orderId);

    if (cfData.order_status === "PAID") {
      // Payment confirmed by Cashfree — update records
      await supabaseClient
        .from("payments")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("gateway_order_id", orderId);

      const metadata = payment.metadata || {};
      const isSubscription = metadata.is_subscription === true;

      if (isSubscription) {
        // Automation for Subscriptions
        const planId = metadata.plan_id;
        let daysToAdd = 30; // Default monthly
        if (planId === 'trial') daysToAdd = 7;
        if (planId === 'quarterly') daysToAdd = 90;
        if (planId === 'annual') daysToAdd = 365;

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + daysToAdd);

        await supabaseClient
          .from("worker_profiles")
          .update({
            subscription_tier: planId,
            subscription_expires_at: expiresAt.toISOString(),
            is_active: true
          })
          .eq("user_id", payment.user_id);
      }

      const isBundle = metadata.is_bundle === true;
      const courseIds = isBundle ? (metadata.course_ids || []) : (payment.course_id ? [payment.course_id] : []);

      // Enroll in all courses (if any)
      for (const cid of courseIds) {
        if (!cid) continue;
        const { data: existingEnrollment } = await supabaseClient
          .from("enrollments")
          .select("id")
          .eq("user_id", payment.user_id)
          .eq("course_id", cid)
          .maybeSingle();

        if (!existingEnrollment) {
          await supabaseClient.from("enrollments").insert({
            user_id: payment.user_id,
            course_id: cid,
            payment_id: payment.id,
            status: "active",
          });
        }
      }

      // Send enrollment email (fire & forget)
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", payment.user_id)
        .single();

      if (profile?.email) {
        let courseTitle = "Your Course";
        let courseSlug = "";

        if (isBundle) {
          courseTitle = `${courseIds.length} Studio Hub Courses`;
          courseSlug = "dashboard"; // Redirect to dashboard for bundles
        } else {
          const { data: course } = await supabaseClient
            .from("courses")
            .select("title, slug")
            .eq("id", payment.course_id)
            .single();
          if (course) {
            courseTitle = course.title;
            courseSlug = course.slug;
          }
        }

        const baseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

        fetch(`${baseUrl}/functions/v1/send-enrollment-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            email: profile.email,
            name: profile.full_name || "",
            courseName: courseTitle,
            courseSlug: courseSlug,
            isFree: false,
            amount: payment.amount,
            orderId: orderId,
            paymentDate: payment.created_at || new Date().toISOString(),
          }),
        }).catch(err => console.error("Enrollment email error:", err));
      }

      return new Response(
        JSON.stringify({ status: "completed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else if (cfData.order_status === "EXPIRED" || cfData.order_status === "TERMINATED") {
      await supabaseClient
        .from("payments")
        .update({ status: "failed", updated_at: new Date().toISOString() })
        .eq("gateway_order_id", orderId);

      return new Response(
        JSON.stringify({ status: "failed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ status: "pending" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Verify payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
