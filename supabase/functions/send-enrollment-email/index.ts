import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

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
  amount?: number;
  orderId?: string;
  paymentDate?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      name, 
      courseName, 
      courseSlug, 
      isFree, 
      amount,
      orderId,
      paymentDate 
    }: EnrollmentEmailRequest = await req.json();

    if (!email || !courseName) {
      throw new Error("Email and course name are required");
    }

    const userName = name || "there";
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

    const subject = isFree 
      ? `You're enrolled in ${courseName}! 🎓`
      : `Payment Confirmed - Invoice for ${courseName} 🎉`;

    const invoiceSection = isFree ? "" : `
      <div style="background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <span style="font-size: 24px; margin-right: 10px;">🧾</span>
          <span style="color: #22c55e; font-weight: 700; font-size: 18px;">Payment Invoice</span>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 10px 0; color: #9ca3af;">Order ID</td>
            <td style="padding: 10px 0; color: #e5e5e5; text-align: right; font-family: monospace; font-size: 12px;">${orderId || 'N/A'}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 10px 0; color: #9ca3af;">Date</td>
            <td style="padding: 10px 0; color: #e5e5e5; text-align: right;">${formattedDate}</td>
          </tr>
          <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
            <td style="padding: 10px 0; color: #9ca3af;">Course</td>
            <td style="padding: 10px 0; color: #e5e5e5; text-align: right;">${courseName}</td>
          </tr>
          <tr>
            <td style="padding: 15px 0; color: #9ca3af; font-weight: 600;">Amount Paid</td>
            <td style="padding: 15px 0; color: #22c55e; text-align: right; font-weight: 700; font-size: 20px;">₹${(amount || 0).toLocaleString()}</td>
          </tr>
        </table>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.1);">
          <p style="margin: 0; color: #9ca3af; font-size: 12px;">✓ Payment received successfully via Cashfree</p>
        </div>
      </div>
    `;

    const enrollmentType = isFree ? "free enrollment" : "purchase";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Archistudio <onboarding@resend.dev>",
        to: [email],
        subject: subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
            <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
              <div style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1);">
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="font-size: 48px; margin-bottom: 15px;">${isFree ? '🎓' : '🎉'}</div>
                  <h1 style="color: #ffffff; font-size: 24px; margin: 0; font-weight: 700;">
                    ${isFree ? "You're Enrolled!" : "Payment Successful!"}
                  </h1>
                  <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #22c55e, #10b981); margin: 15px auto; border-radius: 2px;"></div>
                </div>
                <div style="color: #e5e5e5; font-size: 16px; line-height: 1.6;">
                  <p style="margin-bottom: 20px;">Hi ${userName}! 👋</p>
                  ${invoiceSection}
                  <p style="margin-bottom: 20px;">Congratulations on your ${enrollmentType}! You now have full access to:</p>
                  <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
                    <h2 style="color: #60a5fa; font-size: 20px; margin: 0 0 10px 0; font-weight: 600;">${courseName}</h2>
                    <p style="color: #9ca3af; margin: 0; font-size: 14px;">Lifetime access to all lessons, resources, and certificate upon completion.</p>
                  </div>
                  <p style="margin-bottom: 20px;">Here's what you can do next:</p>
                  <ul style="margin-bottom: 25px; padding-left: 20px;">
                    <li style="margin-bottom: 10px; color: #a5b4fc;">Start learning at your own pace</li>
                    <li style="margin-bottom: 10px; color: #a5b4fc;">Track your progress in the dashboard</li>
                    <li style="margin-bottom: 10px; color: #a5b4fc;">Download course resources</li>
                    <li style="margin-bottom: 10px; color: #a5b4fc;">Earn your certificate upon completion</li>
                  </ul>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://archistudio.lovable.app/course-player/${courseSlug}" style="display: inline-block; background: linear-gradient(90deg, #22c55e, #10b981); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Start Learning Now
                    </a>
                  </div>
                  <p style="margin-top: 30px; color: #9ca3af; font-size: 14px;">Happy learning! If you have any questions, our support team is here to help.</p>
                </div>
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">© 2024 Archistudio. All rights reserved.</p>
                  <p style="color: #6b7280; font-size: 11px; margin: 5px 0 0 0;">This is an automated email. Please do not reply.</p>
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
