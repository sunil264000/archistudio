import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub;

    // Get user's enrollments
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", userId)
      .eq("status", "active");

    const enrolledIds = (enrollments || []).map((e: any) => e.course_id);

    // Get enrolled course details
    const { data: enrolledCourses } = enrolledIds.length > 0
      ? await supabase.from("courses").select("category_id, tags, level, title").in("id", enrolledIds)
      : { data: [] };

    // Get completed courses
    const { data: certs } = await supabase.from("certificates").select("course_id").eq("user_id", userId);
    const completedIds = new Set((certs || []).map((c: any) => c.course_id));

    // Get all available courses
    const { data: allCourses } = await supabase
      .from("courses")
      .select("id, title, slug, thumbnail_url, level, short_description, category_id, tags, is_featured, price_inr")
      .eq("is_published", true)
      .order("order_index");

    if (!allCourses) {
      return new Response(JSON.stringify({ recommendations: [] }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const enrolledCategories = new Set((enrolledCourses || []).map((c: any) => c.category_id).filter(Boolean));
    const enrolledTags = new Set((enrolledCourses || []).flatMap((c: any) => c.tags || []));
    const enrolledLevels = new Set((enrolledCourses || []).map((c: any) => c.level).filter(Boolean));

    // Advanced scoring algorithm
    const scored = allCourses
      .filter(c => !enrolledIds.includes(c.id))
      .map(c => {
        let score = 0;
        const reasons: string[] = [];

        // Category affinity (strongest signal)
        if (c.category_id && enrolledCategories.has(c.category_id)) {
          score += 5;
          reasons.push("Related to your current studies");
        }

        // Tag overlap (skill adjacency)
        const tagOverlap = (c.tags || []).filter((t: string) => enrolledTags.has(t)).length;
        if (tagOverlap > 0) {
          score += tagOverlap * 2.5;
          reasons.push(`${tagOverlap} matching skill${tagOverlap > 1 ? "s" : ""}`);
        }

        // Level progression logic
        if (enrolledLevels.has("beginner") && c.level === "intermediate") {
          score += 4;
          reasons.push("Natural next step from beginner");
        }
        if (enrolledLevels.has("intermediate") && c.level === "advanced") {
          score += 4;
          reasons.push("Ready to level up");
        }

        // Completion momentum (if user completes courses, recommend more)
        if (completedIds.size > 0) {
          score += 1;
          reasons.push("Keep your momentum going");
        }

        // Featured bonus
        if (c.is_featured) {
          score += 1.5;
          reasons.push("Top-rated by students");
        }

        // New user path
        if (enrolledIds.length === 0) {
          if (c.level === "beginner") {
            score += 5;
            reasons.push("Perfect starting point");
          }
          if (c.is_featured) {
            score += 2;
          }
        }

        return {
          id: c.id,
          title: c.title,
          slug: c.slug,
          thumbnail_url: c.thumbnail_url,
          level: c.level,
          short_description: c.short_description,
          price_inr: c.price_inr,
          score,
          reason: reasons[0] || "Expand your skillset",
          reasons,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    // Log recommendations
    if (scored.length > 0) {
      await supabase.from("recommendation_logs").insert({
        user_id: userId,
        recommended_course_ids: scored.map(s => s.id),
        reason: "algorithm_v2",
        ai_generated: false,
      });
    }

    return new Response(
      JSON.stringify({ recommendations: scored }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Recommendation error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
