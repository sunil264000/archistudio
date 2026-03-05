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
  couponCode?: string;
  amount?: number; // Optional hint from client, but server recalculates if possible
}

// Input validation helpers
function validateName(name: string): boolean {
  return typeof name === "string" && name.trim().length > 0 && name.length <= 200;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === "string" && emailRegex.test(email) && email.length <= 255;
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[0-9]{8,15}$/;
  return typeof phone === "string" && phoneRegex.test(phone.replace(/[\s-]/g, ""));
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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("Missing backend configuration");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1) Auth: validate JWT using anon client with forwarded Authorization header.
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData?.user) {
      console.error("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) DB writes: use service role
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const user = authData.user;

    const { courseId, customerName, customerEmail, customerPhone, couponCode, amount: clientAmount }: OrderRequest = await req.json();

    // Validate inputs
    if (!validateName(customerName)) throw new Error("Invalid customer name");
    if (!validateEmail(customerEmail)) throw new Error("Invalid email address");
    if (!validatePhone(customerPhone)) throw new Error("Invalid phone number");
    if (!courseId) throw new Error("Invalid course ID");

    // CRITICAL: Get course from database
    const { data: course, error: courseError } = await supabaseClient
      .from("courses")
      .select("id, price_inr, title, is_published")
      .eq("slug", courseId)
      .single();

    if (courseError || !course) {
      console.error("Course not found:", courseId, courseError);
      return new Response(JSON.stringify({ error: "Course not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!course.is_published) throw new Error("Course is not available for purchase");

    // Check existing enrollment
    const { data: existingEnrollment } = await supabaseClient
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingEnrollment) throw new Error("You already have access to this course");

    // SERVER-SIDE PRICE DETERMINATION
    // We strictly use the DB price as the foundation.
    // If DB price is missing (0 or null), we use the client amount only if provided.
    const basePrice = (course.price_inr && course.price_inr > 0)
      ? Number(course.price_inr)
      : (clientAmount || 0);

    let finalAmount = basePrice;
    let discountAmount = 0;
    let appliedCouponCode = null;

    // Apply Coupon logic (Strictly server-side recalculation)
    if (couponCode && typeof couponCode === "string" && couponCode.trim()) {
      const normalizedCode = couponCode.trim().toUpperCase();
      const { data: coupon } = await supabaseClient
        .from("coupons")
        .select("*")
        .eq("code", normalizedCode)
        .eq("is_active", true)
        .single();

      if (coupon) {
        const now = new Date();
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

        const isValidDate = (!validFrom || validFrom <= now) && (!validUntil || validUntil >= now);
        const hasUsesLeft = !coupon.max_uses || (coupon.used_count || 0) < coupon.max_uses;
        const meetsMinPurchase = !coupon.min_purchase_amount || basePrice >= coupon.min_purchase_amount;
        const appliesToCourse = !coupon.applicable_course_id || coupon.applicable_course_id === course.id;

        if (isValidDate && hasUsesLeft && meetsMinPurchase && appliesToCourse) {
          appliedCouponCode = normalizedCode;
          if (coupon.discount_type === 'percentage') {
            discountAmount = Math.round(basePrice * (coupon.discount_value / 100));
          } else {
            discountAmount = coupon.discount_value;
          }
          finalAmount = Math.max(0, basePrice - discountAmount);
          console.log(`Coupon Applied: ${normalizedCode}. Base: ${basePrice}, Discount: ${discountAmount}, Final: ${finalAmount}`);
        } else {
          console.warn("Coupon validation failed server-side", { isValidDate, hasUsesLeft, meetsMinPurchase, appliesToCourse });
        }
      }
    }

    // EDGE CASE: If price is ₹0 after discount, don't go to Cashfree
    if (finalAmount <= 0) {
      return new Response(JSON.stringify({
        isFree: true,
        message: "Course is free after discount. Use free enrollment flow.",
        courseId: course.id
      }), {
        status: 200, // Return 200 so the client can read the JSON safely
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appId = Deno.env.get("CASHFREE_APP_ID");
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");
    if (!appId || !secretKey) throw new Error("Cashfree credentials not configured");

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
        order_amount: finalAmount,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_name: customerName.trim().substring(0, 200),
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: customerPhone.replace(/[\s-]/g, ""),
        },
        order_meta: {
          return_url: `${req.headers.get("origin")}/payment-success?order_id={order_id}&course=${courseId}`,
          notify_url: `${supabaseUrl}/functions/v1/cashfree-webhook`,
        },
      }),
    });

    const orderData = await cashfreeResponse.json();
    if (!cashfreeResponse.ok) throw new Error(orderData.message || "Failed to create order");

    // Log pending payment
    await supabaseClient.from("payments").insert({
      user_id: user.id,
      course_id: course.id,
      amount: finalAmount,
      currency: "INR",
      status: "pending",
      payment_gateway: "cashfree",
      gateway_order_id: orderId,
      metadata: {
        coupon_code: appliedCouponCode,
        discount_amount: discountAmount,
        original_price: basePrice
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
    console.error("Payment initiation error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to initiate payment" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
