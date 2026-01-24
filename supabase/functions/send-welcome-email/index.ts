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

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Archistudio <hello@archistudio.shop>",
        to: [email],
        subject: `Welcome to Archistudio! 🎉${testBadge}`,
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
                
                <!-- Logo -->
                <div style="text-align: center; margin-bottom: 30px;">
                  <div style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(16, 185, 129, 0.15) 100%); border-radius: 14px; border: 1px solid rgba(34, 197, 94, 0.25);">
                    <span style="font-size: 26px; font-weight: 800; background: linear-gradient(90deg, #22c55e, #10b981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -0.5px;">ARCHISTUDIO</span>
                  </div>
                  <p style="color: #6b7280; font-size: 13px; margin: 12px 0 0 0; letter-spacing: 1px; text-transform: uppercase;">Premium Architecture Education</p>
                </div>
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 35px;">
                  <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2)); border-radius: 50%; line-height: 80px; font-size: 40px; margin-bottom: 15px;">🎉</div>
                  <h1 style="color: #ffffff; font-size: 26px; margin: 0; font-weight: 700; letter-spacing: -0.5px;">
                    Welcome to Archistudio!
                  </h1>
                  <div style="width: 50px; height: 3px; background: linear-gradient(90deg, #6366f1, #a855f7); margin: 18px auto 0; border-radius: 2px;"></div>
                </div>
                
                <div style="color: #e5e5e5; font-size: 16px; line-height: 1.7;">
                  <p style="margin-bottom: 25px; font-size: 18px;">Hi <strong style="color: #fff;">${userName}</strong>! 👋</p>
                  
                  <p style="margin-bottom: 20px; color: #d1d5db;">Thank you for joining Archistudio! We're thrilled to have you as part of our community of aspiring architects and designers.</p>
                  
                  <p style="margin-bottom: 18px; color: #d1d5db;">With Archistudio, you'll have access to:</p>
                  
                  <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 14px; padding: 22px; margin-bottom: 28px;">
                    <div style="display: flex; align-items: center; margin-bottom: 14px;">
                      <span style="color: #818cf8; margin-right: 12px; font-size: 18px;">📚</span>
                      <span style="color: #a5b4fc;">Industry-leading architectural visualization studios</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 14px;">
                      <span style="color: #818cf8; margin-right: 12px; font-size: 18px;">👨‍🏫</span>
                      <span style="color: #a5b4fc;">Expert instructors with real-world experience</span>
                    </div>
                    <div style="display: flex; align-items: center; margin-bottom: 14px;">
                      <span style="color: #818cf8; margin-right: 12px; font-size: 18px;">🛠️</span>
                      <span style="color: #a5b4fc;">Hands-on projects and practical exercises</span>
                    </div>
                    <div style="display: flex; align-items: center;">
                      <span style="color: #818cf8; margin-right: 12px; font-size: 18px;">🏆</span>
                      <span style="color: #a5b4fc;">Proof of Completion upon finishing</span>
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin: 35px 0;">
                    <a href="https://archistudio.lovable.app/courses" style="display: inline-block; background: linear-gradient(90deg, #6366f1, #a855f7); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                      Explore Studios →
                    </a>
                  </div>
                  
                  <p style="margin-top: 30px; color: #9ca3af; font-size: 14px; text-align: center;">If you have any questions, feel free to reach out to our support team.</p>
                </div>
                
                <!-- Footer -->
                <div style="margin-top: 40px; padding-top: 25px; border-top: 1px solid rgba(255,255,255,0.08); text-align: center;">
                  <div style="margin-bottom: 18px;">
                    <a href="https://instagram.com/archistudio.in" style="color: #6b7280; text-decoration: none; margin: 0 12px; font-size: 13px;">Instagram</a>
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
