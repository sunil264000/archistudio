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

    // If payment successful, create enrollment
    if (status === "completed" && paymentData) {
      const { error: enrollmentError } = await supabaseClient
        .from("enrollments")
        .insert({
          user_id: paymentData.user_id,
          course_id: paymentData.course_id,
          payment_id: paymentData.id,
          status: "active",
        });

      if (enrollmentError) {
        console.error("Error creating enrollment:", enrollmentError);
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
