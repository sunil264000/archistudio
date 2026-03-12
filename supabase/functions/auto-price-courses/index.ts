import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MIN_PRICE = 399;
const MAX_PRICE = 4999;

// Price brackets snapped to nice numbers (₹399 → ₹4999)
const PRICE_BRACKETS = [399, 599, 799, 999, 1299, 1499, 1799, 1999, 2499, 2999, 3499, 3999, 4499, 4999];

/**
 * Calculate a content score (0.0 – 1.0) based on lessons and duration.
 * Caps:  50 lessons = max lessons score, 20 hours = max duration score.
 */
function calcScore(lessons: number, durationHours: number): number {
    const lessonScore = Math.min(lessons / 50, 1);       // 0–1
    const durationScore = Math.min(durationHours / 20, 1); // 0–1
    // Weighted: duration matters a bit more (60/40)
    return lessonScore * 0.4 + durationScore * 0.6;
}

/**
 * Snap a raw score to the nearest price bracket.
 */
function scoreToBracketPrice(score: number): number {
    const idx = Math.round(score * (PRICE_BRACKETS.length - 1));
    return PRICE_BRACKETS[Math.max(0, Math.min(idx, PRICE_BRACKETS.length - 1))];
}

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Auth: require admin JWT
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        // Verify admin via anon client
        const authClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } },
        });
        const { data: authData, error: authError } = await authClient.auth.getUser();
        if (authError || !authData?.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Check admin role using user_roles table
        const { data: roleData } = await serviceClient
            .from("user_roles")
            .select("role")
            .eq("user_id", authData.user.id)
            .eq("role", "admin")
            .maybeSingle();

        if (!roleData) {
            return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
                status: 403,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }

        // Get request body options
        let overwriteExisting = false;
        try {
            const body = await req.json();
            overwriteExisting = body?.overwriteExisting === true;
        } catch (_) { /* no body */ }

        // Fetch all published courses with their content metrics
        const { data: courses, error: courseError } = await serviceClient
            .from("courses")
            .select("id, slug, title, price_inr, total_lessons, duration_hours")
            .eq("is_published", true);

        if (courseError || !courses) {
            throw new Error("Failed to fetch courses");
        }

        const results: { slug: string; title: string; old_price: number; new_price: number; skipped?: boolean }[] = [];

        for (const course of courses) {
            const hasExistingPrice = course.price_inr != null && course.price_inr > 0;

            // Skip if already priced and overwriteExisting is false
            if (hasExistingPrice && !overwriteExisting) {
                results.push({
                    slug: course.slug,
                    title: course.title,
                    old_price: course.price_inr,
                    new_price: course.price_inr,
                    skipped: true,
                });
                continue;
            }

            // Count lessons via modules → lessons join
            const { data: moduleIds } = await serviceClient
                .from("modules")
                .select("id")
                .eq("course_id", course.id);

            let lessonCount = 0;
            if (moduleIds && moduleIds.length > 0) {
                const ids = moduleIds.map(m => m.id);
                const { count } = await serviceClient
                    .from("lessons")
                    .select("id", { count: "exact", head: true })
                    .in("module_id", ids);
                lessonCount = count ?? 0;
            }

            const lessons = lessonCount || course.total_lessons || 0;
            const durationHours = course.duration_hours ?? 0;

            const score = calcScore(lessons, durationHours);
            const newPrice = scoreToBracketPrice(score);

            const { error: updateError } = await serviceClient
                .from("courses")
                .update({ price_inr: newPrice, total_lessons: lessons || course.total_lessons })
                .eq("id", course.id);

            if (!updateError) {
                results.push({
                    slug: course.slug,
                    title: course.title,
                    old_price: course.price_inr ?? 0,
                    new_price: newPrice,
                });
            }
        }

        const updated = results.filter(r => !r.skipped).length;
        const skipped = results.filter(r => r.skipped).length;

        return new Response(
            JSON.stringify({
                success: true,
                updated,
                skipped,
                results,
            }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("Auto-price error:", error);
        return new Response(
            JSON.stringify({ error: error?.message || "Failed to auto-price courses" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
