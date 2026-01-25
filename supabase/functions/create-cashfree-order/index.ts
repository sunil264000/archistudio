import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRequest {
  courseId: string; // course slug
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

// Input validation helpers
function validateName(name: string): boolean {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 200;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email) && email.length <= 255;
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[0-9]{8,15}$/;
  return typeof phone === 'string' && phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("Missing backend configuration");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1) Auth: validate JWT using anon client with forwarded Authorization header.
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData?.user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2) DB writes: use service role
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const user = authData.user;

    const {
      courseId,
      customerName,
      customerEmail,
      customerPhone,
    }: OrderRequest = await req.json();

    // Validate inputs
    if (!validateName(customerName)) {
      throw new Error("Invalid customer name");
    }
    if (!validateEmail(customerEmail)) {
      throw new Error("Invalid email address");
    }
    if (!validatePhone(customerPhone)) {
      throw new Error("Invalid phone number");
    }
    if (!courseId || typeof courseId !== 'string' || courseId.length > 100) {
      throw new Error("Invalid course ID");
    }

    // CRITICAL: Get course from database - courses must exist in DB (no dynamic creation)
    const { data: course, error: courseError } = await supabaseClient
      .from("courses")
      .select("id, price_inr, title, is_published")
      .eq("slug", courseId)
      .single();

    if (courseError || !course) {
      console.error("Course not found:", courseId, courseError);
      return new Response(
        JSON.stringify({ error: "Course not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Verify course is published
    if (!course.is_published) {
      throw new Error("Course is not available for purchase");
    }

    // ANTI-DOUBLE-PURCHASE: Check if user already has active access
    const { data: existingEnrollment } = await supabaseClient
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingEnrollment) {
      throw new Error("You already have access to this course");
    }

    // Use SERVER-SIDE price from database (not client-supplied amount)
    const amount = Number(course.price_inr);
    
    if (!amount || amount <= 0) {
      throw new Error("Invalid course price");
    }

    const appId = Deno.env.get("CASHFREE_APP_ID");
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");

    if (!appId || !secretKey) {
      throw new Error("Cashfree credentials not configured");
    }

    // Generate unique order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Cashfree domain whitelisting is strict. Use production domains only.
    // Support both archistudio.lovable.app and archistudio.shop
    const reqOrigin = req.headers.get("origin") || "";
    let redirectBaseUrl = "https://archistudio.lovable.app"; // default
    
    if (reqOrigin.includes("archistudio.shop")) {
      redirectBaseUrl = "https://archistudio.shop";
    } else if (reqOrigin.includes("archistudio.lovable.app")) {
      redirectBaseUrl = "https://archistudio.lovable.app";
    }

    // Create Cashfree order with SERVER-SIDE validated price
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
        order_amount: amount, // Using server-side validated price
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_name: customerName.trim().substring(0, 200),
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: customerPhone.replace(/[\s-]/g, ''),
        },
        order_meta: {
          return_url: `${redirectBaseUrl}/payment-success?order_id={order_id}&course=${courseId}`,
          cancel_url: `${redirectBaseUrl}/payment-failed?order_id={order_id}&course=${courseId}`,
          notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/cashfree-webhook`,
        },
        order_note: `Course purchase: ${course.title}`,
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
        course_id: course.id,
        amount: amount, // Using server-side validated price
        currency: "INR",
        status: "pending",
        payment_gateway: "cashfree",
        gateway_order_id: orderId,
        metadata: {
          course_slug: courseId,
          customer_name: customerName.trim().substring(0, 200),
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: customerPhone.replace(/[\s-]/g, ''),
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
      JSON.stringify({ error: error?.message || "Failed to create order" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
