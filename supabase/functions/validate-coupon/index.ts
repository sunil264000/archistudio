import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ValidateCouponRequest {
  code: string;
  courseId?: string;
  amount?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { code, courseId, amount }: ValidateCouponRequest = await req.json();

    // Validate inputs
    if (!code || typeof code !== "string" || code.length > 50) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Invalid code format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    // Query coupon by code (case-insensitive)
    const { data: coupon, error } = await supabase
      .from("coupons")
      .select("id, discount_type, discount_value, max_uses, used_count, applicable_course_id, min_purchase_amount, valid_from, valid_until")
      .ilike("code", code.trim())
      .eq("is_active", true)
      .single();

    if (error || !coupon) {
      console.log("Coupon lookup failed:", error?.message || "Not found");
      return new Response(
        JSON.stringify({ valid: false, reason: "Invalid or expired code" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check date validity
    if (coupon.valid_from && new Date(coupon.valid_from) > new Date(now)) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Coupon not yet active" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < new Date(now)) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Coupon has expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check usage limit
    if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Coupon usage limit reached" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check course applicability
    if (coupon.applicable_course_id && courseId && coupon.applicable_course_id !== courseId) {
      return new Response(
        JSON.stringify({ valid: false, reason: "Coupon not applicable to this course" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check minimum purchase amount
    if (coupon.min_purchase_amount && amount && amount < Number(coupon.min_purchase_amount)) {
      return new Response(
        JSON.stringify({
          valid: false,
          reason: `Minimum purchase amount of ₹${coupon.min_purchase_amount} required`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return only necessary info (not the coupon code or ID)
    return new Response(
      JSON.stringify({
        valid: true,
        discount_type: coupon.discount_type,
        discount_value: Number(coupon.discount_value),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Validate coupon error:", error);
    return new Response(
      JSON.stringify({ valid: false, reason: "Validation failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
