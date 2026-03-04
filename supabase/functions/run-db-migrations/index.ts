import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// postgres.js works in Supabase Edge Functions and provides full DDL access
import postgres from "https://deno.land/x/postgresjs@v3.4.4/mod.js";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const dbUrl = Deno.env.get("SUPABASE_DB_URL")!;

        // Verify caller is an admin
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
            global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (!user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const { data: profile } = await userClient
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        if (!profile || !["admin", "super_admin"].includes(profile.role ?? "")) {
            return new Response(JSON.stringify({ error: "Admin access required" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Connect directly to Postgres for DDL operations
        const sql = postgres(dbUrl, { max: 1 });
        const results: { name: string; status: string; error?: string }[] = [];

        // ── Migration 1: support_tickets table ──────────────────────────────
        try {
            await sql`
        CREATE TABLE IF NOT EXISTS public.support_tickets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          user_email TEXT NOT NULL DEFAULT '',
          user_name TEXT NOT NULL DEFAULT '',
          course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
          course_title TEXT NOT NULL DEFAULT '',
          lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
          lesson_title TEXT,
          issue_text TEXT NOT NULL,
          screenshot_url TEXT,
          admin_notes TEXT,
          status TEXT NOT NULL DEFAULT 'open'
            CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
            await sql`ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY`;
            await sql`CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status, created_at DESC)`;
            await sql`CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id)`;

            // RLS policies (IF NOT EXISTS via DO block)
            await sql`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='support_tickets' AND policyname='Users can create support tickets') THEN
            CREATE POLICY "Users can create support tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='support_tickets' AND policyname='Users can view their own tickets') THEN
            CREATE POLICY "Users can view their own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='support_tickets' AND policyname='Admins can manage all tickets') THEN
            CREATE POLICY "Admins can manage all tickets" ON public.support_tickets FOR ALL TO authenticated
              USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')));
          END IF;
        END $$
      `;
            results.push({ name: "support_tickets", status: "ok" });
        } catch (e: any) {
            results.push({ name: "support_tickets", status: "error", error: e.message });
        }

        // ── Migration 2: support-screenshots storage bucket ─────────────────
        try {
            await sql`
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('support-screenshots', 'support-screenshots', true)
        ON CONFLICT (id) DO NOTHING
      `;
            await sql`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Users can upload support screenshots') THEN
            CREATE POLICY "Users can upload support screenshots" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'support-screenshots');
          END IF;
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='objects' AND policyname='Public read support screenshots') THEN
            CREATE POLICY "Public read support screenshots" ON storage.objects FOR SELECT TO public USING (bucket_id = 'support-screenshots');
          END IF;
        END $$
      `;
            results.push({ name: "support_screenshots_bucket", status: "ok" });
        } catch (e: any) {
            results.push({ name: "support_screenshots_bucket", status: "error", error: e.message });
        }

        // ── Migration 3: profiles.referred_by column ─────────────────────────
        try {
            await sql`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by TEXT`;
            await sql`CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL`;
            await sql`CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by) WHERE referred_by IS NOT NULL`;
            results.push({ name: "profiles_referred_by", status: "ok" });
        } catch (e: any) {
            results.push({ name: "profiles_referred_by", status: "error", error: e.message });
        }

        // ── Migration 4: course access expiry columns ─────────────────────────
        try {
            await sql`ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS access_duration_days INTEGER DEFAULT NULL`;
            await sql`ALTER TABLE public.enrollments ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL`;
            await sql`CREATE INDEX IF NOT EXISTS idx_enrollments_expires_at ON public.enrollments(expires_at) WHERE expires_at IS NOT NULL`;
            results.push({ name: "course_access_expiry", status: "ok" });
        } catch (e: any) {
            results.push({ name: "course_access_expiry", status: "error", error: e.message });
        }

        // ── Migration 5: admin_daily_summaries table ─────────────────────────
        try {
            await sql`
        CREATE TABLE IF NOT EXISTS public.admin_daily_summaries (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          summary_text TEXT NOT NULL,
          new_enrollments INTEGER NOT NULL DEFAULT 0,
          total_revenue NUMERIC NOT NULL DEFAULT 0,
          new_tickets INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
            await sql`ALTER TABLE public.admin_daily_summaries ENABLE ROW LEVEL SECURITY`;
            await sql`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='admin_daily_summaries' AND policyname='Admins can read summaries') THEN
            CREATE POLICY "Admins can read summaries" ON public.admin_daily_summaries FOR SELECT TO authenticated
              USING (EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin','super_admin')));
          END IF;
        END $$
      `;
            results.push({ name: "admin_daily_summaries", status: "ok" });
        } catch (e: any) {
            results.push({ name: "admin_daily_summaries", status: "error", error: e.message });
        }

        await sql.end();

        const allOk = results.every(r => r.status === "ok");
        return new Response(JSON.stringify({ success: allOk, results }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("run-db-migrations error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
