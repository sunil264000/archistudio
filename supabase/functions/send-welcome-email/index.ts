import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  isTest?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, isTest }: WelcomeEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const userName = name || "there";
    const currentYear = new Date().getFullYear();
    const testBadge = isTest ? ' [TEST]' : '';

    // Spam prevention: Add text version, proper headers, and clean HTML
    const subject = isTest 
      ? `[TEST] Welcome to Archistudio, ${userName}!` 
      : `Welcome to Archistudio, ${userName}!`;

    const textContent = `
Hi ${userName},

Thank you for joining Archistudio! We're excited to have you as part of our community of aspiring architects and designers.

With Archistudio, you'll have access to:
- Industry-leading architectural visualization courses
- Expert instructors with real-world experience  
- Hands-on projects and practical exercises
- Certificate of completion for each course

Start exploring our courses: https://archistudio.lovable.app/courses

If you have any questions, feel free to reach out to us at hello@archistudio.shop

Best regards,
The Archistudio Team

---
© ${currentYear} Archistudio. All rights reserved.
https://archistudio.lovable.app

You received this email because you signed up for an account at Archistudio.
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
  <title>Welcome to Archistudio</title>
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
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Preheader text (hidden but used by email clients) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all;">
    Welcome aboard! Start your architectural visualization journey with Archistudio.
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
                    <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0; letter-spacing: 1.5px; text-transform: uppercase;">Premium Architecture Education</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Welcome Message -->
          <tr>
            <td class="content" style="padding: 40px;">
              
              <!-- Welcome Icon -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="width: 72px; height: 72px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); border-radius: 50%; line-height: 72px; font-size: 32px; text-align: center;">
                      &#127881;
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Heading -->
              <h1 style="color: #18181b; font-size: 28px; font-weight: 700; margin: 0 0 24px 0; text-align: center; line-height: 1.3;">
                Welcome to Archistudio!
              </h1>
              
              <!-- Personal Greeting -->
              <p style="color: #3f3f46; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                Hi <strong style="color: #18181b;">${userName}</strong>,
              </p>
              
              <p style="color: #52525b; font-size: 16px; line-height: 1.7; margin: 0 0 28px 0;">
                Thank you for joining our community! We're excited to help you master architectural visualization with industry-leading courses designed by professionals.
              </p>
              
              <!-- Features Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 32px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #18181b; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; text-transform: uppercase; letter-spacing: 0.5px;">What you get with Archistudio</p>
                    
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding: 8px 0; color: #52525b; font-size: 15px;">
                          <span style="color: #22c55e; font-weight: bold; margin-right: 10px;">&#10003;</span>
                          Professional visualization courses
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #52525b; font-size: 15px;">
                          <span style="color: #22c55e; font-weight: bold; margin-right: 10px;">&#10003;</span>
                          Expert instructors with real-world experience
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #52525b; font-size: 15px;">
                          <span style="color: #22c55e; font-weight: bold; margin-right: 10px;">&#10003;</span>
                          Hands-on projects and downloadable resources
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: #52525b; font-size: 15px;">
                          <span style="color: #22c55e; font-weight: bold; margin-right: 10px;">&#10003;</span>
                          Certificate upon course completion
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 32px;">
                    <a href="https://archistudio.lovable.app/courses" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; font-size: 16px; font-weight: 600; padding: 16px 36px; border-radius: 10px; text-decoration: none;">
                      Explore Courses
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #71717a; font-size: 14px; line-height: 1.6; margin: 0; text-align: center;">
                Have questions? Just reply to this email or contact us at <a href="mailto:hello@archistudio.shop" style="color: #6366f1;">hello@archistudio.shop</a>
              </p>
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 32px; background-color: #fafafa; border-radius: 0 0 16px 16px; border-top: 1px solid #f4f4f5;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="https://instagram.com/archistudio.in" style="color: #71717a; font-size: 13px; margin: 0 12px;">Instagram</a>
                    <span style="color: #d4d4d8;">|</span>
                    <a href="https://t.me/archistudio_in" style="color: #71717a; font-size: 13px; margin: 0 12px;">Telegram</a>
                    <span style="color: #d4d4d8;">|</span>
                    <a href="https://archistudio.lovable.app" style="color: #71717a; font-size: 13px; margin: 0 12px;">Website</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="color: #a1a1aa; font-size: 12px; margin: 0 0 4px 0;">&copy; ${currentYear} Archistudio. All rights reserved.</p>
                    <p style="color: #d4d4d8; font-size: 11px; margin: 0;">You received this email because you signed up at archistudio.lovable.app</p>
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
          "X-Entity-Ref-ID": `welcome-${Date.now()}`,
          "List-Unsubscribe": "<mailto:unsubscribe@archistudio.shop>",
        },
      }),
    });

    const resData = await emailResponse.json();
    console.log("Welcome email sent successfully:", resData);

    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending welcome email:", error);
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
