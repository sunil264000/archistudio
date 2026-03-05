import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Find abandoned carts older than 1 hour that haven't been emailed
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: carts, error } = await supabase
      .from("abandoned_carts")
      .select("*")
      .eq("email_sent", false)
      .eq("recovered", false)
      .lt("created_at", oneHourAgo)
      .limit(50);

    if (error) throw error;
    if (!carts || carts.length === 0) {
      return new Response(JSON.stringify({ message: "No abandoned carts to process" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    for (const cart of carts) {
      if (!cart.customer_email) continue;

      // Send recovery email
      if (resendApiKey) {
        const siteUrl = supabaseUrl.replace(".supabase.co", "").includes("localhost")
          ? "http://localhost:5173"
          : "https://archistudio.lovable.app";

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #2d1520; color: #ffffff; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #2d1520, #4a1d35); padding: 32px; text-align: center;">
              <h1 style="color: #c9a84c; margin: 0 0 8px;">You left something behind! 🛒</h1>
              <p style="color: #e0d0d6; margin: 0;">Complete your purchase and start learning</p>
            </div>
            <div style="padding: 32px;">
              <div style="background: rgba(201, 168, 76, 0.1); border: 1px solid rgba(201, 168, 76, 0.3); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
                <h3 style="color: #c9a84c; margin: 0 0 8px;">${cart.course_title || cart.course_slug}</h3>
                <p style="color: #e0d0d6; margin: 0;">₹${cart.amount?.toLocaleString()}</p>
              </div>
              <a href="${siteUrl}/course/${cart.course_slug}" style="display: inline-block; background: #c9a84c; color: #2d1520; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                Complete Purchase →
              </a>
              <p style="color: #999; font-size: 12px; margin-top: 24px;">
                This is an automated reminder. If you've already purchased, please ignore this email.
              </p>
            </div>
          </div>
        `;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "Archistudio <noreply@archistudio.shop>",
            to: [cart.customer_email],
            subject: `You left ${cart.course_title || 'a course'} in your cart!`,
            html: emailHtml,
          }),
        });
      }

      // Mark as sent
      await supabase
        .from("abandoned_carts")
        .update({ email_sent: true, updated_at: new Date().toISOString() })
        .eq("id", cart.id);

      sent++;
    }

    return new Response(JSON.stringify({ sent, total: carts.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
