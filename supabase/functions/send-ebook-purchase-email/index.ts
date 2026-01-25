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
  email: string;
  name: string;
  bundleName: string;
  bookCount: number;
  amount: number;
  orderId: string;
  isFullBundle: boolean;
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
      bundleName,
      bookCount,
      amount,
      orderId,
      isFullBundle,
    }: EbookEmailRequest = await req.json();

    if (!email || !bundleName) {
      throw new Error("Email and bundle name are required");
    }

    const userName = name || "there";
    const currentYear = new Date().getFullYear();
    const formattedDate = new Date().toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // No emoji in subject for deliverability
    const subject = isFullBundle 
      ? `Your Complete Architecture eBook Bundle is Ready`
      : `Your ${bookCount} Architecture eBook${bookCount > 1 ? 's are' : ' is'} Ready`;

    // Plain text version
    const textContent = `
Hi ${userName},

Thank you for your purchase! Your eBooks are ready for download.

Order Details:
- Order ID: ${orderId}
- Date: ${formattedDate}
- Package: ${bundleName}
- Books: ${bookCount} eBook${bookCount > 1 ? 's' : ''}
- Total Paid: Rs.${amount.toLocaleString('en-IN')}

You now have instant access to download all your eBooks:
- Download unlimited times
- Access from any device
- Lifetime access - no expiry

Download your eBooks: https://archistudio.lovable.app/dashboard

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
  <title>Your eBooks are Ready</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f;">
  
  <div style="display: none; max-height: 0; overflow: hidden;">
    Your ${bundleName} purchase is complete! Download your ${bookCount} eBook${bookCount > 1 ? 's' : ''} now.
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
              <div style="display: inline-block; width: 80px; height: 80px; background: rgba(59, 130, 246, 0.2); border-radius: 50%; line-height: 80px; font-size: 40px; margin-bottom: 15px;">📚</div>
              <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">
                Your eBooks are Ready!
              </h1>
              <div style="width: 50px; height: 3px; background: linear-gradient(90deg, #3b82f6, #6366f1); margin: 18px auto 0; border-radius: 2px;"></div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <p style="color: #e5e5e5; font-size: 18px; margin: 0 0 25px;">Hi <strong style="color: #fff;">${userName}</strong>!</p>
              
              <!-- Invoice Section -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: rgba(59, 130, 246, 0.12); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 16px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 25px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td style="padding-bottom: 20px; border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
                          <span style="color: #3b82f6; font-weight: 700; font-size: 18px;">📋 Purchase Invoice</span>
                        </td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background: rgba(0,0,0,0.2); border-radius: 12px; margin-top: 15px;">
                      <tr>
                        <td style="padding: 14px 20px; color: #9ca3af; font-size: 14px;">Order ID</td>
                        <td style="padding: 14px 20px; color: #f9fafb; text-align: right; font-family: monospace; font-size: 13px;">${orderId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 20px; color: #9ca3af; font-size: 14px; border-top: 1px solid rgba(59, 130, 246, 0.15);">Date</td>
                        <td style="padding: 14px 20px; color: #f9fafb; text-align: right; border-top: 1px solid rgba(59, 130, 246, 0.15);">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 20px; color: #9ca3af; font-size: 14px; border-top: 1px solid rgba(59, 130, 246, 0.15);">Package</td>
                        <td style="padding: 14px 20px; color: #f9fafb; text-align: right; font-weight: 600; border-top: 1px solid rgba(59, 130, 246, 0.15);">${bundleName}</td>
                      </tr>
                      <tr>
                        <td style="padding: 14px 20px; color: #9ca3af; font-size: 14px; border-top: 1px solid rgba(59, 130, 246, 0.15);">Books</td>
                        <td style="padding: 14px 20px; color: #f9fafb; text-align: right; border-top: 1px solid rgba(59, 130, 246, 0.15);">${bookCount} eBook${bookCount > 1 ? 's' : ''}</td>
                      </tr>
                    </table>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top: 20px;">
                      <tr>
                        <td style="padding: 20px; background: rgba(34, 197, 94, 0.2); border: 1px solid rgba(34, 197, 94, 0.4); border-radius: 12px;">
                          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td style="color: #9ca3af; font-size: 16px; font-weight: 600;">Total Paid</td>
                              <td style="color: #22c55e; font-size: 28px; font-weight: 800; text-align: right;">₹${amount.toLocaleString('en-IN')}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <p style="color: #d1d5db; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">
                Your purchase is complete! You now have <strong style="color: #3b82f6;">instant access</strong> to download all your eBooks:
              </p>
              
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom: 28px;">
                <tr><td style="padding: 6px 0; color: #a5b4fc; font-size: 15px;"><span style="color: #22c55e; margin-right: 10px;">✓</span>Download unlimited times</td></tr>
                <tr><td style="padding: 6px 0; color: #a5b4fc; font-size: 15px;"><span style="color: #22c55e; margin-right: 10px;">✓</span>Access from any device</td></tr>
                <tr><td style="padding: 6px 0; color: #a5b4fc; font-size: 15px;"><span style="color: #22c55e; margin-right: 10px;">✓</span>Lifetime access - no expiry</td></tr>
              </table>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 35px 0;">
                <tr>
                  <td align="center">
                    <a href="https://archistudio.lovable.app/dashboard" style="display: inline-block; background: linear-gradient(90deg, #3b82f6, #6366f1); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                      Download Your eBooks
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
          "X-Entity-Ref-ID": `ebook-purchase-${orderId}`,
        },
      }),
    });

    const resData = await emailResponse.json();
    
    if (emailResponse.ok) {
      console.log("eBook purchase email sent successfully:", resData);
      await logEmail(supabase, email, name, 'ebook_purchase', subject, 'sent', null, { orderId, bundleName, bookCount, amount });
    } else {
      console.error("Failed to send ebook purchase email:", resData);
      await logEmail(supabase, email, name, 'ebook_purchase', subject, 'failed', resData.message || 'Unknown error', { orderId, bundleName });
      throw new Error(resData.message || 'Failed to send email');
    }

    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending eBook email:", error);
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
