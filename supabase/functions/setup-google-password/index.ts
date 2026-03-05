import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generatePassword(): string {
    const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lower = "abcdefghjkmnpqrstuvwxyz";
    const digits = "23456789";
    const all = upper + lower + digits;

    // Ensure at least one of each character class
    const pwd = [
        upper[Math.floor(Math.random() * upper.length)],
        lower[Math.floor(Math.random() * lower.length)],
        digits[Math.floor(Math.random() * digits.length)],
        ...Array.from({ length: 5 }, () => all[Math.floor(Math.random() * all.length)]),
    ];

    // Shuffle
    for (let i = pwd.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
    }
    return pwd.join("");
}

const handler = async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { userId, email, name } = await req.json();

        if (!userId || !email) {
            return new Response(JSON.stringify({ success: false, error: "Missing userId or email" }), {
                status: 400,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        // Check if password has already been set for this user (idempotency)
        const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("google_password_sent")
            .eq("user_id", userId)
            .maybeSingle();

        if (profile?.google_password_sent) {
            return new Response(JSON.stringify({ success: true, alreadySent: true }), {
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        // Generate and set password
        const password = generatePassword();

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password,
        });

        if (updateError) {
            console.error("Failed to set password:", updateError);
            return new Response(JSON.stringify({ success: false, error: updateError.message }), {
                status: 500,
                headers: { "Content-Type": "application/json", ...corsHeaders },
            });
        }

        // Mark password as sent in profile
        await supabaseAdmin
            .from("profiles")
            .update({ google_password_sent: true })
            .eq("user_id", userId);

        // Send the password to the user via email
        const userName = name || email.split("@")[0];
        const currentYear = new Date().getFullYear();

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Archistudio Account Password</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="display:none;">Your Archistudio account is ready — here's your temporary password.</div>
  <table width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f5;">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellspacing="0" cellpadding="0" style="background:#fff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td align="center" style="padding:40px;background:linear-gradient(135deg,#1a1a2e,#0f172a);border-radius:16px 16px 0 0;">
          <div style="padding:12px 24px;background:rgba(34,197,94,0.15);border-radius:12px;border:1px solid rgba(34,197,94,0.3);display:inline-block;">
            <span style="font-size:22px;font-weight:700;color:#22c55e;">ARCHISTUDIO</span>
          </div>
          <p style="color:#94a3b8;font-size:12px;margin:10px 0 0;letter-spacing:1.5px;text-transform:uppercase;">Account Ready</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <div style="text-align:center;margin-bottom:24px;">
            <div style="width:72px;height:72px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:50%;line-height:72px;font-size:32px;display:inline-block;">🔑</div>
          </div>
          <h1 style="color:#18181b;font-size:24px;font-weight:700;margin:0 0 12px;text-align:center;">Welcome, ${userName}!</h1>
          <p style="color:#52525b;font-size:15px;line-height:1.7;margin:0 0 28px;text-align:center;">
            You signed in with Google. We've created a password for your account so you can also sign in with your email directly.
          </p>

          <!-- Password Box -->
          <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <div style="display:inline-block;background:linear-gradient(135deg,#f8fafc,#f1f5f9);border:2px dashed #6366f1;border-radius:16px;padding:20px 40px;text-align:center;">
                <p style="color:#71717a;font-size:12px;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px;">Your Temporary Password</p>
                <div style="font-size:28px;font-weight:700;letter-spacing:6px;color:#18181b;font-family:'Courier New',monospace;">${password}</div>
              </div>
            </td></tr>
          </table>

          <!-- Warning Box -->
          <table width="100%" cellspacing="0" cellpadding="0" style="background:#fef3c7;border-radius:12px;border:1px solid #fcd34d;margin-bottom:28px;">
            <tr><td style="padding:16px 20px;">
              <p style="color:#92400e;font-size:14px;margin:0;">⚠️ <strong>Change this password</strong> after logging in from your Dashboard → Account settings.</p>
            </td></tr>
          </table>

          <!-- CTA Button -->
          <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
            <tr><td align="center">
              <a href="https://archistudio.shop/dashboard" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;">Go to Dashboard →</a>
            </td></tr>
          </table>

          <p style="color:#71717a;font-size:13px;text-align:center;margin:0;">Your email: <strong>${email}</strong></p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 40px 32px;background:#fafafa;border-radius:0 0 16px 16px;border-top:1px solid #f4f4f5;text-align:center;">
          <p style="color:#a1a1aa;font-size:12px;margin:0;">© ${currentYear} Archistudio. All rights reserved.</p>
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
                subject: "Your Archistudio Account Password",
                text: `Hi ${userName}! Your Archistudio temporary password is: ${password}\n\nPlease change it from your Dashboard after logging in.\n\nYour email: ${email}`,
                html: htmlContent,
                headers: { "X-Entity-Ref-ID": `google-pwd-${userId}` },
            }),
        });

        const emailData = await emailRes.json();
        console.log("Password email sent:", emailData);

        return new Response(JSON.stringify({ success: true }), {
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    } catch (error: any) {
        console.error("setup-google-password error:", error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    }
};

serve(handler);
