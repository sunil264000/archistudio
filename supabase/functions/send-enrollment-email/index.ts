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

async function logEmail(
  supabase: any,
  recipient_email: string,
  recipient_name: string | null,
  email_type: string,
  subject: string,
  status: string,
  metadata?: any,
  error_message?: string
) {
  try {
    await supabase.from('email_logs').insert({
      recipient_email,
      recipient_name,
      email_type,
      subject,
      status,
      metadata,
      error_message,
    });
  } catch (err) {
    console.error('Failed to log email:', err);
  }
}

function buildEmailHTML(params: {
  userName: string;
  courseName: string;
  courseSlug: string;
  isFree: boolean;
  isGift?: boolean;
  isTest?: boolean;
  amount?: number;
  orderId?: string;
  formattedDate: string;
  currentYear: number;
}) {
  const { userName, courseName, courseSlug, isFree, isGift, isTest, amount, orderId, formattedDate, currentYear } = params;
  
  const testBadge = isTest ? ' [TEST]' : '';
  const courseUrl = `https://archistudio.lovable.app/learn/${courseSlug}`;
  const dashboardUrl = `https://archistudio.lovable.app/dashboard`;

  // Payment invoice row helper
  const invoiceRow = (label: string, value: string, isLast = false) => `
    <tr>
      <td style="padding: 14px 16px; color: #64748b; font-size: 14px; font-weight: 500; border-bottom: ${isLast ? 'none' : '1px solid #f1f5f9'};">${label}</td>
      <td style="padding: 14px 16px; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-bottom: ${isLast ? 'none' : '1px solid #f1f5f9'};">${value}</td>
    </tr>
  `;

  let subject: string;
  let heroIcon: string;
  let heroTitle: string;
  let heroSubtitle: string;
  let invoiceSection: string;

  if (isGift) {
    subject = `🎁 You've Received a Gift! Free Access to ${courseName}${testBadge}`;
    heroIcon = '🎁';
    heroTitle = "You've Received a Gift!";
    heroSubtitle = "The Archistudio team has gifted you complimentary access to a premium course.";
    invoiceSection = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #fefce8; border: 1px solid #fef08a; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr><td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${invoiceRow('Course', courseName)}
            ${invoiceRow('Date Granted', formattedDate)}
            ${invoiceRow('Access Type', '🎓 Lifetime', true)}
          </table>
          <div style="margin-top: 16px; text-align: center; padding: 12px; background: #dcfce7; border-radius: 8px;">
            <span style="color: #16a34a; font-size: 18px; font-weight: 700;">FREE — Complimentary Gift</span>
          </div>
        </td></tr>
      </table>
    `;
  } else if (isFree) {
    subject = `You're enrolled in ${courseName}! 🎓${testBadge}`;
    heroIcon = '🎓';
    heroTitle = "You're Enrolled!";
    heroSubtitle = "You've been successfully enrolled in your course. Start learning right away!";
    invoiceSection = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; overflow: hidden; margin-bottom: 24px;">
        <tr><td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${invoiceRow('Course', courseName)}
            ${invoiceRow('Enrolled On', formattedDate)}
            ${invoiceRow('Access Type', '🎓 Lifetime', true)}
          </table>
          <div style="margin-top: 16px; text-align: center; padding: 12px; background: #dcfce7; border-radius: 8px;">
            <span style="color: #16a34a; font-size: 16px; font-weight: 700;">FREE COURSE</span>
          </div>
        </td></tr>
      </table>
    `;
  } else {
    subject = `✅ Payment Confirmed — ${courseName}${testBadge}`;
    heroIcon = '✅';
    heroTitle = "Payment Successful!";
    heroSubtitle = "Your payment has been confirmed and your course access is now active.";
    const displayOrderId = orderId || 'N/A';
    invoiceSection = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
        <tr>
          <td style="padding: 16px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
            <span style="font-size: 15px; font-weight: 700; color: #1e293b;">📋 Payment Invoice</span>
          </td>
        </tr>
        <tr><td style="padding: 20px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${invoiceRow('Order ID', `<code style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-family: monospace; color: #475569;">${displayOrderId}</code>`)}
            ${invoiceRow('Date', formattedDate)}
            ${invoiceRow('Course', courseName)}
            ${invoiceRow('Payment Method', 'Cashfree', true)}
          </table>
          <div style="margin-top: 20px; padding: 16px 20px; background: linear-gradient(135deg, #dcfce7 0%, #d1fae5 100%); border-radius: 10px; display: flex; justify-content: space-between; align-items: center;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color: #64748b; font-size: 15px; font-weight: 600;">Total Paid</td>
                <td style="color: #16a34a; font-size: 26px; font-weight: 800; text-align: right;">₹${(amount || 0).toLocaleString('en-IN')}</td>
              </tr>
            </table>
          </div>
          <p style="margin: 12px 0 0 0; color: #94a3b8; font-size: 12px; text-align: center;">✓ Payment received successfully. This serves as your official receipt.</p>
        </td></tr>
      </table>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 0 0 32px 0;">
              <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #16a34a, #059669); border-radius: 10px;">
                <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">ARCHISTUDIO</span>
              </div>
              <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0 0; letter-spacing: 1.5px; text-transform: uppercase;">Premium Architecture Education</p>
            </td>
          </tr>
          
          <!-- Main Card -->
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
                
                <!-- Hero Section -->
                <tr>
                  <td style="padding: 40px 32px 24px 32px; text-align: center; background: linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%);">
                    <div style="width: 72px; height: 72px; margin: 0 auto 16px; background: #dcfce7; border-radius: 50%; line-height: 72px; font-size: 36px;">${heroIcon}</div>
                    <h1 style="color: #1e293b; font-size: 24px; margin: 0 0 8px 0; font-weight: 700;">${heroTitle}</h1>
                    <p style="color: #64748b; font-size: 15px; margin: 0; line-height: 1.5;">${heroSubtitle}</p>
                  </td>
                </tr>
                
                <!-- Content -->
                <tr>
                  <td style="padding: 8px 32px 32px 32px;">
                    
                    <!-- Greeting -->
                    <p style="color: #334155; font-size: 16px; margin: 0 0 24px 0; line-height: 1.6;">Hi <strong style="color: #1e293b;">${userName}</strong>,</p>
                    
                    <!-- Invoice Section -->
                    ${invoiceSection}
                    
                    <!-- Course Access Card -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                      <tr><td style="padding: 20px;">
                        <p style="color: #334155; font-size: 15px; margin: 0 0 12px 0;">Congratulations! You now have <strong style="color: #16a34a;">lifetime access</strong> to:</p>
                        <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
                          <tr><td style="padding: 16px;">
                            <p style="color: #16a34a; font-size: 17px; font-weight: 700; margin: 0 0 6px 0;">${courseName}</p>
                            <p style="color: #94a3b8; margin: 0; font-size: 13px;">All sessions • Downloadable resources • Certificate upon completion</p>
                          </td></tr>
                        </table>
                      </td></tr>
                    </table>
                    
                    <!-- Next Steps -->
                    <p style="color: #334155; font-size: 15px; margin: 0 0 16px 0; font-weight: 600;">What you can do next:</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                      <tr><td style="padding: 8px 0; color: #475569; font-size: 14px;">✅ Start practicing at your own pace</td></tr>
                      <tr><td style="padding: 8px 0; color: #475569; font-size: 14px;">✅ Track your progress in the dashboard</td></tr>
                      <tr><td style="padding: 8px 0; color: #475569; font-size: 14px;">✅ Download studio resources & project files</td></tr>
                      <tr><td style="padding: 8px 0; color: #475569; font-size: 14px;">✅ Receive your certificate upon completion</td></tr>
                    </table>
                    
                    <!-- CTA Button -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td align="center" style="padding: 0 0 16px 0;">
                        <a href="${courseUrl}" style="display: inline-block; background: linear-gradient(135deg, #16a34a, #059669); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);">
                          Start Learning Now →
                        </a>
                      </td></tr>
                      <tr><td align="center">
                        <a href="${dashboardUrl}" style="color: #64748b; font-size: 13px; text-decoration: underline;">or go to your Dashboard</a>
                      </td></tr>
                    </table>
                    
                    <p style="margin: 28px 0 0 0; color: #94a3b8; font-size: 13px; text-align: center;">Need help? Reply to this email or visit our <a href="https://archistudio.lovable.app/contact" style="color: #16a34a; text-decoration: none;">support page</a>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 28px 0 0 0; text-align: center;">
              <p style="margin: 0 0 12px 0;">
                <a href="https://instagram.com/archistudio.in" style="color: #94a3b8; text-decoration: none; margin: 0 10px; font-size: 13px;">Instagram</a>
                <span style="color: #cbd5e1;">•</span>
                <a href="https://t.me/archistudio_in" style="color: #94a3b8; text-decoration: none; margin: 0 10px; font-size: 13px;">Telegram</a>
                <span style="color: #cbd5e1;">•</span>
                <a href="https://archistudio.lovable.app" style="color: #94a3b8; text-decoration: none; margin: 0 10px; font-size: 13px;">Website</a>
              </p>
              <p style="color: #cbd5e1; font-size: 12px; margin: 0;">© ${currentYear} Archistudio. All rights reserved.</p>
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
    const { 
      email, name, courseName, courseSlug, isFree, isGift, isTest, amount, orderId, paymentDate 
    }: EnrollmentEmailRequest = await req.json();

    if (!email || !courseName) {
      throw new Error("Email and course name are required");
    }

    const userName = name || "there";
    const currentYear = new Date().getFullYear();
    const formattedDate = (paymentDate ? new Date(paymentDate) : new Date()).toLocaleDateString('en-IN', { 
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const { subject, html } = buildEmailHTML({
      userName, courseName, courseSlug, isFree, isGift, isTest, amount, orderId, formattedDate, currentYear,
    });

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
    console.log("Enrollment email sent:", resData);

    const emailType = isGift ? 'gift' : 'enrollment';
    await logEmail(supabase, email, userName, emailType, subject, 'sent', { courseName, isFree, isGift, isTest });

    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending enrollment email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
