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

    const user = data?.users?.find((u: { email?: string | null; id?: string }) => (u.email || '').toLowerCase() === normalized);
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
  <title>Verify Your Email - Archistudio</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <div style="display:none;font-size:1px;color:#09090b;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Your Archistudio verification code is ${otp}. Valid for 10 minutes.</div>
  
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#09090b;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <!-- Container -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#18181b;border-radius:24px;overflow:hidden;border:1px solid #27272a;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
          
          <!-- Header Image/Gradient -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg, #1e293b 0%, #0f172a 100%);padding:60px 40px;position:relative;">
              <div style="margin-bottom:20px;">
                <img src="https://archistudio.shop/logo-mark.png" alt="Archistudio" width="64" height="64" style="display:block;border-radius:16px;">
              </div>
              <h2 style="margin:0;color:#f8fafc;font-size:24px;font-weight:800;letter-spacing:-0.025em;text-transform:uppercase;">Archistudio</h2>
              <p style="margin:8px 0 0;color:#94a3b8;font-size:12px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;">Neural Learning Environment</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:48px 40px;">
              <div style="text-align:center;">
                <h1 style="margin:0 0 16px;color:#ffffff;font-size:32px;font-weight:800;letter-spacing:-0.05em;line-height:1.2;">Verify your identity</h1>
                <p style="margin:0 0 40px;color:#a1a1aa;font-size:16px;line-height:1.6;">
                  Hi <strong>${userName}</strong>, welcome to the studio. Use the secure code below to finalize your account setup and unlock your curriculum.
                </p>

                <!-- OTP Card -->
                <div style="background-color:#27272a;border-radius:20px;padding:32px;margin-bottom:40px;border:1px solid #3f3f46;">
                  <p style="margin:0 0 16px;color:#71717a;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Verification Code</p>
                  <div style="font-family:'Courier New', Courier, monospace;font-size:48px;font-weight:800;color:#ffffff;letter-spacing:12px;margin:0;">
                    ${otp}
                  </div>
                </div>

                <!-- Info Box -->
                <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:rgba(196,90,50,0.1);border-radius:16px;border:1px solid rgba(196,90,50,0.2);margin-bottom:32px;">
                  <tr>
                    <td style="padding:16px;text-align:center;">
                      <p style="margin:0;color:#c45a32;font-size:14px;font-weight:600;">
                        ⏱️ This code will expire in 10 minutes
                      </p>
                    </td>
                  </tr>
                </table>

                <p style="margin:0;color:#52525b;font-size:13px;">
                  If you didn't request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:32px 40px;background-color:#0f172a;border-top:1px solid #27272a;">
              <p style="margin:0 0 12px;color:#94a3b8;font-size:12px;font-weight:500;">
                Master architecture the way it's practiced.
              </p>
              <div style="margin-bottom:20px;">
                <a href="https://archistudio.shop" style="color:#c45a32;text-decoration:none;font-size:12px;font-weight:700;margin:0 10px;">Website</a>
                <span style="color:#3f3f46;">&bull;</span>
                <a href="https://archistudio.shop/courses" style="color:#c45a32;text-decoration:none;font-size:12px;font-weight:700;margin:0 10px;">Courses</a>
                <span style="color:#3f3f46;">&bull;</span>
                <a href="https://archistudio.shop/studio-hub" style="color:#c45a32;text-decoration:none;font-size:12px;font-weight:700;margin:0 10px;">Studio Hub</a>
              </div>
              <p style="margin:0;color:#4b5563;font-size:11px;">
                &copy; ${currentYear} Archistudio &bull; All Rights Reserved
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
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
