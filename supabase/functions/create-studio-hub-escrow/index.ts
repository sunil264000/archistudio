// Studio Hub — create a Cashfree order to fund a contract escrow
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Body {
  contractId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || "");
const isPhone = (p: string) => /^\+?[0-9]{8,15}$/.test((p || "").replace(/[\s-]/g, ""));

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return json({ error: "Authorization required" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anon = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const appId = Deno.env.get("CASHFREE_APP_ID");
    const secret = Deno.env.get("CASHFREE_SECRET_KEY");
    if (!supabaseUrl || !anon || !service) return json({ error: "Server config error" }, 500);
    if (!appId || !secret) return json({ error: "Cashfree not configured" }, 500);

    const authClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: auth } } });
    const { data: authData, error: authErr } = await authClient.auth.getUser();
    if (authErr || !authData?.user) return json({ error: "Unauthorized" }, 401);
    const user = authData.user;

    const body = (await req.json()) as Body;
    if (!body?.contractId) return json({ error: "Missing contractId" }, 400);
    if (!body.customerName?.trim()) return json({ error: "Invalid name" }, 400);
    if (!isEmail(body.customerEmail)) return json({ error: "Invalid email" }, 400);
    if (!isPhone(body.customerPhone)) return json({ error: "Invalid phone" }, 400);

    const admin = createClient(supabaseUrl, service);

    // Fetch contract & verify caller is the client
    const { data: contract, error: cErr } = await admin
      .from("marketplace_contracts")
      .select("id, client_id, agreed_amount, currency, status, payment_status")
      .eq("id", body.contractId)
      .single();

    if (cErr || !contract) return json({ error: "Contract not found" }, 404);
    if (contract.client_id !== user.id) return json({ error: "Only the client can fund this contract" }, 403);
    if (contract.payment_status === "held_in_escrow" || contract.payment_status === "released") {
      return json({ error: "Contract is already funded" }, 409);
    }

    const orderId = `escrow_${contract.id.slice(0, 8)}_${Date.now()}`;
    const amount = Number(contract.agreed_amount);
    if (!(amount > 0)) return json({ error: "Invalid contract amount" }, 400);

    const cf = await fetch("https://api.cashfree.com/pg/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": appId,
        "x-client-secret": secret,
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: amount,
        order_currency: contract.currency || "INR",
        customer_details: {
          customer_id: user.id,
          customer_name: body.customerName.trim().substring(0, 200),
          customer_email: body.customerEmail.trim().toLowerCase(),
          customer_phone: body.customerPhone.replace(/[\s-]/g, ""),
        },
        order_meta: {
          return_url: `${req.headers.get("origin")}/studio-hub/contracts/${contract.id}?escrow_order={order_id}`,
        },
        order_tags: { kind: "studio_hub_escrow", contract_id: contract.id },
      }),
    });

    const cfData = await cf.json();
    if (!cf.ok) return json({ error: cfData?.message || "Failed to create order" }, 400);

    // Stash the order id on the contract for verification
    await admin
      .from("marketplace_contracts")
      .update({ payment_reference: orderId })
      .eq("id", contract.id);

    return json({ orderId: cfData.order_id, paymentSessionId: cfData.payment_session_id }, 200);
  } catch (e: any) {
    console.error("create-studio-hub-escrow error:", e);
    return json({ error: e?.message || "Failed" }, 400);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
