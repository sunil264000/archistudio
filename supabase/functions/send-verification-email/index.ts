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

    if (!email || !verificationCode) {
      throw new Error("Email and verification code are required");
    }

    const userName = name || "there";
    const currentYear = new Date().getFullYear();

    const subject = isTest 
      ? `[TEST] Your Archistudio Verification Code: ${verificationCode}` 
      : `Your Archistudio Verification Code: ${verificationCode}`;

    const textContent = `
Hi ${userName},

Your verification code for Archistudio is: ${verificationCode}

Enter this code to verify your email address and complete your registration.

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.

---
© ${currentYear} Archistudio. All rights reserved.
https://archistudio.lovable.app
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
  <title>Verify Your Email</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
    a { text-decoration: none; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px !important; }
      .content { padding: 24px !important; }
      .code-box { font-size: 28px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preheader text -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Your verification code is ${verificationCode}. Enter this code to verify your email.
  </div>
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 30px; background: linear-gradient(135deg, #1a1a2e 0%, #0f172a 100%); border-radius: 16px 16px 0 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; padding: 12px 24px; background: rgba(34, 197, 94, 0.15); border-radius: 12px; border: 1px solid rgba(34, 197, 94, 0.3);">
                      <span style="font-size: 22px; font-weight: 700; color: #22c55e; letter-spacing: 0.5px;">ARCHISTUDIO</span>
                    </div>
                    <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0; letter-spacing: 1.5px; text-transform: uppercase;">Email Verification</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Verification Content -->
          <tr>
            <td class="content" style="padding: 40px;">
              
              <!-- Lock Icon -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 50%; line-height: 72px; font-size: 32px; text-align: center;">
                      &#9989;
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Heading -->
              <h1 style="color: #18181b; font-size: 26px; font-weight: 700; margin: 0 0 16px 0; text-align: center; line-height: 1.3;">
                Verify Your Email
              </h1>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.7; margin: 0 0 32px 0; text-align: center;">
                Hi <strong style="color: #18181b;">${userName}</strong>! Enter the code below to verify your email and complete your registration.
              </p>
              
              <!-- Verification Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 32px;">
                <tr>
                  <td align="center">
                    <div class="code-box" style="display: inline-block; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border: 2px dashed #6366f1; border-radius: 16px; padding: 24px 48px; font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #18181b; font-family: 'Courier New', Courier, monospace;">
                      ${verificationCode}
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Timer Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #fef3c7; border-radius: 12px; border: 1px solid #fcd34d; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <span style="font-size: 20px;">&#9200;</span>
                        </td>
                        <td style="vertical-align: middle;">
                          <p style="color: #92400e; font-size: 14px; margin: 0; font-weight: 500;">
                            This code expires in <strong>10 minutes</strong>
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Spam Notice -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 12px;">
                          <span style="font-size: 20px;">&#128233;</span>
                        </td>
                        <td style="vertical-align: middle;">
                          <p style="color: #1e40af; font-size: 14px; margin: 0;">
                            <strong>Tip:</strong> If you don't see this email in your inbox, please check your <strong>Spam</strong> or <strong>Junk</strong> folder.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="color: #71717a; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                If you didn't request this verification, you can safely ignore this email.
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; background-color: #fafafa; border-radius: 0 0 16px 16px; border-top: 1px solid #f4f4f5;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="https://archistudio.lovable.app" style="color: #6366f1; font-size: 13px; font-weight: 500;">Visit Archistudio</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 4px 0;">&copy; ${currentYear} Archistudio. All rights reserved.</p>
                    <p style="color: #d4d4d8; font-size: 11px; margin: 0;">This is an automated security email from Archistudio.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
    `.trim();

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Archistudio <hello@archistudio.shop>",
        to: [email],
        reply_to: "hello@archistudio.shop",
        subject: subject,
        text: textContent,
        html: htmlContent,
        headers: {
          "X-Entity-Ref-ID": `verification-${Date.now()}`,
        },
      }),
    });

    const resData = await emailResponse.json();
    console.log("Verification email sent:", resData);

    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
