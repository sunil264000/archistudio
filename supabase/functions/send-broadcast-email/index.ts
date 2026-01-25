import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

const getCategoryColor = (category: string): string => {
  switch (category) {
    case 'announcement': return '#f59e0b';
    case 'promotion': return '#ec4899';
    case 'update': return '#22c55e';
    case 'newsletter': return '#6366f1';
    default: return '#3b82f6';
  }
};

const getCategoryLabel = (category: string): string => {
  switch (category) {
    case 'announcement': return 'Announcement';
    case 'promotion': return 'Special Offer';
    case 'update': return 'Product Update';
    case 'newsletter': return 'Newsletter';
    default: return 'Update';
  }
};

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
    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Unauthorized");
    }

    // Get the user from the token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: adminRole } = await supabase
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
    const categoryColor = getCategoryColor(category);
    const categoryLabel = getCategoryLabel(category);

    // Plain text version
    const textContent = `
${categoryLabel.toUpperCase()}

${subject}

${message}

---
Visit Archistudio: https://archistudio.lovable.app/courses

© ${currentYear} Archistudio. All rights reserved.
You're receiving this because you're a valued member of Archistudio.
    `.trim();

    // Build HTML email with table-based layout
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f0f0f;">
  
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${categoryLabel}: ${subject}
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
              </table>
            </td>
          </tr>
          
          <!-- Category Badge -->
          <tr>
            <td align="center" style="padding: 0 40px 25px;">
              <span style="display: inline-block; background: ${categoryColor}20; color: ${categoryColor}; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">
                ${categoryLabel}
              </span>
            </td>
          </tr>
          
          <!-- Subject -->
          <tr>
            <td style="padding: 0 40px;">
              <h1 style="color: #ffffff; font-size: 26px; margin: 0 0 25px 0; font-weight: 700; text-align: center; letter-spacing: -0.5px; line-height: 1.3;">
                ${subject}
              </h1>
            </td>
          </tr>
          
          <!-- Message Content -->
          <tr>
            <td style="padding: 0 40px 40px;">
              <div style="color: #d1d5db; font-size: 16px; line-height: 1.8;">
                ${message.split('\n').map(line => `<p style="margin: 0 0 15px 0;">${line || '&nbsp;'}</p>`).join('')}
              </div>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 35px 0;">
                <tr>
                  <td align="center">
                    <a href="https://archistudio.lovable.app/courses" style="display: inline-block; background: ${categoryColor}; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 600; font-size: 16px;">
                      Explore Courses
                    </a>
                  </td>
                </tr>
              </table>
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
                    <p style="color: #3f3f46; font-size: 11px; margin: 8px 0 0 0;">
                      You're receiving this because you're a valued member of Archistudio.
                    </p>
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

    let recipients: { email: string; name: string | null }[] = [];
    let sentCount = 0;
    let failedCount = 0;

    if (testMode && testEmail) {
      // Test mode - send only to specified email
      recipients = [{ email: testEmail, name: null }];
    } else {
      // Get recipients based on target audience
      let query = supabase
        .from("profiles")
        .select("email, full_name, user_id")
        .not("email", "is", null);

      if (targetAudience === 'enrolled') {
        const { data: enrolledUsers } = await supabase
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
        const { data: enrolledUsers } = await supabase
          .from("enrollments")
          .select("user_id")
          .eq("status", "active");
        
        const enrolledUserIds = [...new Set(enrolledUsers?.map(e => e.user_id) || [])];
        
        if (enrolledUserIds.length > 0) {
          query = query.not("user_id", "in", `(${enrolledUserIds.join(',')})`);
        }
      }

      const { data: profiles } = await query;
      recipients = profiles?.map(p => ({ email: p.email, name: p.full_name })).filter(r => r.email) || [];
    }

    console.log(`Sending broadcast email to ${recipients.length} recipients`);

    // Send emails in batches to avoid rate limits
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const emailPromises = batch.map(async (recipient) => {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "Archistudio <hello@archistudio.shop>",
              to: [recipient.email],
              reply_to: "hello@archistudio.shop",
              subject: subject,
              text: textContent,
              html: htmlContent,
              headers: {
                "List-Unsubscribe": "<mailto:unsubscribe@archistudio.shop>",
                "X-Entity-Ref-ID": `broadcast-${Date.now()}-${recipient.email}`,
              },
            }),
          });

          if (response.ok) {
            sentCount++;
            await logEmail(supabase, recipient.email, recipient.name, 'broadcast', subject, 'sent', null, { category, targetAudience });
          } else {
            failedCount++;
            const errData = await response.text();
            console.error(`Failed to send to ${recipient.email}:`, errData);
            await logEmail(supabase, recipient.email, recipient.name, 'broadcast', subject, 'failed', errData, { category, targetAudience });
          }
        } catch (error: any) {
          failedCount++;
          console.error(`Error sending to ${recipient.email}:`, error);
          await logEmail(supabase, recipient.email, recipient.name, 'broadcast', subject, 'failed', error.message, { category, targetAudience });
        }
      });

      await Promise.all(emailPromises);
      
      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log broadcast activity
    await supabase
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
