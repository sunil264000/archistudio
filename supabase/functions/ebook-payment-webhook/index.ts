import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verify Cashfree webhook signature
async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  timestamp: string | null,
  secretKey: string
): Promise<boolean> {
  if (!signature || !timestamp) {
    console.error("Missing signature or timestamp headers");
    return false;
  }

  // Check timestamp is not too old (5 minutes)
  const webhookTime = parseInt(timestamp, 10);
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - webhookTime) > 300) {
    console.error("Webhook timestamp too old");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureData = encoder.encode(timestamp + rawBody);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, signatureData);
    
    const computedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer))
    );

    return signature === computedSignature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");
    
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");
    
    if (!secretKey) {
      console.error("CASHFREE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify webhook signature
    const isValid = await verifyWebhookSignature(rawBody, signature, timestamp, secretKey);
    
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const payload = JSON.parse(rawBody);
    console.log("eBook webhook received (verified):", JSON.stringify(payload));

    const { data } = payload;
    
    if (!data || !data.order) {
      throw new Error("Invalid webhook payload");
    }

    const orderId = data.order.order_id;
    const paymentStatus = data.payment?.payment_status;

    // Map Cashfree status to our status
    let status = "pending";
    if (paymentStatus === "SUCCESS") {
      status = "completed";
    } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
      status = "failed";
    }

    // Check if already processed (idempotency)
    const { data: existingPurchase } = await supabaseClient
      .from("ebook_purchases")
      .select("id, status, user_id, ebook_ids, total_amount, is_full_bundle")
      .eq("payment_id", orderId)
      .single();

    if (existingPurchase?.status === "completed") {
      console.log("eBook purchase already processed, skipping:", orderId);
      return new Response(
        JSON.stringify({ success: true, message: "Already processed" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update purchase record
    const { error: updateError } = await supabaseClient
      .from("ebook_purchases")
      .update({
        status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("payment_id", orderId);

    if (updateError) {
      console.error("Error updating ebook purchase:", updateError);
      throw updateError;
    }

    // If payment successful, send confirmation email
    if (status === "completed" && existingPurchase) {
      // Get user profile for email
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("email, full_name")
        .eq("user_id", existingPurchase.user_id)
        .single();

      if (profile?.email) {
        // Send ebook purchase confirmation email
        const baseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
        
        const bookCount = existingPurchase.ebook_ids?.length || 0;
        const bundleText = existingPurchase.is_full_bundle 
          ? "Complete Architecture eBook Bundle" 
          : `${bookCount} Architecture eBook${bookCount > 1 ? 's' : ''}`;

        fetch(`${baseUrl}/functions/v1/send-ebook-purchase-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            email: profile.email,
            name: profile.full_name || "",
            bundleName: bundleText,
            bookCount: bookCount,
            amount: existingPurchase.total_amount,
            orderId: orderId,
            isFullBundle: existingPurchase.is_full_bundle,
          }),
        }).catch(err => console.error("eBook email error:", err));
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
    console.error("eBook webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
