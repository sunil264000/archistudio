import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function logEmail(supabase: any, recipient_email: string, recipient_name: string | null, email_type: string, subject: string, status: string, metadata?: any, error_message?: string) {
  try {
    await supabase.from('email_logs').insert({ recipient_email, recipient_name, email_type, subject, status, metadata, error_message });
  } catch (err) { console.error('Failed to log email:', err); }
}

type EmailType = 'confirmation' | 'reminder' | 'overdue' | 'early_bonus' | 'final_unlock';

interface EMIEmailRequest {
  email: string; name: string; courseName: string; courseSlug: string; emailType: EmailType;
  amountPaid?: number; remainingAmount?: number; unlockedPercent?: number; dueDate?: string; discountAmount?: number; orderId?: string;
}

const getEmailContent = (data: EMIEmailRequest): { subject: string; html: string } => {
  const year = new Date().getFullYear();

  // Common wrapper function
  const wrap = (heroIcon: string, heroTitle: string, heroSubtitle: string, subject: string, bodyContent: string) => {
    return {
      subject,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${subject}</title></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background-color:#2d1520;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#2d1520;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td align="center" style="padding:0 0 28px 0;">
          <div style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#c9a84c,#e8d48b,#c9a84c);border-radius:10px;">
            <span style="font-size:22px;font-weight:800;color:#2c1810;letter-spacing:2px;">ARCHISTUDIO</span>
          </div>
        </td></tr>
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffdf9;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,0.3);border:2px solid #c9a84c;">
            <tr><td style="padding:0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#6b1d3a,#4a1228,#7a2244);">
                <tr><td style="padding:36px 32px;text-align:center;">
                  <div style="width:72px;height:72px;margin:0 auto 14px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#e8d48b,#c9a84c);display:inline-block;line-height:72px;box-shadow:0 4px 20px rgba(201,168,76,0.4);">
                    <span style="font-size:36px;line-height:72px;">${heroIcon}</span>
                  </div>
                  <h1 style="color:#fffdf9;font-size:24px;margin:0 0 6px 0;font-weight:800;">${heroTitle}</h1>
                  <p style="color:#e8d48b;font-size:13px;margin:0;letter-spacing:1.5px;text-transform:uppercase;">${heroSubtitle}</p>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:32px;">
              <p style="color:#2c1810;font-size:16px;margin:0 0 24px 0;">Dear <strong>${data.name}</strong>,</p>
              ${bodyContent}
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr><td align="center">
                  <a href="https://archistudio.lovable.app/learn/${data.courseSlug}" style="display:inline-block;background:linear-gradient(135deg,#6b1d3a,#4a1228);color:#e8d48b;text-decoration:none;padding:14px 36px;border-radius:10px;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(107,29,58,0.3);letter-spacing:1px;">
                    Continue Learning →
                  </a>
                </td></tr>
              </table>
              <p style="margin:20px 0 0 0;color:#8b7355;font-size:13px;text-align:center;">Need help? Contact us at hello@archistudio.shop</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:28px 0 0 0;text-align:center;">
          <p style="margin:0 0 12px 0;">
            <a href="https://instagram.com/archistudio.in" style="color:#c9a84c80;text-decoration:none;margin:0 10px;font-size:13px;">Instagram</a>
            <span style="color:#c9a84c30;">•</span>
            <a href="https://t.me/archistudio_in" style="color:#c9a84c80;text-decoration:none;margin:0 10px;font-size:13px;">Telegram</a>
            <span style="color:#c9a84c30;">•</span>
            <a href="https://archistudio.lovable.app" style="color:#c9a84c80;text-decoration:none;margin:0 10px;font-size:13px;">Website</a>
          </p>
          <p style="color:#c9a84c30;font-size:12px;margin:0;">© ${year} Archistudio. All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
    };
  };

  const detailCard = (title: string, rows: string) => `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#fefcf3,#fffdf9);border:1.5px solid #c9a84c;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      <tr><td style="padding:16px 20px;background:linear-gradient(135deg,#6b1d3a,#4a1228);border-bottom:2px solid #c9a84c;">
        <span style="font-size:14px;font-weight:700;color:#e8d48b;letter-spacing:2px;">${title}</span>
      </td></tr>
      <tr><td style="padding:20px;">
        <table width="100%" cellpadding="0" cellspacing="0">${rows}</table>
      </td></tr>
    </table>`;

  const row = (label: string, value: string, isLast = false) =>
    `<tr><td style="padding:10px 0;color:#8b7355;font-size:13px;font-weight:500;border-bottom:${isLast ? 'none' : '1px solid #e8d48b40'};">${label}</td><td style="padding:10px 0;color:#2c1810;font-size:14px;font-weight:600;text-align:right;border-bottom:${isLast ? 'none' : '1px solid #e8d48b40'};">${value}</td></tr>`;

  switch (data.emailType) {
    case 'confirmation':
      return wrap('💳', 'Partial Access Activated!', data.courseName, `Partial Access Activated – ${data.courseName}`,
        `<p style="color:#5a4a3a;font-size:15px;margin:0 0 24px 0;line-height:1.7;">Your partial payment has been processed successfully!</p>
        ${detailCard('💳 PAYMENT DETAILS',
          row('Studio Program', data.courseName) +
          row('Amount Paid', `₹${data.amountPaid?.toLocaleString()}`) +
          row('Content Unlocked', `<strong style="color:#6b1d3a;">${data.unlockedPercent}%</strong>`) +
          (data.remainingAmount && data.remainingAmount > 0 ? row('Remaining', `₹${data.remainingAmount.toLocaleString()}`) : '') +
          (data.orderId ? row('Order ID', `<code style="background:#6b1d3a15;padding:2px 8px;border-radius:4px;font-size:12px;font-family:monospace;color:#6b1d3a;">${data.orderId}</code>`, true) : '')
        )}
        <p style="color:#5a4a3a;font-size:14px;margin:0;line-height:1.6;">Complete your remaining payment to unlock the full program!</p>`
      );

    case 'reminder':
      return wrap('📅', 'Payment Reminder', data.courseName, `Payment Reminder – ${data.courseName}`,
        `<p style="color:#5a4a3a;font-size:15px;margin:0 0 24px 0;line-height:1.7;">This is a friendly reminder about your upcoming payment for <strong style="color:#6b1d3a;">${data.courseName}</strong>.</p>
        ${detailCard('📅 UPCOMING PAYMENT',
          row('Amount Due', `<strong style="color:#6b1d3a;">₹${data.remainingAmount?.toLocaleString()}</strong>`) +
          row('Due Date', `<strong>${data.dueDate}</strong>`, true)
        )}
        <div style="padding:16px;background:#c9a84c10;border:1px solid #c9a84c30;border-radius:10px;margin-bottom:20px;">
          <p style="color:#6b1d3a;font-size:14px;margin:0;">💡 <strong>Pro Tip:</strong> Pay before the due date for an early payment discount!</p>
        </div>`
      );

    case 'overdue':
      return wrap('📚', 'Continue Your Journey', data.courseName, `Complete Your Learning Journey – ${data.courseName}`,
        `<p style="color:#5a4a3a;font-size:15px;margin:0 0 24px 0;line-height:1.7;">We noticed your next payment for <strong style="color:#6b1d3a;">${data.courseName}</strong> is overdue.</p>
        ${detailCard('⚠️ PAYMENT STATUS',
          row('Current Access', `${data.unlockedPercent}% unlocked`) +
          row('Amount to Unlock More', `<strong style="color:#6b1d3a;">₹${data.remainingAmount?.toLocaleString()}</strong>`, true)
        )}
        <p style="color:#5a4a3a;font-size:14px;margin:0;line-height:1.6;">Don't worry — your progress is saved. Complete your payment to unlock more content!</p>`
      );

    case 'early_bonus':
      return wrap('🎁', 'Early Bird Bonus!', 'Discount Applied', `🎁 Early Payment Bonus Applied! – Archistudio`,
        `<p style="color:#5a4a3a;font-size:15px;margin:0 0 24px 0;line-height:1.7;">Thank you for paying early! We've applied a special discount to your payment.</p>
        ${detailCard('🎁 DISCOUNT APPLIED',
          row('You Saved', `<strong style="color:#6b1d3a;">₹${data.discountAmount}</strong>`) +
          row('Final Amount', `₹${data.amountPaid?.toLocaleString()}`, true)
        )}
        <p style="color:#5a4a3a;font-size:14px;margin:0;">Keep up the great work with your studies!</p>`
      );

    case 'final_unlock':
      return wrap('🎉', 'Course Fully Unlocked!', '100% Access Granted', `🎉 Full Course Unlocked – ${data.courseName}`,
        `<p style="color:#5a4a3a;font-size:15px;margin:0 0 24px 0;line-height:1.7;">Congratulations! You now have <strong style="color:#6b1d3a;">complete access</strong> to <strong>${data.courseName}</strong>!</p>
        ${detailCard('✅ ALL PAYMENTS COMPLETE',
          row('Total Paid', `₹${data.amountPaid?.toLocaleString()}`) +
          row('Access', `<strong style="color:#6b1d3a;">100% — Full Program</strong>`, true)
        )}
        <p style="color:#5a4a3a;font-size:14px;margin:0;">All sessions are now available. Complete the program to earn your Proof of Completion!</p>`
      );

    default:
      throw new Error("Invalid email type");
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

  try {
    const data: EMIEmailRequest = await req.json();
    if (!data.email || !data.name || !data.courseName || !data.emailType) throw new Error("Missing required fields");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { subject, html } = getEmailContent(data);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: "Archistudio <hello@archistudio.shop>", to: [data.email], subject, html }),
    });

    const result = await emailResponse.json();
    if (!emailResponse.ok) throw new Error(result.message || "Failed to send email");

    console.log("EMI email sent:", result);
    await logEmail(supabase, data.email, data.name, 'emi', subject, 'sent', { emailType: data.emailType, courseName: data.courseName });

    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } });
  } catch (error: any) {
    console.error("Error sending EMI email:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
  }
});
