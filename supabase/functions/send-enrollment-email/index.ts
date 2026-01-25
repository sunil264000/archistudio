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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    const { 
      email, 
      name, 
      courseName, 
      courseSlug, 
      isFree, 
      isGift,
      isTest,
      amount,
      orderId,
      paymentDate 
    }: EnrollmentEmailRequest = await req.json();

    if (!email || !courseName) {
      throw new Error("Email and course name are required");
    }

    const userName = name || "there";
    const currentYear = new Date().getFullYear();
    const formattedDate = paymentDate 
      ? new Date(paymentDate).toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : new Date().toLocaleDateString('en-IN', { 
          day: '2-digit', 
          month: 'short', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

    // Test badge for testing emails only
    const testBadge = isTest ? `<span style="background: #f59e0b; color: #000; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; margin-left: 8px;">TEST</span>` : '';

    // Display course name (clean for production, with badge for testing)
    const displayCourseName = courseName;

    // Determine email type: Paid, Free self-enrollment, or Admin Gift
    let subject: string;
    let headerEmoji: string;
    let headerTitle: string;
    let invoiceSection: string;
    let enrollmentType: string;

    if (isGift) {
      // Admin-granted free access - special gift email
      subject = `🎁 You've Received a Gift! Free Access to ${displayCourseName}${isTest ? ' [TEST]' : ''}`;
      headerEmoji = '🎁';
      headerTitle = "You've Received a Gift!";
      enrollmentType = "complimentary gift";
      invoiceSection = `
        <div style="background: linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(236, 72, 153, 0.12) 100%); border: 2px solid rgba(168, 85, 247, 0.35); border-radius: 16px; padding: 30px; margin-bottom: 30px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="display: inline-block; width: 70px; height: 70px; background: linear-gradient(135deg, #a855f7, #ec4899); border-radius: 50%; line-height: 70px; font-size: 32px;">🎁</div>
          </div>
          <h3 style="color: #a855f7; font-size: 20px; margin: 0 0 15px 0; font-weight: 700; text-align: center;">Complimentary Access Granted</h3>
          <p style="color: #d1d5db; margin: 0 0 20px 0; font-size: 15px; text-align: center; line-height: 1.6;">
            The Archistudio team has gifted you <strong style="color: #f9fafb;">FREE lifetime access</strong> to this premium course!
          </p>
          <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #9ca3af; font-size: 14px;">Course</td>
                <td style="padding: 12px 0; color: #f9fafb; text-align: right; font-weight: 600;">${displayCourseName}${testBadge}</td>
              </tr>
              <tr style="border-top: 1px solid rgba(168, 85, 247, 0.2);">
                <td style="padding: 12px 0; color: #9ca3af; font-size: 14px;">Date Granted</td>
                <td style="padding: 12px 0; color: #f9fafb; text-align: right;">${formattedDate}</td>
              </tr>
              <tr style="border-top: 1px solid rgba(168, 85, 247, 0.2);">
                <td style="padding: 12px 0; color: #9ca3af; font-size: 14px;">Access Type</td>
                <td style="padding: 12px 0; color: #f9fafb; text-align: right;">Lifetime</td>
              </tr>
            </table>
          </div>
          <div style="margin-top: 20px; padding: 16px; background: linear-gradient(90deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.15)); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 10px; text-align: center;">
            <span style="color: #22c55e; font-size: 22px; font-weight: 700;">FREE</span>
            <span style="color: #86efac; font-size: 14px; margin-left: 8px;">🎉 No payment required</span>
          </div>
        </div>
      `;
    } else if (isFree) {
      // Self-enrolled free course
      subject = `You're enrolled in ${displayCourseName}! 🎓${isTest ? ' [TEST]' : ''}`;
      headerEmoji = '🎓';
      headerTitle = "You're Enrolled!";
      enrollmentType = "free enrollment";
      invoiceSection = `
        <div style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%); border: 1px solid rgba(59, 130, 246, 0.35); border-radius: 16px; padding: 25px; margin-bottom: 30px;">
          <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; color: #9ca3af; font-size: 14px;">Course</td>
                <td style="padding: 12px 0; color: #f9fafb; text-align: right; font-weight: 600;">${displayCourseName}${testBadge}</td>
              </tr>
              <tr style="border-top: 1px solid rgba(59, 130, 246, 0.2);">
                <td style="padding: 12px 0; color: #9ca3af; font-size: 14px;">Enrolled On</td>
                <td style="padding: 12px 0; color: #f9fafb; text-align: right;">${formattedDate}</td>
              </tr>
              <tr style="border-top: 1px solid rgba(59, 130, 246, 0.2);">
                <td style="padding: 12px 0; color: #9ca3af; font-size: 14px;">Access Type</td>
                <td style="padding: 12px 0; color: #f9fafb; text-align: right;">Lifetime</td>
              </tr>
            </table>
          </div>
          <div style="margin-top: 20px; text-align: center;">
            <span style="background: linear-gradient(90deg, #22c55e, #10b981); color: #fff; padding: 8px 20px; border-radius: 20px; font-weight: 600;">FREE COURSE</span>
          </div>
        </div>
      `;
    } else {
      // Paid enrollment with invoice
      subject = `Payment Confirmed - Invoice for ${displayCourseName} 🎉${isTest ? ' [TEST]' : ''}`;
      headerEmoji = '✅';
      headerTitle = "Payment Successful!";
      enrollmentType = "purchase";
      
      // Format order ID nicely
      const displayOrderId = orderId || 'N/A';
      
      invoiceSection = `
        <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(16, 185, 129, 0.12) 100%); border: 1px solid rgba(34, 197, 94, 0.35); border-radius: 16px; padding: 25px; margin-bottom: 30px;">
          <div style="display: flex; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid rgba(34, 197, 94, 0.2);">
            <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #22c55e, #10b981); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px;">📋</div>
            <span style="color: #22c55e; font-weight: 700; font-size: 18px; margin-left: 12px;">Payment Invoice</span>
            ${testBadge}
          </div>
          <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 14px 0; color: #9ca3af; font-size: 14px;">Order ID</td>
                <td style="padding: 14px 0; color: #f9fafb; text-align: right; font-family: 'SF Mono', Monaco, monospace; font-size: 13px; background: rgba(255,255,255,0.05); padding: 8px 12px; border-radius: 6px;">${displayOrderId}</td>
              </tr>
              <tr style="border-top: 1px solid rgba(34, 197, 94, 0.15);">
                <td style="padding: 14px 0; color: #9ca3af; font-size: 14px;">Date</td>
                <td style="padding: 14px 0; color: #f9fafb; text-align: right;">${formattedDate}</td>
              </tr>
              <tr style="border-top: 1px solid rgba(34, 197, 94, 0.15);">
                <td style="padding: 14px 0; color: #9ca3af; font-size: 14px;">Course</td>
                <td style="padding: 14px 0; color: #f9fafb; text-align: right; font-weight: 600;">${displayCourseName}</td>
              </tr>
              <tr style="border-top: 1px solid rgba(34, 197, 94, 0.15);">
                <td style="padding: 14px 0; color: #9ca3af; font-size: 14px;">Payment Method</td>
                <td style="padding: 14px 0; color: #f9fafb; text-align: right;">Cashfree</td>
              </tr>
            </table>
          </div>
          <div style="margin-top: 20px; padding: 20px; background: linear-gradient(90deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2)); border: 1px solid rgba(34, 197, 94, 0.4); border-radius: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: #9ca3af; font-size: 16px; font-weight: 600;">Total Paid</span>
            <span style="color: #22c55e; font-size: 28px; font-weight: 800;">₹${(amount || 0).toLocaleString('en-IN')}</span>
          </div>
          <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 12px; text-align: center;">✓ Payment received successfully. This serves as your official receipt.</p>
        </div>
      `;
    }

    // Logo section with branded header
    const logoSection = `
      <div style="text-align: center; margin-bottom: 30px;">
        <div style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%); border-radius: 14px; border: 1px solid rgba(34, 197, 94, 0.25);">
          <span style="font-size: 26px; font-weight: 800; background: linear-gradient(90deg, #22c55e, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -0.5px;">ARCHISTUDIO</span>
        </div>
        <p style="color: #6b7280; font-size: 13px; margin: 12px 0 0 0; letter-spacing: 1px; text-transform: uppercase;">Premium Architecture Education</p>
      </div>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Archistudio <hello@archistudio.shop>",
        to: [email],
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(180deg, #1a1a2e 0%, #0f172a 100%); border-radius: 20px; padding: 40px; border: 1px solid rgba(255,255,255,0.08); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
                
                ${logoSection}
                
                <div style="text-align: center; margin-bottom: 35px;">
                  <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.2)); border-radius: 50%; line-height: 80px; font-size: 40px; margin-bottom: 15px;">${headerEmoji}</div>
                  <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">
                    ${headerTitle}
                  </h1>
                  <div style="width: 50px; height: 3px; background: linear-gradient(90deg, #22c55e, #10b981); margin: 18px auto 0; border-radius: 2px;"></div>
                </div>
                
                <div style="color: #e5e5e5; font-size: 16px; line-height: 1.7;">
                  <p style="margin-bottom: 25px; font-size: 18px;">Hi <strong style="color: #fff;">${userName}</strong>! 👋</p>
                  
                  ${invoiceSection}
                  
                  <p style="margin-bottom: 20px; color: #d1d5db;">Congratulations on your ${enrollmentType}! You now have <strong style="color: #22c55e;">lifetime access</strong> to:</p>
                  
                  <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 14px; padding: 22px; margin-bottom: 28px;">
                    <h2 style="color: #818cf8; font-size: 19px; margin: 0 0 8px 0; font-weight: 600;">${displayCourseName}</h2>
                    <p style="color: #9ca3af; margin: 0; font-size: 14px;">All sessions • Downloadable resources • Proof of Completion upon finishing</p>
                  </div>
                  
                  <p style="margin-bottom: 18px; color: #d1d5db;">Here's what you can do next:</p>
                  <div style="margin-bottom: 28px; padding-left: 5px;">
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                      <span style="color: #22c55e; margin-right: 12px;">✓</span>
                      <span style="color: #a5b4fc;">Start practicing at your own pace</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                      <span style="color: #22c55e; margin-right: 12px;">✓</span>
                      <span style="color: #a5b4fc;">Track your progress in the dashboard</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 12px;">
                      <span style="color: #22c55e; margin-right: 12px;">✓</span>
                      <span style="color: #a5b4fc;">Download studio resources</span>
                    </div>
                    <div style="display: flex; align-items: center;">
                      <span style="color: #22c55e; margin-right: 12px;">✓</span>
                      <span style="color: #a5b4fc;">Receive your proof of completion</span>
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin: 35px 0;">
                    <a href="https://archistudio.lovable.app/course-player/${courseSlug}" style="display: inline-block; background: linear-gradient(90deg, #22c55e, #10b981); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.4);">
                      Begin Your Practice →
                    </a>
                  </div>
                  
                  <p style="margin-top: 30px; color: #9ca3af; font-size: 14px; text-align: center;">Need help? Our support team is always here for you.</p>
                </div>
                
                <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center;">
                  <div style="margin-bottom: 18px;">
                    <a href="https://instagram.com/archistudio.in" style="color: #6b7280; text-decoration: none; margin: 0 12px; font-size: 13px; transition: color 0.2s;">Instagram</a>
                    <span style="color: #3f3f46;">•</span>
                    <a href="https://t.me/archistudio_in" style="color: #6b7280; text-decoration: none; margin: 0 12px; font-size: 13px;">Telegram</a>
                    <span style="color: #3f3f46;">•</span>
                    <a href="https://archistudio.lovable.app" style="color: #6b7280; text-decoration: none; margin: 0 12px; font-size: 13px;">Website</a>
                  </div>
                  <p style="color: #52525b; font-size: 12px; margin: 0;">© ${currentYear} Archistudio. All rights reserved.</p>
                  <p style="color: #3f3f46; font-size: 11px; margin: 8px 0 0 0;">This is an automated email. Please do not reply directly.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const resData = await emailResponse.json();
    console.log("Enrollment email sent successfully:", resData);

    // Log the email
    const emailType = isGift ? 'gift' : isFree ? 'enrollment' : 'enrollment';
    await logEmail(supabase, email, userName, emailType, subject, 'sent', { courseName, isFree, isGift, isTest });

    return new Response(JSON.stringify({ success: true, data: resData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending enrollment email:", error);
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
