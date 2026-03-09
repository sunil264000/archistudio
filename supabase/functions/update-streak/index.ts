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

    const { activity_type, page_url, course_id, lesson_id } = await req.json();

    // Log activity
    const sessionId = crypto.randomUUID();
    await adminClient.from("activity_history").insert({
      user_id: userId,
      activity_type: activity_type || "page_view",
      page_url: page_url || null,
      course_id: course_id || null,
      lesson_id: lesson_id || null,
      session_id: sessionId,
      started_at: new Date().toISOString(),
    });

    // Update streak
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const { data: streak } = await adminClient
      .from("user_streaks")
      .select("*")
      .eq("user_id", userId)
      .single();

    let currentStreak = 1;
    let longestStreak = 1;

    if (!streak) {
      await adminClient.from("user_streaks").insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: today,
      });
    } else if (streak.last_active_date === today) {
      currentStreak = streak.current_streak;
      longestStreak = streak.longest_streak;
    } else if (streak.last_active_date === yesterday) {
      currentStreak = (streak.current_streak || 0) + 1;
      longestStreak = Math.max(currentStreak, streak.longest_streak || 0);
      await adminClient.from("user_streaks").update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_active_date: today,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    } else {
      await adminClient.from("user_streaks").update({
        current_streak: 1,
        last_active_date: today,
        updated_at: new Date().toISOString(),
      }).eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({ success: true, current_streak: currentStreak, longest_streak: longestStreak }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Streak update error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
