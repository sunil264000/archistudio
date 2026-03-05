import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    if (type === 'new_signup') {
      // Only create in-app notification for admins, no email
      const { data: adminRoles } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && adminRoles.length > 0) {
        for (const { user_id } of adminRoles) {
          await supabaseAdmin.from('notifications').insert({
            user_id,
            title: `🆕 New Signup: ${name || email}`,
            message: `${name || email} just signed up.`,
            type: 'info',
            is_global: false,
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === 'new_purchase') {
      // Store purchase in digest table for daily batch email
      await supabaseAdmin.from('admin_purchase_digest').insert({
        buyer_email: email,
        buyer_name: name || null,
        item_type: courseSlug ? 'course' : 'course',
        item_name: courseName,
        amount: amount || 0,
        order_id: orderId || null,
      });

      // Also create in-app notification for admins immediately
      const { data: adminRoles } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && adminRoles.length > 0) {
        for (const { user_id } of adminRoles) {
          await supabaseAdmin.from('notifications').insert({
            user_id,
            title: `💰 New Purchase: ${courseName}`,
            message: `${name || email} purchased ${courseName} for ₹${amount}`,
            type: 'success',
            is_global: false,
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (type === 'ebook_purchase') {
      await supabaseAdmin.from('admin_purchase_digest').insert({
        buyer_email: email,
        buyer_name: name || null,
        item_type: 'ebook',
        item_name: courseName || body.bundleName || 'eBook Bundle',
        amount: amount || 0,
        order_id: orderId || null,
      });

      const { data: adminRoles } = await supabaseAdmin
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && adminRoles.length > 0) {
        for (const { user_id } of adminRoles) {
          await supabaseAdmin.from('notifications').insert({
            user_id,
            title: `📚 eBook Purchase`,
            message: `${name || email} purchased eBooks for ₹${amount}`,
            type: 'success',
            is_global: false,
          });
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: false, error: 'Unknown type' }), {
      status: 400,
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
