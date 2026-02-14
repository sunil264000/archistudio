import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  isTest?: boolean;
}

async function logEmail(supabase: any, recipient_email: string, recipient_name: string | null, email_type: string, subject: string, status: string, metadata?: any, error_message?: string) {
  try {
    await supabase.from('email_logs').insert({ recipient_email, recipient_name, email_type, subject, status, metadata, error_message });
  } catch (err) {
    console.error('Failed to log email:', err);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    const { email, name, isTest }: WelcomeEmailRequest = await req.json();
    if (!email) throw new Error("Email is required");

    const userName = name || "there";
    const currentYear = new Date().getFullYear();
    const subject = isTest ? `[TEST] Welcome to Archistudio, ${userName}!` : `Welcome to Archistudio, ${userName}!`;

    const htmlContent = `<!DOCTYPE html>
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
                            <span style="font-size:40px;line-height:80px;">🎉</span>
                          </div>
                          <h1 style="color:#fffdf9;font-size:26px;margin:0 0 8px 0;font-weight:800;letter-spacing:1px;">Welcome Aboard!</h1>
                          <p style="color:#e8d48b;font-size:14px;margin:0;letter-spacing:2px;text-transform:uppercase;">Your Creative Journey Begins Now</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:32px;">
                    <p style="color:#2c1810;font-size:16px;margin:0 0 24px 0;line-height:1.6;">Dear <strong>${userName}</strong>,</p>
                    <p style="color:#5a4a3a;font-size:15px;margin:0 0 28px 0;line-height:1.7;">Thank you for joining Archistudio! We're thrilled to welcome you to our community of aspiring architects and designers. Get ready to master industry-standard skills with our professionally crafted studio programs.</p>

                    <!-- Features Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fefcf3,#fffdf9);border:1.5px solid #c9a84c;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                      <tr>
                        <td style="padding:16px 20px;background:linear-gradient(135deg,#6b1d3a,#4a1228);border-bottom:2px solid #c9a84c;">
                          <span style="font-size:14px;font-weight:700;color:#e8d48b;letter-spacing:2px;">✦ WHAT YOU GET</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr><td style="padding:10px 0;color:#5a4a3a;font-size:14px;border-bottom:1px solid #e8d48b40;">🏛️ Professional architectural visualization studio programs</td></tr>
                            <tr><td style="padding:10px 0;color:#5a4a3a;font-size:14px;border-bottom:1px solid #e8d48b40;">👨‍🏫 Expert instructors with real-world office experience</td></tr>
                            <tr><td style="padding:10px 0;color:#5a4a3a;font-size:14px;border-bottom:1px solid #e8d48b40;">📁 Downloadable project files & studio resources</td></tr>
                            <tr><td style="padding:10px 0;color:#5a4a3a;font-size:14px;">🏆 Proof of Completion upon finishing each program</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- CTA -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td align="center" style="padding:0 0 12px 0;">
                        <a href="https://archistudio.lovable.app/courses" style="display:inline-block;background:linear-gradient(135deg,#6b1d3a,#4a1228);color:#e8d48b;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(107,29,58,0.3);letter-spacing:1px;">
                          Explore Studio Programs →
                        </a>
                      </td></tr>
                    </table>

                    <!-- Warm note -->
                    <div style="margin-top:28px;padding:20px;background:linear-gradient(135deg,#6b1d3a10,#c9a84c10);border-radius:10px;text-align:center;border:1px solid #c9a84c20;">
                      <p style="color:#6b1d3a;font-size:15px;font-style:italic;margin:0;line-height:1.6;">
                        ✦ We're excited to have you. Let's build something amazing together. ✦
                      </p>
                      <p style="color:#8b7355;font-size:13px;margin:10px 0 0 0;">— Team Archistudio</p>
                    </div>
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
        from: "Archistudio <hello@archistudio.shop>",
        to: [email],
        reply_to: "hello@archistudio.shop",
        subject,
        html: htmlContent,
        headers: { "X-Entity-Ref-ID": `welcome-${Date.now()}`, "List-Unsubscribe": "<mailto:unsubscribe@archistudio.shop>" },
      }),
    });

    const resData = await emailResponse.json();
    console.log("Welcome email sent:", resData);
    await logEmail(supabase, email, userName, 'welcome', subject, 'sent', { isTest });

    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
