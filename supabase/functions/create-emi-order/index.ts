import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EMIOrderRequest {
  courseId: string; // course slug
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  paymentPercent: number; // e.g., 25, 50, 100
  tierIndex: number; // which tier in the EMI settings
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

    // 1) Auth
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

    // 2) DB writes
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    const user = authData.user;

    const {
      courseId,
      customerName,
      customerEmail,
      customerPhone,
      paymentPercent,
      tierIndex,
    }: EMIOrderRequest = await req.json();

    // Validate inputs
    if (!validatePhone(customerPhone)) {
      throw new Error("Invalid phone number");
    }
    if (!courseId || typeof courseId !== 'string') {
      throw new Error("Invalid course ID");
    }
    if (!paymentPercent || paymentPercent < 1 || paymentPercent > 100) {
      throw new Error("Invalid payment percentage");
    }

    // Get course from database
    const { data: course, error: courseError } = await supabaseClient
      .from("courses")
      .select("id, price_inr, title, is_published")
      .eq("slug", courseId)
      .single();

    if (courseError || !course) {
      throw new Error("Course not found");
    }

    if (!course.is_published) {
      throw new Error("Course is not available for purchase");
    }

    const fullPrice = Number(course.price_inr);
    if (!fullPrice || fullPrice <= 0) {
      throw new Error("Invalid course price");
    }

    // Get EMI settings for this course
    const { data: emiSettings } = await supabaseClient
      .from("course_emi_settings")
      .select("*")
      .eq("course_id", course.id)
      .eq("is_emi_enabled", true)
      .single();

    if (!emiSettings) {
      throw new Error("EMI is not enabled for this course");
    }

    // Validate payment tier
    const paymentTiers = (emiSettings.payment_tiers as any[]) || [];
    if (tierIndex < 0 || tierIndex >= paymentTiers.length) {
      throw new Error("Invalid payment tier");
    }

    const selectedTier = paymentTiers[tierIndex];
    if (selectedTier.percent !== paymentPercent) {
      throw new Error("Payment percentage mismatch");
    }

    // Check if user already has full access
    const { data: existingEnrollment } = await supabaseClient
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("status", "active")
      .maybeSingle();

    if (existingEnrollment) {
      throw new Error("You already have full access to this course");
    }

    // Check existing EMI payments to determine installment number
    const { data: existingEMI } = await supabaseClient
      .from("emi_payments")
      .select("unlocked_percent")
      .eq("user_id", user.id)
      .eq("course_id", course.id)
      .eq("status", "completed")
      .order("unlocked_percent", { ascending: false })
      .limit(1);

    const currentUnlocked = existingEMI?.[0]?.unlocked_percent || 0;
    
    if (paymentPercent <= currentUnlocked) {
      throw new Error("You have already unlocked this content");
    }

    // Calculate amount for this installment
    const previousPaid = (currentUnlocked / 100) * fullPrice;
    const targetPaid = (paymentPercent / 100) * fullPrice;
    const amountToPay = Math.round(targetPaid - previousPaid);

    if (amountToPay <= 0) {
      throw new Error("Invalid payment amount");
    }

    // Map module_order_indices -> module IDs (stored in modules table)
    const moduleOrderIndices: number[] = Array.isArray(selectedTier.module_order_indices)
      ? selectedTier.module_order_indices
      : [];

    const moduleIdsToUnlock: string[] =
      paymentPercent === 100
        ? []
        : (await supabaseClient
            .from("modules")
            .select("id, order_index")
            .eq("course_id", course.id)
            .in("order_index", moduleOrderIndices))
            .data?.map((m: any) => m.id) ?? [];

    const appId = Deno.env.get("CASHFREE_APP_ID");
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");

    if (!appId || !secretKey) {
      throw new Error("Cashfree credentials not configured");
    }

    // Generate unique order ID
    const orderId = `emi_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const PUBLISHED_SITE_URL = "https://archistudio.lovable.app";
    const reqOrigin = req.headers.get("origin") || "";
    const redirectBaseUrl = reqOrigin.includes("archistudio.lovable.app")
      ? "https://archistudio.lovable.app"
      : PUBLISHED_SITE_URL;

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
        order_amount: amountToPay,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_name: customerName.trim().substring(0, 200),
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: customerPhone.replace(/[\s-]/g, ''),
        },
        order_meta: {
          return_url: `${redirectBaseUrl}/payment-success?order_id={order_id}&course=${courseId}&emi=true`,
          cancel_url: `${redirectBaseUrl}/payment-failed?order_id={order_id}&course=${courseId}`,
          notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/cashfree-webhook`,
        },
        order_note: `EMI Payment: ${course.title} (${paymentPercent}% unlock)`,
      }),
    });

    const orderData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error("Cashfree error:", orderData);
      throw new Error(orderData.message || "Failed to create order");
    }

    // Determine installment number
    const installmentNumber = existingEMI?.length ? existingEMI.length + 1 : 1;
    const totalInstallments = paymentPercent === 100 ? installmentNumber : Math.ceil(100 / (paymentPercent / installmentNumber));

    // Store EMI payment record in pending state
    const { error: emiError } = await supabaseClient
      .from("emi_payments")
      .insert({
        user_id: user.id,
        course_id: course.id,
        installment_number: installmentNumber,
        total_installments: totalInstallments,
        amount_paid: amountToPay,
        remaining_amount: fullPrice - targetPaid,
        unlocked_percent: paymentPercent,
        gateway_order_id: orderId,
        status: "pending",
        total_course_price: fullPrice,
      });

    if (emiError) {
      console.error("EMI record error:", emiError);
    }

    // Store payment record
    const { error: paymentError } = await supabaseClient
      .from("payments")
      .insert({
        user_id: user.id,
        course_id: course.id,
        amount: amountToPay,
        currency: "INR",
        status: "pending",
        payment_gateway: "cashfree",
        gateway_order_id: orderId,
        metadata: {
          course_slug: courseId,
          is_emi: true,
          payment_percent: paymentPercent,
          tier_index: tierIndex,
          module_ids_to_unlock: moduleIdsToUnlock,
          customer_name: customerName.trim().substring(0, 200),
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: customerPhone.replace(/[\s-]/g, ''),
        },
      });

    if (paymentError) {
      console.error("Payment record error:", paymentError);
    }

    return new Response(
      JSON.stringify({
        orderId: orderData.order_id,
        paymentSessionId: orderData.payment_session_id,
        orderStatus: orderData.order_status,
        amountToPay,
        unlockedPercent: paymentPercent,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error creating EMI order:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Failed to create EMI order" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
