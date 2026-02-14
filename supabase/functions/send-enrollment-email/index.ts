import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EnrollmentEmailRequest {
  email: string;
  name: string;
  courseName: string;
  courseSlug: string;
  isFree: boolean;
  isGift?: boolean;
  isTest?: boolean;
  amount?: number;
  orderId?: string;
  paymentDate?: string;
}

async function logEmail(supabase: any, recipient_email: string, recipient_name: string | null, email_type: string, subject: string, status: string, metadata?: any, error_message?: string) {
  try {
    await supabase.from('email_logs').insert({ recipient_email, recipient_name, email_type, subject, status, metadata, error_message });
  } catch (err) {
    console.error('Failed to log email:', err);
  }
}

function buildEmailHTML(params: {
  userName: string; courseName: string; courseSlug: string; isFree: boolean; isGift?: boolean;
  isTest?: boolean; amount?: number; orderId?: string; formattedDate: string; currentYear: number;
}) {
  const { userName, courseName, courseSlug, isFree, isGift, isTest, amount, orderId, formattedDate, currentYear } = params;
  const testBadge = isTest ? ' [TEST]' : '';
  const courseUrl = `https://archistudio.lovable.app/learn/${courseSlug}`;
  const dashboardUrl = `https://archistudio.lovable.app/dashboard`;

  const invoiceRow = (label: string, value: string, isLast = false) => `
    <tr>
      <td style="padding:12px 16px;color:#8b7355;font-size:13px;font-weight:500;border-bottom:${isLast ? 'none' : '1px solid #e8d48b40'};">${label}</td>
      <td style="padding:12px 16px;color:#2c1810;font-size:14px;font-weight:600;text-align:right;border-bottom:${isLast ? 'none' : '1px solid #e8d48b40'};">${value}</td>
    </tr>`;

  let subject: string, heroIcon: string, heroTitle: string, heroSubtitle: string, invoiceSection: string;

  if (isGift) {
    subject = `🎁 You've Received a Gift! Free Access to ${courseName}${testBadge}`;
    heroIcon = '🎁'; heroTitle = "You've Received a Gift!"; heroSubtitle = "Complimentary access has been granted to you.";
    invoiceSection = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fefcf3,#fffdf9);border:1.5px solid #c9a84c;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <tr><td style="padding:16px 20px;background:linear-gradient(135deg,#6b1d3a,#4a1228);border-bottom:2px solid #c9a84c;">
          <span style="font-size:14px;font-weight:700;color:#e8d48b;letter-spacing:2px;">🎁 GIFT ACCESS</span>
        </td></tr>
        <tr><td style="padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${invoiceRow('Studio Program', courseName)}
            ${invoiceRow('Date Granted', formattedDate)}
            ${invoiceRow('Access Type', '🎓 Lifetime', true)}
          </table>
          <div style="margin-top:16px;text-align:center;padding:14px;background:linear-gradient(135deg,#6b1d3a10,#c9a84c10);border:1px solid #c9a84c30;border-radius:8px;">
            <span style="color:#6b1d3a;font-size:18px;font-weight:700;">FREE — Complimentary Gift ✦</span>
          </div>
        </td></tr>
      </table>`;
  } else if (isFree) {
    subject = `You're enrolled in ${courseName}! 🎓${testBadge}`;
    heroIcon = '🎓'; heroTitle = "You're Enrolled!"; heroSubtitle = "Start your learning journey right away.";
    invoiceSection = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fefcf3,#fffdf9);border:1.5px solid #c9a84c;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <tr><td style="padding:16px 20px;background:linear-gradient(135deg,#6b1d3a,#4a1228);border-bottom:2px solid #c9a84c;">
          <span style="font-size:14px;font-weight:700;color:#e8d48b;letter-spacing:2px;">🎓 ENROLLMENT DETAILS</span>
        </td></tr>
        <tr><td style="padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${invoiceRow('Studio Program', courseName)}
            ${invoiceRow('Enrolled On', formattedDate)}
            ${invoiceRow('Access Type', '🎓 Lifetime', true)}
          </table>
          <div style="margin-top:16px;text-align:center;padding:14px;background:linear-gradient(135deg,#6b1d3a10,#c9a84c10);border:1px solid #c9a84c30;border-radius:8px;">
            <span style="color:#6b1d3a;font-size:16px;font-weight:700;">FREE STUDIO PROGRAM</span>
          </div>
        </td></tr>
      </table>`;
  } else {
    subject = `✅ Payment Confirmed — ${courseName}${testBadge}`;
    heroIcon = '✅'; heroTitle = "Payment Successful!"; heroSubtitle = "Your access is now active.";
    const displayOrderId = orderId || 'N/A';
    invoiceSection = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fefcf3,#fffdf9);border:1.5px solid #c9a84c;border-radius:12px;overflow:hidden;margin-bottom:24px;">
        <tr><td style="padding:16px 20px;background:linear-gradient(135deg,#6b1d3a,#4a1228);border-bottom:2px solid #c9a84c;">
          <span style="font-size:14px;font-weight:700;color:#e8d48b;letter-spacing:2px;">📋 PAYMENT INVOICE</span>
        </td></tr>
        <tr><td style="padding:20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${invoiceRow('Order ID', `<code style="background:#6b1d3a15;padding:4px 10px;border-radius:6px;font-size:12px;font-family:monospace;color:#6b1d3a;font-weight:600;">${displayOrderId}</code>`)}
            ${invoiceRow('Date', formattedDate)}
            ${invoiceRow('Studio Program', courseName)}
            ${invoiceRow('Payment Method', 'Cashfree', true)}
          </table>
          <div style="margin-top:20px;padding:16px 20px;background:linear-gradient(135deg,#6b1d3a10,#c9a84c15);border:1.5px solid #c9a84c;border-radius:10px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#8b7355;font-size:15px;font-weight:600;">Total Paid</td>
                <td style="color:#6b1d3a;font-size:26px;font-weight:800;text-align:right;">₹${(amount || 0).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>
          <p style="margin:12px 0 0 0;color:#8b7355;font-size:12px;text-align:center;">✓ Payment received. This serves as your official receipt.</p>
        </td></tr>
      </table>`;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
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
                            <span style="font-size:40px;line-height:80px;">${heroIcon}</span>
                          </div>
                          <h1 style="color:#fffdf9;font-size:26px;margin:0 0 8px 0;font-weight:800;letter-spacing:1px;">${heroTitle}</h1>
                          <p style="color:#e8d48b;font-size:14px;margin:0;letter-spacing:2px;text-transform:uppercase;">${heroSubtitle}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:32px;">
                    <p style="color:#2c1810;font-size:16px;margin:0 0 24px 0;line-height:1.6;">Dear <strong>${userName}</strong>,</p>

                    ${invoiceSection}

                    <!-- Course Access -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#6b1d3a08;border:1px solid #c9a84c20;border-radius:12px;margin-bottom:24px;">
                      <tr><td style="padding:20px;">
                        <p style="color:#5a4a3a;font-size:15px;margin:0 0 12px 0;">You now have <strong style="color:#6b1d3a;">lifetime access</strong> to:</p>
                        <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffdf9;border:1.5px solid #c9a84c40;border-radius:8px;">
                          <tr><td style="padding:16px;">
                            <p style="color:#6b1d3a;font-size:17px;font-weight:700;margin:0 0 6px 0;">${courseName}</p>
                            <p style="color:#8b7355;margin:0;font-size:13px;">All sessions • Downloadable resources • Proof of Completion</p>
                          </td></tr>
                        </table>
                      </td></tr>
                    </table>

                    <!-- Next Steps -->
                    <p style="color:#2c1810;font-size:15px;margin:0 0 14px 0;font-weight:700;">What you can do next:</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr><td style="padding:7px 0;color:#5a4a3a;font-size:14px;">✦ Start practicing at your own pace</td></tr>
                      <tr><td style="padding:7px 0;color:#5a4a3a;font-size:14px;">✦ Track your progress in the dashboard</td></tr>
                      <tr><td style="padding:7px 0;color:#5a4a3a;font-size:14px;">✦ Download studio resources & project files</td></tr>
                      <tr><td style="padding:7px 0;color:#5a4a3a;font-size:14px;">✦ Earn your Proof of Completion</td></tr>
                    </table>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td align="center" style="padding:0 0 12px 0;">
                        <a href="${courseUrl}" style="display:inline-block;background:linear-gradient(135deg,#6b1d3a,#4a1228);color:#e8d48b;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(107,29,58,0.3);letter-spacing:1px;">
                          Start Learning Now →
                        </a>
                      </td></tr>
                      <tr><td align="center">
                        <a href="${dashboardUrl}" style="color:#c9a84c;font-size:13px;text-decoration:underline;">or go to your Dashboard</a>
                      </td></tr>
                    </table>

                    <p style="margin:28px 0 0 0;color:#8b7355;font-size:13px;text-align:center;">Need help? Reply to this email or visit our <a href="https://archistudio.lovable.app/contact" style="color:#6b1d3a;text-decoration:none;font-weight:600;">support page</a>.</p>
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

  return { subject, html };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    const { email, name, courseName, courseSlug, isFree, isGift, isTest, amount, orderId, paymentDate }: EnrollmentEmailRequest = await req.json();
    if (!email || !courseName) throw new Error("Email and course name are required");

    const userName = name || "there";
    const currentYear = new Date().getFullYear();
    const formattedDate = (paymentDate ? new Date(paymentDate) : new Date()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const { subject, html } = buildEmailHTML({ userName, courseName, courseSlug, isFree, isGift, isTest, amount, orderId, formattedDate, currentYear });

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: "Archistudio <hello@archistudio.shop>", to: [email], subject, html }),
    });

    const resData = await emailResponse.json();
    console.log("Enrollment email sent:", resData);
    const emailType = isGift ? 'gift' : 'enrollment';
    await logEmail(supabase, email, userName, emailType, subject, 'sent', { courseName, isFree, isGift, isTest });

    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending enrollment email:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
