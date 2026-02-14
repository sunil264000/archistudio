import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerificationEmailRequest {
  email: string;
  name?: string;
  verificationCode: string;
  isTest?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, verificationCode, isTest }: VerificationEmailRequest = await req.json();
    if (!email || !verificationCode) throw new Error("Email and verification code are required");

    const userName = name || "there";
    const currentYear = new Date().getFullYear();
    const subject = isTest ? `[TEST] Your Archistudio Verification Code: ${verificationCode}` : `Your Archistudio Verification Code: ${verificationCode}`;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
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
              <p style="color:#c9a84c80;font-size:11px;margin:10px 0 0 0;letter-spacing:3px;text-transform:uppercase;">Email Verification</p>
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
                        <td style="padding:36px 32px;text-align:center;">
                          <div style="width:72px;height:72px;margin:0 auto 14px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#e8d48b,#c9a84c);display:inline-block;line-height:72px;box-shadow:0 4px 20px rgba(201,168,76,0.4);">
                            <span style="font-size:36px;line-height:72px;">🔐</span>
                          </div>
                          <h1 style="color:#fffdf9;font-size:24px;margin:0 0 6px 0;font-weight:800;">Verify Your Email</h1>
                          <p style="color:#e8d48b;font-size:13px;margin:0;letter-spacing:1.5px;">Enter the code below to continue</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:32px;">
                    <p style="color:#5a4a3a;font-size:15px;margin:0 0 28px 0;line-height:1.7;text-align:center;">
                      Hi <strong style="color:#2c1810;">${userName}</strong>, use this verification code to complete your registration.
                    </p>

                    <!-- Code Box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr>
                        <td align="center">
                          <div style="display:inline-block;background:linear-gradient(135deg,#fefcf3,#fffdf9);border:2.5px dashed #c9a84c;border-radius:16px;padding:24px 48px;font-size:36px;font-weight:800;letter-spacing:12px;color:#6b1d3a;font-family:'Courier New',Courier,monospace;">
                            ${verificationCode}
                          </div>
                        </td>
                      </tr>
                    </table>

                    <!-- Timer -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#6b1d3a10;border:1px solid #c9a84c30;border-radius:10px;margin-bottom:20px;">
                      <tr>
                        <td style="padding:14px 20px;text-align:center;">
                          <span style="color:#6b1d3a;font-size:14px;font-weight:600;">⏱ This code expires in <strong>10 minutes</strong></span>
                        </td>
                      </tr>
                    </table>

                    <!-- Spam Tip -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#c9a84c10;border:1px solid #c9a84c20;border-radius:10px;margin-bottom:20px;">
                      <tr>
                        <td style="padding:14px 20px;text-align:center;">
                          <span style="color:#8b7355;font-size:13px;">💡 <strong>Tip:</strong> Check your Spam or Junk folder if you don't see this email.</span>
                        </td>
                      </tr>
                    </table>

                    <p style="color:#8b7355;font-size:13px;line-height:1.6;margin:0;text-align:center;">
                      If you didn't request this, you can safely ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 0 0 0;text-align:center;">
              <p style="margin:0 0 12px 0;">
                <a href="https://archistudio.lovable.app" style="color:#c9a84c80;text-decoration:none;font-size:13px;">Visit Archistudio</a>
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
        headers: { "X-Entity-Ref-ID": `verification-${Date.now()}` },
      }),
    });

    const resData = await emailResponse.json();
    console.log("Verification email sent:", resData);

    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
