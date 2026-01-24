import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderRequest {
  ebookIds: string[];
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

// Input validation helpers
function validateName(name: string): boolean {
  return typeof name === 'string' && name.trim().length > 0 && name.length <= 200;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email) && email.length <= 255;
}

function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[0-9]{8,15}$/;
  return typeof phone === 'string' && phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
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

    const {
      ebookIds,
      customerName,
      customerEmail,
      customerPhone,
    }: OrderRequest = await req.json();

    // Validate inputs
    if (!validateName(customerName)) {
      throw new Error("Invalid customer name");
    }
    if (!validateEmail(customerEmail)) {
      throw new Error("Invalid email address");
    }
    if (!validatePhone(customerPhone)) {
      throw new Error("Invalid phone number");
    }
    if (!ebookIds || !Array.isArray(ebookIds) || ebookIds.length === 0) {
      throw new Error("No eBooks selected");
    }

    // Get pricing settings
    const { data: pricingSettings, error: pricingError } = await supabaseClient
      .from("ebook_pricing_settings")
      .select("*")
      .single();

    if (pricingError || !pricingSettings) {
      throw new Error("Pricing settings not found");
    }

    // Get total ebook count for full bundle check
    const { count: totalEbooks } = await supabaseClient
      .from("ebooks")
      .select("*", { count: 'exact', head: true })
      .eq("is_published", true);

    const bookCount = ebookIds.length;
    const isFullBundle = totalEbooks && bookCount === totalEbooks;

    // Calculate server-side price
    let amount = 0;
    if (isFullBundle) {
      amount = pricingSettings.full_bundle_price;
    } else {
      for (let i = 1; i <= bookCount; i++) {
        if (i <= pricingSettings.tier_1_max_books) {
          amount += pricingSettings.tier_1_price;
        } else if (i <= pricingSettings.tier_2_max_books) {
          amount += pricingSettings.tier_2_price;
        } else if (i <= pricingSettings.tier_3_max_books) {
          amount += pricingSettings.tier_3_price;
        } else {
          amount += pricingSettings.tier_4_price;
        }
      }
    }

    if (amount <= 0) {
      throw new Error("Invalid price calculated");
    }

    const appId = Deno.env.get("CASHFREE_APP_ID");
    const secretKey = Deno.env.get("CASHFREE_SECRET_KEY");

    if (!appId || !secretKey) {
      throw new Error("Cashfree credentials not configured");
    }

    // Generate unique order ID
    const orderId = `ebook_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Hardcode production URL for Cashfree whitelisting
    const PUBLISHED_SITE_URL = "https://archistudio.lovable.app";
    const reqOrigin = req.headers.get("origin") || "";
    const redirectBaseUrl = reqOrigin.includes("archistudio.lovable.app")
      ? "https://archistudio.lovable.app"
      : PUBLISHED_SITE_URL;

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
          customer_name: customerName.trim().substring(0, 200),
          customer_email: customerEmail.trim().toLowerCase(),
          customer_phone: customerPhone.replace(/[\s-]/g, ''),
        },
        order_meta: {
          return_url: `${redirectBaseUrl}/ebook-payment-success?order_id={order_id}`,
          cancel_url: `${redirectBaseUrl}/ebook-payment-failed?order_id={order_id}`,
          notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/ebook-payment-webhook`,
        },
        order_note: `eBook Bundle purchase: ${bookCount} books`,
      }),
    });

    const orderData = await cashfreeResponse.json();

    if (!cashfreeResponse.ok) {
      console.error("Cashfree error:", orderData);
      throw new Error(orderData.message || "Failed to create order");
    }

    // Create ebook_purchases record in pending state
    const { error: purchaseError } = await supabaseClient
      .from("ebook_purchases")
      .insert({
        user_id: user.id,
        ebook_ids: ebookIds,
        total_amount: amount,
        is_full_bundle: isFullBundle,
        status: "pending",
        payment_id: orderId,
      });

    if (purchaseError) {
      console.error("Purchase record error:", purchaseError);
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
    console.error("Error creating eBook order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
