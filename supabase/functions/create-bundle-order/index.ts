import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BundleOrderRequest {
  courseIds: string[]; // slugs
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  couponCode?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing server configuration");
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Validate JWT
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) throw new Error("Unauthorized");

    const { courseIds, customerName, customerEmail, customerPhone, couponCode }: BundleOrderRequest = await req.json();

    if (!courseIds || courseIds.length === 0) throw new Error("No courses selected");

    // Fetch all courses
    const { data: courses, error: coursesError } = await supabaseClient
      .from("courses")
      .select("id, title, price_inr, slug")
      .in("slug", courseIds);

    if (coursesError || !courses || courses.length === 0) {
      throw new Error("Courses not found");
    }

    // Calculate base price
    const baseTotal = courses.reduce((sum, c) => sum + (c.price_inr || 0), 0);
    
    // Apply Bundle Discount
    // 2 courses = 10%, 3+ courses = 20%
    const bundleDiscountPercent = courses.length >= 3 ? 20 : (courses.length === 2 ? 10 : 0);
    const bundleDiscountAmount = Math.round(baseTotal * (bundleDiscountPercent / 100));
    
    let finalAmount = baseTotal - bundleDiscountAmount;
    let couponDiscountAmount = 0;

    // Apply Coupon if provided (on top of bundle discount or instead of? Usually on top is better for UX)
    if (couponCode) {
      const { data: coupon } = await supabaseClient
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase())
        .eq("is_active", true)
        .single();

      if (coupon) {
        // Validation logic similar to single order...
        if (coupon.discount_type === 'percentage') {
          couponDiscountAmount = Math.round(finalAmount * (coupon.discount_value / 100));
        } else {
          couponDiscountAmount = coupon.discount_value;
        }
        finalAmount = Math.max(0, finalAmount - couponDiscountAmount);
      }
    }

    if (finalAmount <= 0) {
      return new Response(JSON.stringify({ isFree: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appId = Deno.env.get("CASHFREE_APP_ID");
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");
    
    const orderId = `bundle_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const cashfreeResponse = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": appId!,
        "x-client-secret": secretKey!,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: finalAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone.replace(/[\s-]/g, ""),
        },
        order_meta: {
          return_url: `${req.headers.get("origin")}/payment-success?order_id={order_id}&bundle=true`,
          notify_url: `${supabaseUrl}/functions/v1/cashfree-webhook`,
        },
      }),
    });

    const orderData = await cashfreeResponse.json();
    if (!cashfreeResponse.ok) throw new Error(orderData.message || "Cashfree error");

    // Log payment record (we'll need a way to link multiple courses to one payment)
    // For simplicity, we'll store the JSON list of course IDs in metadata
    await supabaseClient.from("payments").insert({
      user_id: user.id,
      amount: finalAmount,
      currency: "INR",
      status: "pending",
      payment_gateway: "cashfree",
      gateway_order_id: orderId,
      metadata: {
        course_ids: courses.map(c => c.id),
        course_slugs: courseIds,
        bundle_discount: bundleDiscountAmount,
        coupon_code: couponCode,
        is_bundle: true
      }
    });

    return new Response(JSON.stringify({
      orderId: orderData.order_id,
      paymentSessionId: orderData.payment_session_id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
