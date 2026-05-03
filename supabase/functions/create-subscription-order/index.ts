import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { planId, planName, amount, customerName, customerEmail, customerPhone } = await req.json();
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader?.replace('Bearer ', ''));
    if (authError || !user) throw new Error("Unauthorized");

    const orderId = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Prepare metadata for automation
    const metadata = {
      is_subscription: true,
      plan_id: planId,
      plan_name: planName,
      user_id: user.id,
      customer_name: customerName,
      customer_email: customerEmail,
    };

    // Store the payment intent in database
    await supabase.from("payments").insert({
      user_id: user.id,
      amount: amount,
      currency: "INR",
      status: "pending",
      gateway_order_id: orderId,
      payment_type: "subscription",
      metadata: metadata,
    });

    // Create Cashfree order
    const cfResponse = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": Deno.env.get("CASHFREE_APP_ID")!,
        "x-client-secret": Deno.env.get("CASHFREE_SECRET_KEY")!,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_name: customerName || "Customer",
          customer_email: customerEmail,
          customer_phone: customerPhone || "9999999999",
        },
        order_meta: {
          return_url: `${req.headers.get("origin")}/payment-success?order_id={order_id}&subscription=true`,
        },
      }),
    });

    const cfData = await cfResponse.json();
    if (!cfData.payment_session_id) throw new Error(cfData.message || "Failed to create Cashfree order");

    return new Response(JSON.stringify({ 
      payment_session_id: cfData.payment_session_id,
      order_id: orderId 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
