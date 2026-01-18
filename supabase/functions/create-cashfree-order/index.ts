import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRequest {
  courseId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
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

    const { courseId, amount, customerName, customerEmail, customerPhone }: OrderRequest = await req.json();

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
          return_url: `${req.headers.get("origin")}/payment-success?order_id={order_id}`,
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
        course_id: courseId,
        amount: amount,
        currency: "INR",
        status: "pending",
        payment_gateway: "cashfree",
        gateway_order_id: orderId,
      });

    if (paymentError) {
      console.error("Payment record error:", paymentError);
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
