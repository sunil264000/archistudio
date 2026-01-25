import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Initialize Resend
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type EmailType = 'confirmation' | 'reminder' | 'overdue' | 'early_bonus' | 'final_unlock';

interface EMIEmailRequest {
  email: string;
  name: string;
  courseName: string;
  courseSlug: string;
  emailType: EmailType;
  amountPaid?: number;
  remainingAmount?: number;
  unlockedPercent?: number;
  dueDate?: string;
  discountAmount?: number;
  orderId?: string;
}

const getEmailContent = (data: EMIEmailRequest): { subject: string; html: string } => {
  const year = new Date().getFullYear();
  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
      .header h1 { color: #fff; margin: 0; font-size: 24px; }
      .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px; }
      .highlight { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
      .cta-button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 15px 0; }
      .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      .amount-box { background: #e8f5e9; border-left: 4px solid #4caf50; padding: 15px; margin: 15px 0; }
      .warning-box { background: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 15px 0; }
    </style>
  `;

  switch (data.emailType) {
    case 'confirmation':
      return {
        subject: `Partial Access Activated – Archistudio`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Partial Access Activated!</h1>
              </div>
              <div class="content">
                <p>Hi ${data.name},</p>
                <p>Your partial payment has been processed successfully!</p>
                
                <div class="highlight">
                  <h3 style="margin: 0 0 10px 0;">Payment Details</h3>
                  <p style="margin: 5px 0;">Course: <strong>${data.courseName}</strong></p>
                  <p style="margin: 5px 0;">Amount Paid: <strong>₹${data.amountPaid?.toLocaleString()}</strong></p>
                  <p style="margin: 5px 0;">Content Unlocked: <strong>${data.unlockedPercent}%</strong></p>
                  ${data.remainingAmount && data.remainingAmount > 0 ? `<p style="margin: 5px 0;">Remaining: <strong>₹${data.remainingAmount.toLocaleString()}</strong></p>` : ''}
                  ${data.orderId ? `<p style="margin: 5px 0; font-size: 12px;">Order ID: ${data.orderId}</p>` : ''}
                </div>
                
                <p>You now have access to the unlocked modules. Complete your remaining payment to unlock the full course!</p>
                
                <a href="https://archistudio.lovable.app/learn/${data.courseSlug}" class="cta-button">Continue Learning</a>
                
                <p style="color: #666; font-size: 14px;">Your progress is saved and you can continue anytime.</p>
              </div>
              <div class="footer">
                <p>© ${year} Archistudio. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'reminder':
      return {
        subject: `Payment Reminder – ${data.courseName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📅 Payment Reminder</h1>
              </div>
              <div class="content">
                <p>Hi ${data.name},</p>
                <p>This is a friendly reminder about your upcoming payment for <strong>${data.courseName}</strong>.</p>
                
                <div class="amount-box">
                  <p style="margin: 0;">Amount Due: <strong>₹${data.remainingAmount?.toLocaleString()}</strong></p>
                  <p style="margin: 5px 0 0 0;">Due Date: <strong>${data.dueDate}</strong></p>
                </div>
                
                <p>💡 <strong>Pro Tip:</strong> Pay before the due date and get an early payment discount!</p>
                
                <a href="https://archistudio.lovable.app/course/${data.courseSlug}" class="cta-button">Complete Payment</a>
                
                <p style="color: #666; font-size: 14px;">Need help? Contact us at hello@archistudio.shop</p>
              </div>
              <div class="footer">
                <p>© ${year} Archistudio. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'overdue':
      return {
        subject: `Complete Your Learning Journey – ${data.courseName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📚 Continue Your Journey</h1>
              </div>
              <div class="content">
                <p>Hi ${data.name},</p>
                <p>We noticed your next payment for <strong>${data.courseName}</strong> is overdue.</p>
                
                <div class="warning-box">
                  <p style="margin: 0;">Current Access: <strong>${data.unlockedPercent}% unlocked</strong></p>
                  <p style="margin: 5px 0 0 0;">Amount to Unlock More: <strong>₹${data.remainingAmount?.toLocaleString()}</strong></p>
                </div>
                
                <p>Don't worry – your progress is safe and you can continue where you left off. Complete your payment to unlock more content!</p>
                
                <a href="https://archistudio.lovable.app/course/${data.courseSlug}" class="cta-button">Unlock More Content</a>
                
                <p style="color: #666; font-size: 14px;">Questions? We're here to help at hello@archistudio.shop</p>
              </div>
              <div class="footer">
                <p>© ${year} Archistudio. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'early_bonus':
      return {
        subject: `🎁 Early Payment Bonus Applied! – Archistudio`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎁 Early Bird Bonus!</h1>
              </div>
              <div class="content">
                <p>Hi ${data.name},</p>
                <p>Thank you for paying early! We've applied a special discount to your payment.</p>
                
                <div class="highlight">
                  <h3 style="margin: 0 0 10px 0;">Discount Applied</h3>
                  <p style="margin: 5px 0;">You Saved: <strong>₹${data.discountAmount}</strong></p>
                  <p style="margin: 5px 0;">Final Amount: <strong>₹${data.amountPaid?.toLocaleString()}</strong></p>
                </div>
                
                <p>Keep up the great work with your studies!</p>
                
                <a href="https://archistudio.lovable.app/learn/${data.courseSlug}" class="cta-button">Continue Learning</a>
              </div>
              <div class="footer">
                <p>© ${year} Archistudio. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case 'final_unlock':
      return {
        subject: `🎉 Full Course Unlocked – ${data.courseName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>${baseStyles}</head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Course Fully Unlocked!</h1>
              </div>
              <div class="content">
                <p>Hi ${data.name},</p>
                <p>Congratulations! You now have <strong>complete access</strong> to <strong>${data.courseName}</strong>!</p>
                
                <div class="highlight">
                  <h3 style="margin: 0 0 10px 0;">All Payments Complete</h3>
                  <p style="margin: 5px 0;">Total Paid: <strong>₹${data.amountPaid?.toLocaleString()}</strong></p>
                  <p style="margin: 5px 0;">Access: <strong>100% - Full Course</strong></p>
                </div>
                
                <p>All modules and lessons are now available. Complete the course to earn your certificate!</p>
                
                <a href="https://archistudio.lovable.app/learn/${data.courseSlug}" class="cta-button">Start Full Course</a>
              </div>
              <div class="footer">
                <p>© ${year} Archistudio. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      throw new Error("Invalid email type");
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: EMIEmailRequest = await req.json();
    
    if (!data.email || !data.name || !data.courseName || !data.emailType) {
      throw new Error("Missing required fields");
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const { subject, html } = getEmailContent(data);

    // Send email via Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Archistudio <hello@archistudio.shop>",
        to: [data.email],
        subject,
        html,
      }),
    });

    const result = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(result.message || "Failed to send email");
    }

    console.log("EMI email sent successfully:", result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending EMI email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
