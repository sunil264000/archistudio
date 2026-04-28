// Studio Hub — verify Cashfree escrow payment and mark the contract as funded
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { orderId, contractId } = await req.json();
    if (!orderId || !contractId) return json({ error: "Missing orderId/contractId" }, 400);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const appId = Deno.env.get("CASHFREE_APP_ID");
    const secret = Deno.env.get("CASHFREE_SECRET_KEY");
    if (!supabaseUrl || !service || !appId || !secret) return json({ error: "Server config" }, 500);

    const admin = createClient(supabaseUrl, service);

    const { data: contract } = await admin
      .from("marketplace_contracts")
      .select("id, payment_status, status, payment_reference")
      .eq("id", contractId)
      .single();
    if (!contract) return json({ status: "not_found" }, 404);

    if (contract.payment_status === "held_in_escrow" || contract.payment_status === "released") {
      return json({ status: "funded" }, 200);
    }

    const cf = await fetch(`https://api.cashfree.com/pg/orders/${orderId}`, {
      headers: { "x-api-version": "2023-08-01", "x-client-id": appId, "x-client-secret": secret },
    });
    const data = await cf.json();
    if (data?.order_status === "PAID") {
      await admin
        .from("marketplace_contracts")
        .update({
          payment_status: "held_in_escrow",
          status: "active",
          payment_reference: orderId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", contractId);
      return json({ status: "funded" }, 200);
    }
    if (data?.order_status === "EXPIRED" || data?.order_status === "TERMINATED") {
      return json({ status: "failed" }, 200);
    }
    return json({ status: "pending" }, 200);
  } catch (e: any) {
    console.error("verify-studio-hub-escrow error:", e);
    return json({ error: e?.message || "Failed" }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
