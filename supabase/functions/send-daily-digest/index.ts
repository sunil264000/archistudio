import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get unsent purchase digest entries
    const { data: purchases, error: fetchErr } = await supabaseAdmin
      .from('admin_purchase_digest')
      .select('*')
      .eq('digest_sent', false)
      .order('created_at', { ascending: true });

    if (fetchErr) throw fetchErr;

    if (!purchases || purchases.length === 0) {
      console.log("No new purchases to digest.");
      return new Response(JSON.stringify({ success: true, message: 'No purchases to report' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get admin emails
    const { data: adminRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify({ success: true, skipped: 'no_admins' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminUserIds = adminRoles.map(r => r.user_id);
    const { data: adminProfiles } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .in('user_id', adminUserIds);

    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) as string[];
    if (!adminEmails.length) {
      return new Response(JSON.stringify({ success: true, skipped: 'no_admin_emails' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build digest
    const totalRevenue = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
    const coursePurchases = purchases.filter(p => p.item_type === 'course');
    const ebookPurchases = purchases.filter(p => p.item_type === 'ebook');
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });

    const buildRows = (items: typeof purchases) => items.map(p => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e8d48b30;color:#2c1810;font-size:14px;">${p.buyer_name || p.buyer_email}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8d48b30;color:#5a4a3a;font-size:14px;">${p.item_name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e8d48b30;color:#16a34a;font-weight:700;font-size:14px;text-align:right;">₹${Number(p.amount).toLocaleString('en-IN')}</td>
      </tr>
    `).join('');

    const subject = `📊 Daily Sales Report — ${today} | ${purchases.length} sale${purchases.length > 1 ? 's' : ''} • ₹${totalRevenue.toLocaleString('en-IN')}`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#2d1520;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#2d1520;padding:40px 16px;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;">

        <!-- Logo -->
        <tr><td align="center" style="padding:0 0 28px 0;">
          <div style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#c9a84c,#e8d48b,#c9a84c);border-radius:10px;">
            <span style="font-size:22px;font-weight:800;color:#2c1810;letter-spacing:2px;">ARCHISTUDIO</span>
          </div>
          <p style="color:#c9a84c80;font-size:11px;margin:10px 0 0 0;letter-spacing:3px;text-transform:uppercase;">Daily Sales Digest</p>
        </td></tr>

        <!-- Main Card -->
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffdf9;border-radius:16px;overflow:hidden;border:2px solid #c9a84c;">

            <!-- Header -->
            <tr><td style="padding:32px;background:linear-gradient(135deg,#6b1d3a,#4a1228);">
              <h1 style="color:#fffdf9;font-size:24px;margin:0 0 8px 0;font-weight:800;">📊 Daily Sales Report</h1>
              <p style="color:#e8d48b;font-size:14px;margin:0;">${today}</p>
            </td></tr>

            <!-- Summary -->
            <tr><td style="padding:24px 32px 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:16px;background:linear-gradient(135deg,#16a34a15,#16a34a08);border:1.5px solid #16a34a40;border-radius:12px;text-align:center;width:33%;">
                    <p style="color:#8b7355;font-size:12px;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:1px;">Total Revenue</p>
                    <p style="color:#16a34a;font-size:28px;font-weight:800;margin:0;">₹${totalRevenue.toLocaleString('en-IN')}</p>
                  </td>
                  <td style="width:12px;"></td>
                  <td style="padding:16px;background:linear-gradient(135deg,#6b1d3a10,#6b1d3a05);border:1.5px solid #6b1d3a30;border-radius:12px;text-align:center;width:33%;">
                    <p style="color:#8b7355;font-size:12px;margin:0 0 4px 0;text-transform:uppercase;letter-spacing:1px;">Total Sales</p>
                    <p style="color:#6b1d3a;font-size:28px;font-weight:800;margin:0;">${purchases.length}</p>
                  </td>
                </tr>
              </table>
            </td></tr>

            ${coursePurchases.length > 0 ? `
            <!-- Course Purchases -->
            <tr><td style="padding:24px 32px 0 32px;">
              <h2 style="color:#2c1810;font-size:16px;font-weight:700;margin:0 0 12px 0;">🎓 Course Purchases (${coursePurchases.length})</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8d48b40;border-radius:10px;overflow:hidden;">
                <tr style="background:#6b1d3a10;">
                  <td style="padding:10px 12px;font-weight:700;font-size:12px;color:#8b7355;text-transform:uppercase;letter-spacing:1px;">Student</td>
                  <td style="padding:10px 12px;font-weight:700;font-size:12px;color:#8b7355;text-transform:uppercase;letter-spacing:1px;">Course</td>
                  <td style="padding:10px 12px;font-weight:700;font-size:12px;color:#8b7355;text-transform:uppercase;letter-spacing:1px;text-align:right;">Amount</td>
                </tr>
                ${buildRows(coursePurchases)}
              </table>
            </td></tr>` : ''}

            ${ebookPurchases.length > 0 ? `
            <!-- eBook Purchases -->
            <tr><td style="padding:24px 32px 0 32px;">
              <h2 style="color:#2c1810;font-size:16px;font-weight:700;margin:0 0 12px 0;">📚 eBook Purchases (${ebookPurchases.length})</h2>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8d48b40;border-radius:10px;overflow:hidden;">
                <tr style="background:#6b1d3a10;">
                  <td style="padding:10px 12px;font-weight:700;font-size:12px;color:#8b7355;text-transform:uppercase;letter-spacing:1px;">Buyer</td>
                  <td style="padding:10px 12px;font-weight:700;font-size:12px;color:#8b7355;text-transform:uppercase;letter-spacing:1px;">Bundle</td>
                  <td style="padding:10px 12px;font-weight:700;font-size:12px;color:#8b7355;text-transform:uppercase;letter-spacing:1px;text-align:right;">Amount</td>
                </tr>
                ${buildRows(ebookPurchases)}
              </table>
            </td></tr>` : ''}

            <tr><td style="padding:28px 32px;">
              <p style="color:#8b7355;font-size:13px;margin:0;text-align:center;">This is your automated daily sales digest. Purchases are tracked in your admin dashboard in real-time.</p>
            </td></tr>

          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 0 0 0;text-align:center;">
          <p style="color:#c9a84c30;font-size:12px;margin:0;">© ${new Date().getFullYear()} Archistudio — Automated Daily Digest</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // Send digest email
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Archistudio Reports <hello@archistudio.shop>",
        to: adminEmails,
        subject,
        html: htmlContent,
        headers: { "X-Entity-Ref-ID": `daily-digest-${Date.now()}` },
      }),
    });

    const resData = await emailRes.json();
    console.log("Daily digest sent:", resData);

    // Mark all as sent
    const purchaseIds = purchases.map(p => p.id);
    await supabaseAdmin
      .from('admin_purchase_digest')
      .update({ digest_sent: true })
      .in('id', purchaseIds);

    // Log the email
    await supabaseAdmin.from('email_logs').insert({
      recipient_email: adminEmails.join(', '),
      email_type: 'daily_digest',
      subject,
      status: emailRes.ok ? 'sent' : 'failed',
      metadata: { purchase_count: purchases.length, total_revenue: totalRevenue },
    });

    return new Response(JSON.stringify({ success: true, purchases_reported: purchases.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Daily digest error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
