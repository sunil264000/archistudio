// Cashfree webhook receiver — verifies signature, logs raw event, updates contracts
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const secret = Deno.env.get("CASHFREE_SECRET_KEY") ?? "";
  const admin = createClient(supabaseUrl, service);

  const rawBody = await req.text();
  const sig = req.headers.get("x-webhook-signature") || "";
  const ts = req.headers.get("x-webhook-timestamp") || "";

  // Cashfree signs: base64( hmac_sha256(secret, ts + rawBody) )
  let signatureValid = false;
  try {
    if (secret && ts) {
      const computed = createHmac("sha256", secret).update(ts + rawBody).digest("base64");
      signatureValid = computed === sig;
    }
  } catch (_) { /* ignore */ }

  let payload: any = {};
  try { payload = JSON.parse(rawBody); } catch (_) { payload = { raw: rawBody }; }

  const orderId: string | undefined = payload?.data?.order?.order_id || payload?.data?.order_id;
  const eventType: string = payload?.type || payload?.event || "unknown";

  // Look up contract by payment_reference
  let contractId: string | null = null;
  if (orderId) {
    const { data: c } = await admin
      .from("marketplace_contracts")
      .select("id, agreed_amount, escrow_total_funded")
      .eq("payment_reference", orderId)
      .maybeSingle();
    if (c) contractId = c.id;
  }

  // Log event regardless
  const { data: log } = await admin.from("cashfree_webhook_events").insert({
    event_type: eventType,
    order_id: orderId || null,
    signature_valid: signatureValid,
    raw_payload: payload,
    contract_id: contractId,
  }).select("id").single();

  // If verified + matches a contract + signals payment success, mark held_in_escrow
  let processingError: string | null = null;
  try {
    if (signatureValid && contractId && /payment.*success|order.*paid/i.test(eventType)) {
      const amount = Number(payload?.data?.payment?.payment_amount || payload?.data?.order?.order_amount || 0);
      await admin.from("marketplace_contracts").update({
        status: "active",
        payment_status: "held_in_escrow",
        escrow_total_funded: amount,
      }).eq("id", contractId);
    }
  } catch (e: any) {
    processingError = e?.message || "Unknown processing error";
  }

  if (log?.id) {
    await admin.from("cashfree_webhook_events").update({
      processed: !processingError,
      processing_error: processingError,
    }).eq("id", log.id);
  }

  return new Response(JSON.stringify({ ok: true, signatureValid }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
