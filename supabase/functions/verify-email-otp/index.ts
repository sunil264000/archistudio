import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function findAuthUserIdByEmail(supabaseAdmin: any, email: string) {
  const normalized = email.toLowerCase().trim();

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) break;

    const user = data?.users?.find((u) => (u.email || '').toLowerCase() === normalized);
    if (user?.id) return user.id;

    if (!data?.users?.length || data.users.length < 200) break;
  }

  return null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { action, email, code, name } = await req.json();

    if (action === "send") {
      // Generate 6-digit code
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

      // Store OTP in site_settings (simple, no new table needed)
      await supabaseAdmin.from("site_settings").upsert({
        key: `otp_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        value: JSON.stringify({ code: otp, expires_at: expiresAt, attempts: 0 }),
        description: `OTP for ${email}`,
      }, { onConflict: "key" });

      // Send email with OTP
      const userName = name || "there";
      const currentYear = new Date().getFullYear();

      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;">Your verification code is ${otp}</div>
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr><td align="center" style="padding:40px;background:linear-gradient(135deg,#1a1a2e,#0f172a);border-radius:16px 16px 0 0;">
          <div style="padding:12px 24px;background:rgba(34,197,94,0.15);border-radius:12px;border:1px solid rgba(34,197,94,0.3);display:inline-block;">
            <span style="font-size:22px;font-weight:700;color:#22c55e;">ARCHISTUDIO</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:10px 0 0;letter-spacing:1.5px;text-transform:uppercase;">Email Verification</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:72px;height:72px;background:linear-gradient(135deg,#22c55e,#16a34a);border-radius:50%;line-height:72px;font-size:32px;display:inline-block;">&#9989;</div>
          </div>
          <h1 style="color:#18181b;font-size:26px;font-weight:700;margin:0 0 16px;text-align:center;">Verify Your Email</h1>
          <p style="color:#52525b;font-size:16px;line-height:1.7;margin:0 0 32px;text-align:center;">
            Hi <strong>${userName}</strong>! Enter this 6-digit code to verify your email:
          </p>
          <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:32px;">
            <tr><td align="center">
              <div style="display:inline-block;background:linear-gradient(135deg,#f8fafc,#f1f5f9);border:2px dashed #6366f1;border-radius:16px;padding:24px 48px;font-size:36px;font-weight:700;letter-spacing:10px;color:#18181b;font-family:'Courier New',monospace;">
                ${otp}
              </div>
            </td></tr>
          </table>
          <table width="100%" cellspacing="0" cellpadding="0" style="background:#fef3c7;border-radius:12px;border:1px solid #fcd34d;margin-bottom:24px;">
            <tr><td style="padding:16px 20px;">
              <p style="color:#92400e;font-size:14px;margin:0;">&#9200; This code expires in <strong>10 minutes</strong></p>
            </td></tr>
          </table>
          <p style="color:#71717a;font-size:13px;text-align:center;margin:0;">If you didn't request this, ignore this email.</p>
        </td></tr>
        <tr><td style="padding:24px 40px 32px;background:#fafafa;border-radius:0 0 16px 16px;border-top:1px solid #f4f4f5;text-align:center;">
          <p style="color:#a1a1aa;font-size:12px;margin:0;">&copy; ${currentYear} Archistudio. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`.trim();

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Archistudio <hello@archistudio.shop>",
          to: [email],
          reply_to: "hello@archistudio.shop",
          subject: `Your Archistudio Verification Code: ${otp}`,
          text: `Your verification code is: ${otp}. It expires in 10 minutes.`,
          html: htmlContent,
          headers: { "X-Entity-Ref-ID": `otp-${Date.now()}` },
        }),
      });

      const emailData = await emailRes.json();
      console.log("OTP email sent:", emailData);

      // Log to email_logs
      await supabaseAdmin.from("email_logs").insert({
        email_type: "verification_otp",
        recipient_email: email,
        recipient_name: name || null,
        subject: `Verification Code: ${otp.substring(0, 2)}****`,
        status: emailRes.ok ? "sent" : "failed",
        error_message: emailRes.ok ? null : JSON.stringify(emailData),
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (action === "verify") {
      const key = `otp_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
      const { data: setting } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", key)
        .single();

      if (!setting) {
        return new Response(JSON.stringify({ success: false, error: "No verification code found. Please request a new one." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      const otpData = JSON.parse(setting.value || "{}");

      // Check attempts
      if (otpData.attempts >= 5) {
        await supabaseAdmin.from("site_settings").delete().eq("key", key);
        return new Response(JSON.stringify({ success: false, error: "Too many attempts. Please request a new code." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Increment attempts
      otpData.attempts = (otpData.attempts || 0) + 1;
      await supabaseAdmin.from("site_settings").update({
        value: JSON.stringify(otpData),
      }).eq("key", key);

      // Check expiry
      if (new Date(otpData.expires_at) < new Date()) {
        await supabaseAdmin.from("site_settings").delete().eq("key", key);
        return new Response(JSON.stringify({ success: false, error: "Code expired. Please request a new one." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Check code
      if (otpData.code !== code) {
        return new Response(JSON.stringify({ success: false, error: `Invalid code. ${5 - otpData.attempts} attempts remaining.` }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      // Code is valid! Mark user email as verified in auth + profile
      const normalizedEmail = email.toLowerCase().trim();
      const { data: profileRow } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .ilike("email", normalizedEmail)
        .maybeSingle();

      const targetUserId = profileRow?.user_id || await findAuthUserIdByEmail(supabaseAdmin, normalizedEmail);

      if (!targetUserId) {
        return new Response(JSON.stringify({ success: false, error: "Account not found for this email. Please sign up again." }), {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }

      await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        email_confirm: true,
      });

      // Keep profile in sync (create if missing)
      const { data: existingProfile } = await supabaseAdmin
        .from("profiles")
        .select("user_id")
        .eq("user_id", targetUserId)
        .maybeSingle();

      if (existingProfile?.user_id) {
        await supabaseAdmin
          .from("profiles")
          .update({ email_verified: true, updated_at: new Date().toISOString(), email: normalizedEmail })
          .eq("user_id", targetUserId);
      } else {
        await supabaseAdmin
          .from("profiles")
          .insert({
            user_id: targetUserId,
            email: normalizedEmail,
            role: "student",
            email_verified: true,
          });
      }

      // Clean up OTP
      await supabaseAdmin.from("site_settings").delete().eq("key", key);

      return new Response(JSON.stringify({ success: true, verified: true }), {
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("OTP error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
