import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeEmailRequest = await req.json();

    if (!email) {
      throw new Error("Email is required");
    }

    const userName = name || "there";

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Archistudio <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to Archistudio! 🎉",
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
                  <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">
                    Welcome to Archistudio
                  </h1>
                  <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #3b82f6, #8b5cf6); margin: 15px auto; border-radius: 2px;"></div>
                </div>
                <div style="color: #e5e5e5; font-size: 16px; line-height: 1.6;">
                  <p style="margin-bottom: 20px;">Hi ${userName}! 👋</p>
                  <p style="margin-bottom: 20px;">Thank you for joining Archistudio! We're thrilled to have you as part of our community of aspiring architects and designers.</p>
                  <p style="margin-bottom: 20px;">With Archistudio, you'll have access to:</p>
                  <ul style="margin-bottom: 25px; padding-left: 20px;">
                    <li style="margin-bottom: 10px; color: #a5b4fc;">Industry-leading architectural visualization courses</li>
                    <li style="margin-bottom: 10px; color: #a5b4fc;">Expert instructors with real-world experience</li>
                    <li style="margin-bottom: 10px; color: #a5b4fc;">Hands-on projects and practical exercises</li>
                    <li style="margin-bottom: 10px; color: #a5b4fc;">Certificates upon course completion</li>
                  </ul>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://concrete-logic.lovable.app/courses" style="display: inline-block; background: linear-gradient(90deg, #3b82f6, #8b5cf6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Explore Courses
                    </a>
                  </div>
                  <p style="margin-top: 30px; color: #9ca3af; font-size: 14px;">If you have any questions, feel free to reach out to our support team.</p>
                </div>
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); text-align: center;">
                  <p style="color: #6b7280; font-size: 12px; margin: 0;">© 2024 Archistudio. All rights reserved.</p>
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
