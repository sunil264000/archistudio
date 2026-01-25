import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GiftEmailRequest {
  email: string;
  name: string;
  bookCount: number;
  bookTitles: string[];
  isFullBundle: boolean;
  isTest?: boolean;
}

async function logEmail(
  supabase: any,
  recipientEmail: string,
  recipientName: string | null,
  emailType: string,
  subject: string,
  status: 'sent' | 'failed',
  errorMessage: string | null = null,
  metadata: Record<string, any> = {}
) {
  try {
    await supabase.from('email_logs').insert({
      recipient_email: recipientEmail,
      recipient_name: recipientName,
      email_type: emailType,
      subject: subject,
      status: status,
      error_message: errorMessage,
      metadata: metadata,
    });
  } catch (err) {
    console.error('Failed to log email:', err);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { 
      email, 
      name, 
      bookCount,
      bookTitles,
      isFullBundle,
      isTest,
    }: GiftEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const userName = name || "there";
    const currentYear = new Date().getFullYear();
    const testBadge = isTest ? ' [TEST]' : '';
    const formattedDate = new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
    });

    const subject = isFullBundle 
      ? `You've Received the Complete Architecture eBook Bundle${testBadge}`
      : `You've Received ${bookCount} Free Architecture eBook${bookCount > 1 ? 's' : ''}${testBadge}`;

    // Generate book list HTML
    const bookListHtml = bookTitles.slice(0, 10).map(title => 
      `<tr><td style="padding: 8px 0; color: #a5b4fc; font-size: 14px;"><span style="color: #22c55e; margin-right: 10px;">📖</span>${title}</td></tr>`
    ).join('');

    const moreBooks = bookTitles.length > 10 
      ? `<tr><td style="color: #9ca3af; font-style: italic; padding-top: 8px;">...and ${bookTitles.length - 10} more!</td></tr>` 
      : '';

    // Plain text version
    const textContent = `
Hi ${userName},

Great news! You've been granted free access to ${isFullBundle ? 'the complete architecture eBook bundle' : `${bookCount} premium architecture eBook${bookCount > 1 ? 's' : ''}`}!

Your Free eBooks:
${bookTitles.slice(0, 10).map(t => `- ${t}`).join('\n')}
${bookTitles.length > 10 ? `...and ${bookTitles.length - 10} more!` : ''}

You now have full access to:
- Download unlimited times
- Read online with our PDF viewer
- Lifetime access - no expiry

Access your eBooks: https://archistudio.lovable.app/dashboard

Questions? Just reply to this email - we're here to help!

© ${currentYear} Archistudio. All rights reserved.
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>You've Received a Gift</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f;">
  
  <div style="display: none; max-height: 0; overflow: hidden;">
    You've received ${isFullBundle ? 'the complete eBook bundle' : `${bookCount} free eBook${bookCount > 1 ? 's' : ''}`} from Archistudio!
  </div>
  
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0f0f0f;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background: linear-gradient(180deg, #1a1a2e 0%, #0f172a 100%); border-radius: 20px; border: 1px solid rgba(255,255,255,0.08);">
          
          <!-- Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="padding: 14px 28px; background: rgba(34, 197, 94, 0.15); border-radius: 14px; border: 1px solid rgba(34, 197, 94, 0.25);">
                    <span style="font-size: 22px; font-weight: 800; color: #22c55e; letter-spacing: -0.5px;">ARCHISTUDIO</span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 12px;">
                    <span style="color: #6b7280; font-size: 13px; letter-spacing: 1px; text-transform: uppercase;">Premium Architecture Education</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 0 40px 35px;">
              <div style="display: inline-block; width: 80px; height: 80px; background: rgba(34, 197, 94, 0.2); border-radius: 50%; line-height: 80px; font-size: 40px; margin-bottom: 15px;">🎁</div>
              <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">
                You've Received a Gift!
              </h1>
              <div style="width: 50px; height: 3px; background: linear-gradient(90deg, #22c55e, #10b981); margin: 18px auto 0; border-radius: 2px;"></div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="color: #e5e5e5; font-size: 18px; margin: 0 0 25px;">Hi <strong style="color: #fff;">${userName}</strong>!</p>
              
              <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
                Great news! You've been granted <strong style="color: #22c55e;">free access</strong> to ${isFullBundle ? 'the complete architecture eBook bundle' : `${bookCount} premium architecture eBook${bookCount > 1 ? 's' : ''}`}!
              </p>
              
              <!-- Gift Details -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: rgba(34, 197, 94, 0.12); border: 1px solid rgba(34, 197, 94, 0.35); border-radius: 16px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 20px; border-bottom: 1px solid rgba(34, 197, 94, 0.2);">
                          <span style="color: #22c55e; font-weight: 700; font-size: 18px;">📚 Your Free eBooks</span>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 15px;">
                      ${bookListHtml}
                      ${moreBooks}
                    </table>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 20px;">
                      <tr>
                        <td align="center" style="padding: 16px; background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px;">
                          <span style="color: #22c55e; font-size: 14px; font-weight: 600;">Granted on ${formattedDate}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="color: #d1d5db; font-size: 16px; margin: 0 0 20px;">You now have <strong style="color: #22c55e;">full access</strong> to:</p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 28px;">
                <tr><td style="padding: 6px 0; color: #a5b4fc; font-size: 15px;"><span style="color: #22c55e; margin-right: 10px;">✓</span>Download unlimited times</td></tr>
                <tr><td style="padding: 6px 0; color: #a5b4fc; font-size: 15px;"><span style="color: #22c55e; margin-right: 10px;">✓</span>Read online with our PDF viewer</td></tr>
                <tr><td style="padding: 6px 0; color: #a5b4fc; font-size: 15px;"><span style="color: #22c55e; margin-right: 10px;">✓</span>Lifetime access - no expiry</td></tr>
              </table>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 35px 0;">
                <tr>
                  <td align="center">
                    <a href="https://archistudio.lovable.app/dashboard" style="display: inline-block; background: linear-gradient(90deg, #22c55e, #10b981); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                      Access Your eBooks
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #9ca3af; font-size: 14px; text-align: center; margin: 0;">Questions? Just reply to this email - we're here to help!</p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 25px 40px 32px; border-top: 1px solid rgba(255,255,255,0.08);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <a href="https://instagram.com/archistudio.in" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 13px;">Instagram</a>
                    <span style="color: #3f3f46;">•</span>
                    <a href="https://t.me/archistudio_in" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 13px;">Telegram</a>
                    <span style="color: #3f3f46;">•</span>
                    <a href="https://archistudio.lovable.app" style="color: #6b7280; text-decoration: none; margin: 0 10px; font-size: 13px;">Website</a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="color: #52525b; font-size: 12px; margin: 0;">© ${currentYear} Archistudio. All rights reserved.</p>
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
          "List-Unsubscribe": "<mailto:unsubscribe@archistudio.shop>",
          "X-Entity-Ref-ID": `gift-${Date.now()}`,
        },
      }),
    });

    const resData = await emailResponse.json();
    
    if (emailResponse.ok) {
      console.log("eBook gift email sent successfully:", resData);
      await logEmail(supabase, email, name, 'gift', subject, 'sent', null, { bookCount, isFullBundle, bookTitles: bookTitles.slice(0, 5) });
    } else {
      console.error("Failed to send gift email:", resData);
      await logEmail(supabase, email, name, 'gift', subject, 'failed', resData.message || 'Unknown error', { bookCount, isFullBundle });
      throw new Error(resData.message || 'Failed to send email');
    }

    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending eBook gift email:", error);
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
