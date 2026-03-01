import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, email, name, courseName, amount, orderId, courseSlug } = body;

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get admin emails from user_roles table
    const { data: adminRoles } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRoles || adminRoles.length === 0) {
      return new Response(JSON.stringify({ success: true, skipped: 'no_admins' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminUserIds = adminRoles.map(r => r.user_id);
    const { data: adminProfiles } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .in('user_id', adminUserIds);

    const adminEmails = adminProfiles?.map(p => p.email).filter(Boolean) as string[];
    if (!adminEmails.length) {
      return new Response(JSON.stringify({ success: true, skipped: 'no_admin_emails' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    let subject = '';
    let htmlContent = '';

    if (type === 'new_signup') {
      subject = `🆕 New Signup: ${name || email}`;
      htmlContent = `
        <div style="font-family:sans-serif;padding:20px;max-width:500px;">
          <h2 style="color:#6b1d3a;">New User Signed Up</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${name || 'N/A'}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${email}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Time</td><td style="padding:8px;border-bottom:1px solid #eee;">${now}</td></tr>
          </table>
          <p style="color:#888;font-size:12px;margin-top:20px;">— Archistudio Admin Notification</p>
        </div>`;
    } else if (type === 'new_purchase') {
      subject = `💰 New Purchase: ${name || email} bought ${courseName}`;
      htmlContent = `
        <div style="font-family:sans-serif;padding:20px;max-width:500px;">
          <h2 style="color:#16a34a;">New Course Purchase!</h2>
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Student</td><td style="padding:8px;border-bottom:1px solid #eee;">${name || 'N/A'}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;">${email}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Course</td><td style="padding:8px;border-bottom:1px solid #eee;">${courseName}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Amount</td><td style="padding:8px;border-bottom:1px solid #eee;">₹${amount}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Order ID</td><td style="padding:8px;border-bottom:1px solid #eee;font-size:11px;">${orderId || 'N/A'}</td></tr>
            <tr><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Time</td><td style="padding:8px;border-bottom:1px solid #eee;">${now}</td></tr>
          </table>
          <p style="color:#888;font-size:12px;margin-top:20px;">— Archistudio Admin Notification</p>
        </div>`;
    } else {
      return new Response(JSON.stringify({ success: false, error: 'Unknown type' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Send email to all admins
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Archistudio Notifications <hello@archistudio.shop>",
        to: adminEmails,
        subject,
        html: htmlContent,
        headers: { "X-Entity-Ref-ID": `admin-notify-${Date.now()}` },
      }),
    });

    const resData = await emailRes.json();
    console.log("Admin notification sent:", resData);

    // Also create in-app notification for admins
    for (const adminId of adminUserIds) {
      await supabaseAdmin.from('notifications').insert({
        user_id: adminId,
        title: subject,
        message: type === 'new_signup'
          ? `${name || email} just signed up.`
          : `${name || email} purchased ${courseName} for ₹${amount}`,
        type: type === 'new_signup' ? 'info' : 'success',
        is_global: false,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Admin notify error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
