import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const { data: { order } } = body;

    if (!order) throw new Error("No order data in webhook");

    const orderId = order.order_id;
    const orderStatus = order.order_status;

    // Only process download orders (prefixed with dl_)
    if (!orderId?.startsWith("dl_")) {
      return new Response(JSON.stringify({ message: "Not a download order" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Replay protection: check timestamp
    const eventTime = new Date(body.event_time || body.data?.payment?.payment_time || Date.now());
    const now = new Date();
    if (Math.abs(now.getTime() - eventTime.getTime()) > 300000) {
      console.warn("Stale webhook event, ignoring:", orderId);
      return new Response(JSON.stringify({ message: "Stale event" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    if (orderStatus === "PAID") {
      // Verify with Cashfree
      const appId = Deno.env.get("CASHFREE_APP_ID");
      const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");

      if (appId && secretKey) {
        const verifyResponse = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
          headers: {
            "x-api-version": "2023-08-01",
            "x-client-id": appId,
            "x-client-secret": secretKey,
          },
        });
        const verifyData = await verifyResponse.json();
        
        if (verifyData.order_status !== "PAID") {
          console.error("Payment verification failed for", orderId);
          return new Response(JSON.stringify({ error: "Verification failed" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Find and update the download request
      const { data: request, error } = await supabaseClient
        .from("download_requests")
        .select("*")
        .eq("payment_order_id", orderId)
        .single();

      if (error || !request) {
        console.error("Download request not found for order:", orderId);
        return new Response(JSON.stringify({ error: "Request not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Grant download access
      await supabaseClient.from("download_requests").update({
        status: "paid",
        payment_verified: true,
        download_granted: true,
        updated_at: new Date().toISOString(),
      }).eq("id", request.id);

      // Notify user
      const { data: ebook } = await supabaseClient
        .from("ebooks")
        .select("title")
        .eq("id", request.ebook_id)
        .single();

      await supabaseClient.from("notifications").insert({
        user_id: request.user_id,
        title: "Download Ready!",
        message: `Payment verified! You can now download "${ebook?.title || "your eBook"}". Go to eBooks to download.`,
        type: "download_request",
        action_url: "/ebooks",
      });

      console.log("Download payment verified for request:", request.id);
    }

    return new Response(JSON.stringify({ message: "Webhook processed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Download webhook error:", error);
    return new Response(JSON.stringify({ error: error?.message || "Webhook error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
