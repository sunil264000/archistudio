import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BroadcastEmailRequest {
  subject: string;
  message: string;
  category: 'announcement' | 'promotion' | 'update' | 'newsletter';
  targetAudience: 'all' | 'enrolled' | 'not-enrolled';
  testMode?: boolean;
  testEmail?: string;
}

const getCategoryEmoji = (category: string): string => {
  switch (category) {
    case 'announcement': return '📢';
    case 'promotion': return '🎁';
    case 'update': return '🆕';
    case 'newsletter': return '📰';
    default: return '📧';
  }
};

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'announcement': return '#f59e0b';
    case 'promotion': return '#ec4899';
    case 'update': return '#22c55e';
    case 'newsletter': return '#6366f1';
    default: return '#3b82f6';
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Unauthorized");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the user from the token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      throw new Error("Unauthorized - Admin access required");
    }

    const { 
      subject, 
      message, 
      category,
      targetAudience,
      testMode,
      testEmail
    }: BroadcastEmailRequest = await req.json();

    if (!subject || !message) {
      throw new Error("Subject and message are required");
    }

    const currentYear = new Date().getFullYear();
    const categoryEmoji = getCategoryEmoji(category);
    const categoryColor = getCategoryColor(category);

    // Build HTML email
    const htmlContent = `
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
            </div>
            
            <!-- Category Badge -->
            <div style="text-align: center; margin-bottom: 25px;">
              <span style="display: inline-block; background: ${categoryColor}20; color: ${categoryColor}; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                ${categoryEmoji} ${category}
              </span>
            </div>
            
            <!-- Subject -->
            <h1 style="color: #ffffff; font-size: 26px; margin: 0 0 25px 0; font-weight: 700; text-align: center; letter-spacing: -0.5px; line-height: 1.3;">
              ${subject}
            </h1>
            
            <!-- Message Content -->
            <div style="color: #d1d5db; font-size: 16px; line-height: 1.8; white-space: pre-wrap;">
              ${message.split('\n').map(line => `<p style="margin: 0 0 15px 0;">${line || '&nbsp;'}</p>`).join('')}
            </div>
            
            <!-- CTA Button -->
            <div style="text-align: center; margin: 35px 0;">
              <a href="https://archistudio.lovable.app/courses" style="display: inline-block; background: linear-gradient(90deg, ${categoryColor}, ${categoryColor}dd); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px ${categoryColor}40;">
                Explore Courses →
              </a>
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
              <p style="color: #3f3f46; font-size: 11px; margin: 8px 0 0 0;">
                You're receiving this because you're a valued member of Archistudio.
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    let recipients: string[] = [];
    let sentCount = 0;
    let failedCount = 0;

    if (testMode && testEmail) {
      // Test mode - send only to specified email
      recipients = [testEmail];
    } else {
      // Get recipients based on target audience
      let query = supabaseClient
        .from("profiles")
        .select("email, user_id")
        .not("email", "is", null);

      if (targetAudience === 'enrolled') {
        // Get users who have at least one enrollment
        const { data: enrolledUsers } = await supabaseClient
          .from("enrollments")
          .select("user_id")
          .eq("status", "active");
        
        const enrolledUserIds = [...new Set(enrolledUsers?.map(e => e.user_id) || [])];
        
        if (enrolledUserIds.length > 0) {
          query = query.in("user_id", enrolledUserIds);
        } else {
          recipients = [];
        }
      } else if (targetAudience === 'not-enrolled') {
        // Get users who have no enrollments
        const { data: enrolledUsers } = await supabaseClient
          .from("enrollments")
          .select("user_id")
          .eq("status", "active");
        
        const enrolledUserIds = [...new Set(enrolledUsers?.map(e => e.user_id) || [])];
        
        if (enrolledUserIds.length > 0) {
          query = query.not("user_id", "in", `(${enrolledUserIds.join(',')})`);
        }
      }

      const { data: profiles } = await query;
      recipients = profiles?.map(p => p.email).filter(Boolean) as string[] || [];
    }

    console.log(`Sending broadcast email to ${recipients.length} recipients`);

    // Send emails in batches to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const emailPromises = batch.map(async (email) => {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Archistudio <hello@archistudio.shop>",
              to: [email],
              subject: `${categoryEmoji} ${subject}`,
              html: htmlContent,
            }),
          });

          if (response.ok) {
            sentCount++;
          } else {
            failedCount++;
            const errData = await response.text();
            console.error(`Failed to send to ${email}:`, errData);
          }
        } catch (error) {
          failedCount++;
          console.error(`Error sending to ${email}:`, error);
        }
      });

      await Promise.all(emailPromises);
      
      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log broadcast activity
    await supabaseClient
      .from("analytics_events")
      .insert({
        event_type: "email_broadcast",
        user_id: user.id,
        event_data: {
          subject,
          category,
          targetAudience,
          totalRecipients: recipients.length,
          sentCount,
          failedCount,
          testMode: testMode || false,
        },
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        totalRecipients: recipients.length,
        sentCount,
        failedCount,
        testMode: testMode || false,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Broadcast email error:", error);
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
