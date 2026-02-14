import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EbookEmailRequest {
  email: string; name: string; bundleName: string; bookCount: number; amount: number; orderId: string; isFullBundle: boolean;
}

async function logEmail(supabase: any, recipientEmail: string, recipientName: string | null, emailType: string, subject: string, status: 'sent' | 'failed', errorMessage: string | null = null, metadata: Record<string, any> = {}) {
  try {
    await supabase.from('email_logs').insert({ recipient_email: recipientEmail, recipient_name: recipientName, email_type: emailType, subject, status, error_message: errorMessage, metadata });
  } catch (err) { console.error('Failed to log email:', err); }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { email, name, bundleName, bookCount, amount, orderId, isFullBundle }: EbookEmailRequest = await req.json();
    if (!email || !bundleName) throw new Error("Email and bundle name are required");

    const userName = name || "there";
    const currentYear = new Date().getFullYear();
    const formattedDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const subject = isFullBundle
      ? `Your Complete Architecture eBook Bundle is Ready`
      : `Your ${bookCount} Architecture eBook${bookCount > 1 ? 's are' : ' is'} Ready`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your eBooks are Ready</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#2d1520;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#2d1520;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 28px 0;">
              <div style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#c9a84c,#e8d48b,#c9a84c);border-radius:10px;">
                <span style="font-size:22px;font-weight:800;color:#2c1810;letter-spacing:2px;">ARCHISTUDIO</span>
              </div>
              <p style="color:#c9a84c80;font-size:11px;margin:10px 0 0 0;letter-spacing:3px;text-transform:uppercase;">Architecture & Design Learning Platform</p>
            </td>
          </tr>

          <!-- Main Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffdf9;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.3);border:2px solid #c9a84c;">

                <!-- Hero -->
                <tr>
                  <td style="padding:0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#6b1d3a,#4a1228,#7a2244);">
                      <tr>
                        <td style="padding:40px 32px;text-align:center;">
                          <div style="width:80px;height:80px;margin:0 auto 16px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#e8d48b,#c9a84c);display:inline-block;line-height:80px;box-shadow:0 4px 20px rgba(201,168,76,0.4);">
                            <span style="font-size:40px;line-height:80px;">📚</span>
                          </div>
                          <h1 style="color:#fffdf9;font-size:26px;margin:0 0 8px 0;font-weight:800;letter-spacing:1px;">Your eBooks are Ready!</h1>
                          <p style="color:#e8d48b;font-size:14px;margin:0;letter-spacing:2px;text-transform:uppercase;">Download & Start Reading</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:32px;">
                    <p style="color:#2c1810;font-size:16px;margin:0 0 24px 0;line-height:1.6;">Dear <strong>${userName}</strong>,</p>
                    <p style="color:#5a4a3a;font-size:15px;margin:0 0 28px 0;line-height:1.7;">Thank you for your purchase! Your eBooks are ready for instant download.</p>

                    <!-- Invoice -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fefcf3,#fffdf9);border:1.5px solid #c9a84c;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                      <tr>
                        <td style="padding:16px 20px;background:linear-gradient(135deg,#6b1d3a,#4a1228);border-bottom:2px solid #c9a84c;">
                          <span style="font-size:14px;font-weight:700;color:#e8d48b;letter-spacing:2px;">📋 PURCHASE INVOICE</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;color:#8b7355;font-size:13px;font-weight:500;border-bottom:1px solid #e8d48b40;">Order ID</td>
                              <td style="padding:10px 0;text-align:right;border-bottom:1px solid #e8d48b40;"><code style="background:#6b1d3a15;padding:4px 10px;border-radius:6px;font-size:12px;font-family:monospace;color:#6b1d3a;font-weight:600;">${orderId}</code></td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;color:#8b7355;font-size:13px;font-weight:500;border-bottom:1px solid #e8d48b40;">Date</td>
                              <td style="padding:10px 0;color:#2c1810;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #e8d48b40;">${formattedDate}</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;color:#8b7355;font-size:13px;font-weight:500;border-bottom:1px solid #e8d48b40;">Package</td>
                              <td style="padding:10px 0;color:#6b1d3a;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #e8d48b40;">${bundleName}</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;color:#8b7355;font-size:13px;font-weight:500;">Books</td>
                              <td style="padding:10px 0;color:#2c1810;font-size:14px;font-weight:600;text-align:right;">${bookCount} eBook${bookCount > 1 ? 's' : ''}</td>
                            </tr>
                          </table>
                          <div style="margin-top:20px;padding:16px 20px;background:linear-gradient(135deg,#6b1d3a10,#c9a84c15);border:1.5px solid #c9a84c;border-radius:10px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="color:#8b7355;font-size:15px;font-weight:600;">Total Paid</td>
                                <td style="color:#6b1d3a;font-size:26px;font-weight:800;text-align:right;">₹${amount.toLocaleString('en-IN')}</td>
                              </tr>
                            </table>
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Access Features -->
                    <p style="color:#2c1810;font-size:15px;margin:0 0 14px 0;font-weight:700;">Your access includes:</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr><td style="padding:7px 0;color:#5a4a3a;font-size:14px;">✦ Download unlimited times</td></tr>
                      <tr><td style="padding:7px 0;color:#5a4a3a;font-size:14px;">✦ Access from any device</td></tr>
                      <tr><td style="padding:7px 0;color:#5a4a3a;font-size:14px;">✦ Lifetime access — no expiry</td></tr>
                    </table>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td align="center" style="padding:0 0 12px 0;">
                        <a href="https://archistudio.lovable.app/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6b1d3a,#4a1228);color:#e8d48b;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(107,29,58,0.3);letter-spacing:1px;">
                          Download Your eBooks →
                        </a>
                      </td></tr>
                    </table>

                    <p style="margin:24px 0 0 0;color:#8b7355;font-size:13px;text-align:center;">Questions? Just reply to this email — we're here to help!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0 0;text-align:center;">
              <p style="margin:0 0 12px 0;">
                <a href="https://instagram.com/archistudio.in" style="color:#c9a84c80;text-decoration:none;margin:0 10px;font-size:13px;">Instagram</a>
                <span style="color:#c9a84c30;">•</span>
                <a href="https://t.me/archistudio_in" style="color:#c9a84c80;text-decoration:none;margin:0 10px;font-size:13px;">Telegram</a>
                <span style="color:#c9a84c30;">•</span>
                <a href="https://archistudio.lovable.app" style="color:#c9a84c80;text-decoration:none;margin:0 10px;font-size:13px;">Website</a>
              </p>
              <p style="color:#c9a84c30;font-size:12px;margin:0;">© ${currentYear} Archistudio. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({
        from: "Archistudio <hello@archistudio.shop>", to: [email], reply_to: "hello@archistudio.shop",
        subject, html: htmlContent,
        headers: { "List-Unsubscribe": "<mailto:unsubscribe@archistudio.shop>", "X-Entity-Ref-ID": `ebook-purchase-${orderId}` },
      }),
    });

    const resData = await emailResponse.json();
    if (emailResponse.ok) {
      console.log("eBook purchase email sent:", resData);
      await logEmail(supabase, email, name, 'ebook_purchase', subject, 'sent', null, { orderId, bundleName, bookCount, amount });
    } else {
      console.error("Failed:", resData);
      await logEmail(supabase, email, name, 'ebook_purchase', subject, 'failed', resData.message || 'Unknown error', { orderId, bundleName });
      throw new Error(resData.message || 'Failed to send email');
    }

    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending eBook email:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
