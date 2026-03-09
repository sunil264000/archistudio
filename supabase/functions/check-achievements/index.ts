import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Achievement definitions with auto-check rules
const ACHIEVEMENT_RULES = [
  { key: "first_enrollment", check: "enrollments", threshold: 1, title: "First Step", description: "Enrolled in your first course", category: "course", points: 10, icon: "📚" },
  { key: "course_collector_5", check: "enrollments", threshold: 5, title: "Course Collector", description: "Enrolled in 5 courses", category: "course", points: 25, icon: "🎓" },
  { key: "first_completion", check: "certificates", threshold: 1, title: "Graduate", description: "Completed your first course", category: "course", points: 50, icon: "🏆" },
  { key: "triple_threat", check: "certificates", threshold: 3, title: "Triple Threat", description: "Completed 3 courses", category: "course", points: 100, icon: "⭐" },
  { key: "forum_contributor", check: "forum_topics", threshold: 1, title: "Forum Contributor", description: "Created your first forum topic", category: "forum", points: 10, icon: "💬" },
  { key: "forum_veteran", check: "forum_topics", threshold: 10, title: "Forum Veteran", description: "Created 10 forum topics", category: "forum", points: 50, icon: "🗣️" },
  { key: "helpful_answer", check: "forum_answers", threshold: 5, title: "Helpful Hand", description: "Provided 5 forum answers", category: "forum", points: 30, icon: "🤝" },
  { key: "streak_3", check: "streak", threshold: 3, title: "On Fire", description: "3-day learning streak", category: "streak", points: 15, icon: "🔥" },
  { key: "streak_7", check: "streak", threshold: 7, title: "Week Warrior", description: "7-day learning streak", category: "streak", points: 30, icon: "⚡" },
  { key: "streak_30", check: "streak", threshold: 30, title: "Month Master", description: "30-day learning streak", category: "streak", points: 100, icon: "💎" },
  { key: "portfolio_creator", check: "portfolios", threshold: 1, title: "Portfolio Pioneer", description: "Created your first portfolio", category: "social", points: 20, icon: "🎨" },
  { key: "challenge_first", check: "challenge_submissions", threshold: 1, title: "Challenge Accepted", description: "Submitted your first challenge", category: "social", points: 15, icon: "🎯" },
  { key: "bookworm", check: "bookmarks", threshold: 10, title: "Bookworm", description: "Bookmarked 10 lessons", category: "course", points: 15, icon: "📖" },
  { key: "note_taker", check: "notes", threshold: 20, title: "Diligent Note-Taker", description: "Created 20 lesson notes", category: "course", points: 25, icon: "📝" },
];

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

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;

    // Get user's existing achievements
    const { data: existingAchievements } = await adminClient
      .from("user_achievements")
      .select("achievement_id")
      .eq("user_id", userId);

    const existingKeys = new Set<string>();
    
    // Get achievement keys for existing achievements
    if (existingAchievements && existingAchievements.length > 0) {
      const { data: achievementDetails } = await adminClient
        .from("achievements")
        .select("id, key")
        .in("id", existingAchievements.map((a: any) => a.achievement_id));
      
      (achievementDetails || []).forEach((a: any) => existingKeys.add(a.key));
    }

    // Check each rule
    const newlyUnlocked: string[] = [];

    for (const rule of ACHIEVEMENT_RULES) {
      if (existingKeys.has(rule.key)) continue;

      let count = 0;

      if (rule.check === "streak") {
        const { data: streakData } = await adminClient
          .from("user_streaks")
          .select("current_streak")
          .eq("user_id", userId)
          .single();
        count = streakData?.current_streak || 0;
      } else {
        const { count: tableCount } = await adminClient
          .from(rule.check)
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId);
        count = tableCount || 0;
      }

      if (count >= rule.threshold) {
        // Ensure achievement exists in achievements table
        const { data: existing } = await adminClient
          .from("achievements")
          .select("id")
          .eq("key", rule.key)
          .single();

        let achievementId: string;
        if (existing) {
          achievementId = existing.id;
        } else {
          const { data: created } = await adminClient
            .from("achievements")
            .insert({
              key: rule.key,
              title: rule.title,
              description: rule.description,
              category: rule.category,
              points: rule.points,
              icon: rule.icon,
            })
            .select("id")
            .single();
          achievementId = created!.id;
        }

        // Grant achievement
        await adminClient.from("user_achievements").insert({
          user_id: userId,
          achievement_id: achievementId,
        });

        // Award points
        await adminClient.from("point_transactions").insert({
          user_id: userId,
          points: rule.points,
          reason: `Achievement: ${rule.title}`,
          metadata: { achievement_key: rule.key },
        });

        newlyUnlocked.push(rule.key);
      }
    }

    // Update streak
    await updateStreak(adminClient, userId);

    return new Response(
      JSON.stringify({ unlocked: newlyUnlocked, total_checked: ACHIEVEMENT_RULES.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Achievement check error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function updateStreak(adminClient: any, userId: string) {
  const today = new Date().toISOString().split("T")[0];

  // Check if user was active today
  const { count } = await adminClient
    .from("activity_history")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("started_at", today + "T00:00:00Z")
    .lte("started_at", today + "T23:59:59Z");

  if (!count || count === 0) return;

  // Get current streak data
  const { data: streak } = await adminClient
    .from("user_streaks")
    .select("*")
    .eq("user_id", userId)
    .single();

  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (!streak) {
    await adminClient.from("user_streaks").insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_active_date: today,
    });
  } else if (streak.last_active_date === today) {
    // Already updated today
    return;
  } else if (streak.last_active_date === yesterday) {
    // Continue streak
    const newStreak = (streak.current_streak || 0) + 1;
    await adminClient.from("user_streaks").update({
      current_streak: newStreak,
      longest_streak: Math.max(newStreak, streak.longest_streak || 0),
      last_active_date: today,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
  } else {
    // Streak broken, reset
    await adminClient.from("user_streaks").update({
      current_streak: 1,
      last_active_date: today,
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
  }
}
