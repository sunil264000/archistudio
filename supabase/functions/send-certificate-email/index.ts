import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    const { email, name, courseName, certificateNumber, issueDate } = await req.json();

    if (!email || !courseName || !certificateNumber) {
      throw new Error("email, courseName, and certificateNumber are required");
    }

    const userName = name || "there";
    const formattedDate = issueDate
      ? new Date(issueDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const currentYear = new Date().getFullYear();
    const verifyUrl = `https://archistudio.shop/verify/${certificateNumber}`;
    const dashboardUrl = `https://archistudio.lovable.app/dashboard`;

    const subject = `🏆 Congratulations ${userName}! Your Proof of Completion is Ready`;

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

                <!-- Maroon hero header -->
                <tr>
                  <td style="padding:0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#6b1d3a,#4a1228,#7a2244);">
                      <tr>
                        <td style="padding:40px 32px;text-align:center;">
                          <!-- Gold award circle -->
                          <div style="width:80px;height:80px;margin:0 auto 16px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#e8d48b,#c9a84c);display:inline-block;line-height:80px;box-shadow:0 4px 20px rgba(201,168,76,0.4);">
                            <span style="font-size:40px;line-height:80px;">🏆</span>
                          </div>
                          <h1 style="color:#fffdf9;font-size:26px;margin:0 0 8px 0;font-weight:800;letter-spacing:1px;">Congratulations!</h1>
                          <p style="color:#e8d48b;font-size:14px;margin:0;letter-spacing:2px;text-transform:uppercase;">You've Earned Your Proof of Completion</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding:32px;">

                    <!-- Greeting -->
                    <p style="color:#2c1810;font-size:16px;margin:0 0 24px 0;line-height:1.6;">Dear <strong>${userName}</strong>,</p>
                    <p style="color:#5a4a3a;font-size:15px;margin:0 0 28px 0;line-height:1.7;">We are delighted to inform you that you have successfully completed your studio program. Your dedication and commitment to mastering professional architecture skills is truly commendable.</p>

                    <!-- Certificate Details Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fefcf3,#fffdf9);border:1.5px solid #c9a84c;border-radius:12px;overflow:hidden;margin-bottom:28px;">
                      <tr>
                        <td style="padding:16px 20px;background:linear-gradient(135deg,#6b1d3a,#4a1228);border-bottom:2px solid #c9a84c;">
                          <span style="font-size:14px;font-weight:700;color:#e8d48b;letter-spacing:2px;">📜 PROOF OF COMPLETION</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="padding:10px 0;color:#8b7355;font-size:13px;font-weight:500;border-bottom:1px solid #e8d48b40;">Awarded To</td>
                              <td style="padding:10px 0;color:#2c1810;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #e8d48b40;">${userName}</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;color:#8b7355;font-size:13px;font-weight:500;border-bottom:1px solid #e8d48b40;">Studio Program</td>
                              <td style="padding:10px 0;color:#6b1d3a;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #e8d48b40;">${courseName}</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;color:#8b7355;font-size:13px;font-weight:500;border-bottom:1px solid #e8d48b40;">Date of Completion</td>
                              <td style="padding:10px 0;color:#2c1810;font-size:14px;font-weight:600;text-align:right;border-bottom:1px solid #e8d48b40;">${formattedDate}</td>
                            </tr>
                            <tr>
                              <td style="padding:10px 0;color:#8b7355;font-size:13px;font-weight:500;">Certificate No.</td>
                              <td style="padding:10px 0;text-align:right;">
                                <code style="background:#6b1d3a15;padding:4px 10px;border-radius:6px;font-size:12px;font-family:monospace;color:#6b1d3a;font-weight:600;">${certificateNumber}</code>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- What's next -->
                    <p style="color:#2c1810;font-size:15px;margin:0 0 14px 0;font-weight:700;">What you can do next:</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                      <tr><td style="padding:7px 0;color:#5a4a3a;font-size:14px;">🏆 Download your certificate from the Dashboard</td></tr>
                      <tr><td style="padding:7px 0;color:#5a4a3a;font-size:14px;">🔗 Share your verified credential with employers</td></tr>
                      <tr><td style="padding:7px 0;color:#5a4a3a;font-size:14px;">📚 Explore more studio programs to continue learning</td></tr>
                    </table>

                    <!-- CTA Buttons -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td align="center" style="padding:0 0 12px 0;">
                        <a href="${dashboardUrl}" style="display:inline-block;background:linear-gradient(135deg,#6b1d3a,#4a1228);color:#e8d48b;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(107,29,58,0.3);letter-spacing:1px;">
                          View Certificate →
                        </a>
                      </td></tr>
                      <tr><td align="center" style="padding:0 0 8px 0;">
                        <a href="${verifyUrl}" style="display:inline-block;background:transparent;color:#c9a84c;text-decoration:none;padding:10px 28px;border-radius:8px;font-weight:600;font-size:13px;border:1.5px solid #c9a84c;">
                          Verify Certificate Online
                        </a>
                      </td></tr>
                    </table>

                    <!-- Warm wishes -->
                    <div style="margin-top:28px;padding:20px;background:linear-gradient(135deg,#6b1d3a10,#c9a84c10);border-radius:10px;text-align:center;border:1px solid #c9a84c20;">
                      <p style="color:#6b1d3a;font-size:15px;font-style:italic;margin:0;line-height:1.6;">
                        ✦ Wishing you the very best in all your future endeavors ✦
                      </p>
                      <p style="color:#8b7355;font-size:13px;margin:10px 0 0 0;">— Sunil Kumar, Founder & Lead Instructor</p>
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
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Archistudio <hello@archistudio.shop>",
        to: [email],
        subject,
        html,
      }),
    });

    const resData = await emailResponse.json();
    console.log("Certificate email sent:", resData);

    // Log email
    try {
      await supabase.from("email_logs").insert({
        recipient_email: email,
        recipient_name: userName,
        email_type: "certificate",
        subject,
        status: emailResponse.ok ? "sent" : "failed",
        metadata: { courseName, certificateNumber },
        error_message: emailResponse.ok ? null : JSON.stringify(resData),
      });
    } catch (logErr) {
      console.error("Failed to log email:", logErr);
    }

    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending certificate email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
