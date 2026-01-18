import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRequest {
  courseId: string; // course slug
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Optional course metadata so backend can upsert the course if missing
  courseTitle?: string;
  courseShortDescription?: string;
  courseDescription?: string;
  courseLevel?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      // Use service role so we can write payment/enrollment records reliably
      // (we still validate the end-user via the JWT below)
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const {
      courseId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      courseTitle,
      courseShortDescription,
      courseDescription,
      courseLevel,
    }: OrderRequest = await req.json();

    // Resolve course UUID from slug (frontend uses slugs)
    let { data: courseRow } = await supabaseClient
      .from("courses")
      .select("id")
      .eq("slug", courseId)
      .maybeSingle();

    // If course isn't in DB yet, create it (best-effort)
    if (!courseRow?.id) {
      if (!courseTitle) {
        throw new Error("Invalid course");
      }

      const { data: insertedCourse, error: insertCourseError } = await supabaseClient
        .from("courses")
        .insert({
          slug: courseId,
          title: courseTitle,
          short_description: courseShortDescription ?? null,
          description: courseDescription ?? null,
          level: (courseLevel as any) ?? "beginner",
          is_published: true,
          is_featured: false,
          duration_hours: 0,
          total_lessons: 0,
          price_inr: amount,
          price_usd: 0,
        })
        .select("id")
        .single();

      if (insertCourseError || !insertedCourse?.id) {
        console.error("Course upsert error:", insertCourseError);
        throw new Error("Invalid course");
      }

      courseRow = insertedCourse;
    }

    const appId = Deno.env.get("CASHFREE_APP_ID");
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");

    if (!appId || !secretKey) {
      throw new Error("Cashfree credentials not configured");
    }

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create Cashfree order
    const cashfreeResponse = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secretKey,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        },
        order_meta: {
          return_url: `${(req.headers.get("origin") || "https://concrete-logic.lovable.app")}/payment-success?order_id={order_id}`,
          notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/cashfree-webhook`,
        },
        order_note: `Course purchase: ${courseId}`,
      }),
    });

    const orderData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error("Cashfree error:", orderData);
      throw new Error(orderData.message || "Failed to create order");
    }

    // Store payment record in pending state
    const { error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        user_id: user.id,
        course_id: courseRow.id,
        amount: amount,
        currency: "INR",
        status: "pending",
        payment_gateway: "cashfree",
        gateway_order_id: orderId,
        metadata: {
          course_slug: courseId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        },
      });

    if (paymentError) {
      console.error("Payment record error:", paymentError);
      // Don't throw - payment can still proceed even if record fails
    }

    return new Response(
      JSON.stringify({
        orderId: orderData.order_id,
        paymentSessionId: orderData.payment_session_id,
        orderStatus: orderData.order_status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating Cashfree order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
