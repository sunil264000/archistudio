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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = await req.json();
    console.log("Cashfree webhook received:", JSON.stringify(payload));

    const { data } = payload;
    
    if (!data || !data.order) {
      throw new Error("Invalid webhook payload");
    }

    const orderId = data.order.order_id;
    const paymentStatus = data.payment?.payment_status;
    const paymentId = data.payment?.cf_payment_id;

    // Map Cashfree status to our status
    let status = "pending";
    if (paymentStatus === "SUCCESS") {
      status = "completed";
    } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
      status = "failed";
    }

    // Update payment record
    const { data: paymentData, error: updateError } = await supabaseClient
      .from("payments")
      .update({
        status: status,
        gateway_payment_id: paymentId?.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq("gateway_order_id", orderId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating payment:", updateError);
      throw updateError;
    }

    // If payment successful, create enrollment and send email
    if (status === "completed" && paymentData) {
      let courseId = paymentData.course_id as string | null;
      let courseName = "";
      let courseSlug = "";

      // Backfill course_id from stored slug if needed
      if (!courseId) {
        const slug = (paymentData.metadata as any)?.course_slug as string | undefined;
        if (slug) {
          const { data: courseRow, error: courseError } = await supabaseClient
            .from("courses")
            .select("id, title, slug")
            .eq("slug", slug)
            .single();

          if (courseError) {
            console.error("Course lookup error (webhook):", courseError);
          } else {
            courseId = courseRow?.id ?? null;
            courseName = courseRow?.title ?? "";
            courseSlug = courseRow?.slug ?? "";
          }
        }
      } else {
        // Get course details for email
        const { data: courseRow } = await supabaseClient
          .from("courses")
          .select("title, slug")
          .eq("id", courseId)
          .single();
        
        if (courseRow) {
          courseName = courseRow.title;
          courseSlug = courseRow.slug;
        }
      }

      if (!courseId) {
        console.error("Cannot create enrollment: missing course_id", {
          orderId,
          paymentId,
          metadata: paymentData.metadata,
        });
      } else {
        const { error: enrollmentError } = await supabaseClient
          .from("enrollments")
          .insert({
            user_id: paymentData.user_id,
            course_id: courseId,
            payment_id: paymentData.id,
            status: "active",
          });

        if (enrollmentError) {
          console.error("Error creating enrollment:", enrollmentError);
        } else {
          // Get user email for notification
          const { data: profile } = await supabaseClient
            .from("profiles")
            .select("email, full_name")
            .eq("user_id", paymentData.user_id)
            .single();

          if (profile?.email && courseName) {
            // Send enrollment confirmation email
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
                courseName: courseName,
                courseSlug: courseSlug,
                isFree: false,
                amount: paymentData.amount,
              }),
            }).catch(err => console.error("Enrollment email error:", err));
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
