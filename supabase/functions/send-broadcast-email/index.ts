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
  subject: string; message: string; category: 'announcement' | 'promotion' | 'update' | 'newsletter';
  targetAudience: 'all' | 'enrolled' | 'not-enrolled'; testMode?: boolean; testEmail?: string;
}

const getCategoryIcon = (c: string) => {
  switch(c) { case 'announcement': return '📢'; case 'promotion': return '🎯'; case 'update': return '🔄'; case 'newsletter': return '📰'; default: return '📬'; }
};

const getCategoryLabel = (c: string) => {
  switch(c) { case 'announcement': return 'Announcement'; case 'promotion': return 'Special Offer'; case 'update': return 'Product Update'; case 'newsletter': return 'Newsletter'; default: return 'Update'; }
};

async function logEmail(supabase: any, recipientEmail: string, recipientName: string | null, emailType: string, subject: string, status: 'sent' | 'failed', errorMessage: string | null = null, metadata: Record<string, any> = {}) {
  try {
    await supabase.from('email_logs').insert({ recipient_email: recipientEmail, recipient_name: recipientName, email_type: emailType, subject, status, error_message: errorMessage, metadata });
  } catch (err) { console.error('Failed to log email:', err); }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");
    const { data: adminRole } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    if (!adminRole) throw new Error("Unauthorized - Admin access required");

    const { subject, message, category, targetAudience, testMode, testEmail }: BroadcastEmailRequest = await req.json();
    if (!subject || !message) throw new Error("Subject and message are required");

    const currentYear = new Date().getFullYear();
    const catIcon = getCategoryIcon(category);
    const catLabel = getCategoryLabel(category);

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${subject}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#2d1520;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#2d1520;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Logo -->
        <tr><td align="center" style="padding:0 0 28px 0;">
          <div style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#c9a84c,#e8d48b,#c9a84c);border-radius:10px;">
            <span style="font-size:22px;font-weight:800;color:#2c1810;letter-spacing:2px;">ARCHISTUDIO</span>
          </div>
        </td></tr>

        <!-- Main Card -->
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffdf9;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.3);border:2px solid #c9a84c;">

            <!-- Hero -->
            <tr><td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#6b1d3a,#4a1228,#7a2244);">
                <tr><td style="padding:36px 32px;text-align:center;">
                  <div style="display:inline-block;padding:8px 20px;background:#c9a84c20;border:1px solid #c9a84c40;border-radius:20px;margin-bottom:16px;">
                    <span style="color:#e8d48b;font-size:13px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;">${catIcon} ${catLabel}</span>
                  </div>
                  <h1 style="color:#fffdf9;font-size:24px;margin:0;font-weight:800;line-height:1.3;">${subject}</h1>
                </td></tr>
              </table>
            </td></tr>

            <!-- Content -->
            <tr><td style="padding:32px;">
              <div style="color:#5a4a3a;font-size:15px;line-height:1.8;">
                ${message.split('\n').map((line: string) => `<p style="margin:0 0 15px 0;">${line || '&nbsp;'}</p>`).join('')}
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr><td align="center">
                  <a href="https://archistudio.lovable.app/courses" style="display:inline-block;background:linear-gradient(135deg,#6b1d3a,#4a1228);color:#e8d48b;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(107,29,58,0.3);letter-spacing:1px;">
                    Explore Studio Programs →
                  </a>
                </td></tr>
              </table>
            </td></tr>
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:28px 0 0 0;text-align:center;">
          <p style="margin:0 0 12px 0;">
            <a href="https://instagram.com/archistudio.in" style="color:#c9a84c80;text-decoration:none;margin:0 10px;font-size:13px;">Instagram</a>
            <span style="color:#c9a84c30;">•</span>
            <a href="https://t.me/archistudio_in" style="color:#c9a84c80;text-decoration:none;margin:0 10px;font-size:13px;">Telegram</a>
            <span style="color:#c9a84c30;">•</span>
            <a href="https://archistudio.lovable.app" style="color:#c9a84c80;text-decoration:none;margin:0 10px;font-size:13px;">Website</a>
          </p>
          <p style="color:#c9a84c30;font-size:12px;margin:0;">© ${currentYear} Archistudio. All rights reserved.</p>
          <p style="color:#c9a84c20;font-size:11px;margin:8px 0 0 0;">You're receiving this because you're a valued member of Archistudio.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    let recipients: { email: string; name: string | null }[] = [];
    let sentCount = 0;
    let failedCount = 0;

    if (testMode && testEmail) {
      recipients = [{ email: testEmail, name: null }];
    } else {
      let query = supabase.from("profiles").select("email, full_name, user_id").not("email", "is", null);
      if (targetAudience === 'enrolled') {
        const { data: enrolledUsers } = await supabase.from("enrollments").select("user_id").eq("status", "active");
        const enrolledUserIds = [...new Set(enrolledUsers?.map((e: any) => e.user_id) || [])];
        if (enrolledUserIds.length > 0) query = query.in("user_id", enrolledUserIds);
        else recipients = [];
      } else if (targetAudience === 'not-enrolled') {
        const { data: enrolledUsers } = await supabase.from("enrollments").select("user_id").eq("status", "active");
        const enrolledUserIds = [...new Set(enrolledUsers?.map((e: any) => e.user_id) || [])];
        if (enrolledUserIds.length > 0) query = query.not("user_id", "in", `(${enrolledUserIds.join(',')})`);
      }
      const { data: profiles } = await query;
      recipients = profiles?.map((p: any) => ({ email: p.email, name: p.full_name })).filter((r: any) => r.email) || [];
    }

    console.log(`Sending broadcast to ${recipients.length} recipients`);

    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const emailPromises = batch.map(async (recipient) => {
        try {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
            body: JSON.stringify({
              from: "Archistudio <hello@archistudio.shop>", to: [recipient.email], reply_to: "hello@archistudio.shop",
              subject, html: htmlContent,
              headers: { "List-Unsubscribe": "<mailto:unsubscribe@archistudio.shop>", "X-Entity-Ref-ID": `broadcast-${Date.now()}-${recipient.email}` },
            }),
          });
          if (response.ok) {
            sentCount++;
            await logEmail(supabase, recipient.email, recipient.name, 'broadcast', subject, 'sent', null, { category, targetAudience });
          } else {
            failedCount++;
            const errData = await response.text();
            await logEmail(supabase, recipient.email, recipient.name, 'broadcast', subject, 'failed', errData, { category, targetAudience });
          }
        } catch (error: any) {
          failedCount++;
          await logEmail(supabase, recipient.email, recipient.name, 'broadcast', subject, 'failed', error.message, { category, targetAudience });
        }
      });
      await Promise.all(emailPromises);
      if (i + batchSize < recipients.length) await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await supabase.from("analytics_events").insert({
      event_type: "email_broadcast", user_id: user.id,
      event_data: { subject, category, targetAudience, totalRecipients: recipients.length, sentCount, failedCount, testMode: testMode || false },
    });

    return new Response(JSON.stringify({ success: true, totalRecipients: recipients.length, sentCount, failedCount, testMode: testMode || false }), {
      status: 200, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Broadcast email error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
