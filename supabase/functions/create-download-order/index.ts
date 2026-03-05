import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData?.user) throw new Error("Unauthorized");

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const user = authData.user;

    const { requestId, customerName, customerEmail, customerPhone } = await req.json();
    if (!requestId) throw new Error("Request ID is required");

    // Fetch the download request
    const { data: request, error: reqError } = await serviceClient
      .from("download_requests")
      .select("*")
      .eq("id", requestId)
      .eq("user_id", user.id)
      .eq("status", "approved_paid")
      .single();

    if (reqError || !request) throw new Error("Download request not found or not approved for payment");
    if (!request.price_set || request.price_set <= 0) throw new Error("Invalid price");

    // Get ebook title
    const { data: ebook } = await serviceClient
      .from("ebooks")
      .select("title")
      .eq("id", request.ebook_id)
      .single();

    const appId = Deno.env.get("CASHFREE_APP_ID");
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");
    if (!appId || !secretKey) throw new Error("Payment gateway not configured");

    const orderId = `dl_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const reqOrigin = req.headers.get("origin") || "";
    let redirectBaseUrl = "https://archistudio.lovable.app";
    if (reqOrigin.includes("archistudio.shop")) redirectBaseUrl = "https://archistudio.shop";

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
        order_amount: request.price_set,
        order_currency: "INR",
        customer_details: {
          customer_id: user.id,
          customer_name: (customerName || "").trim().substring(0, 200) || "User",
          customer_email: (customerEmail || user.email || "").trim().toLowerCase(),
          customer_phone: (customerPhone || "9999999999").replace(/[\s-]/g, ""),
        },
        order_meta: {
          return_url: `${redirectBaseUrl}/ebooks?download_payment=success&request_id=${requestId}&order_id={order_id}`,
          cancel_url: `${redirectBaseUrl}/ebooks?download_payment=failed&request_id=${requestId}`,
          notify_url: `${supabaseUrl}/functions/v1/download-payment-webhook`,
        },
        order_note: `eBook download: ${ebook?.title || "eBook"}`,
      }),
    });

    const orderData = await cashfreeResponse.json();
    if (!cashfreeResponse.ok) throw new Error(orderData.message || "Failed to create payment order");

    // Update request with order ID
    await serviceClient.from("download_requests").update({
      payment_order_id: orderId,
      updated_at: new Date().toISOString(),
    }).eq("id", requestId);

    return new Response(JSON.stringify({
      orderId: orderData.order_id,
      paymentSessionId: orderData.payment_session_id,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Download order error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Failed to create order" }), {
      status: error?.message === "Unauthorized" ? 401 : 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
