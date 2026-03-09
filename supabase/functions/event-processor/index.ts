import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REPUTATION_MAP: Record<string, number> = {
  SHEET_UPLOADED: 10,
  CRITIQUE_CREATED: 5,
  FORUM_ANSWER: 5,
  BEST_ANSWER: 10,
  CHALLENGE_SUBMITTED: 10,
  CHALLENGE_WON: 20,
  PORTFOLIO_PUBLISHED: 15,
  COURSE_COMPLETED: 25,
  USER_ENROLLED: 5,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch unprocessed events
    const { data: events } = await supabase
      .from("platform_events")
      .select("*")
      .eq("processed", false)
      .order("created_at")
      .limit(100);

    const results = { processed: 0, errors: 0 };

    for (const event of events || []) {
      try {
        const { event_type, actor_id, payload } = event;

        // 1. Add reputation points
        const points = REPUTATION_MAP[event_type];
        if (points && actor_id) {
          await supabase.from("point_transactions").insert({
            user_id: actor_id,
            points,
            reason: event_type.toLowerCase().replace(/_/g, " "),
          });

          // Update user_points
          const { data: existing } = await supabase
            .from("user_points")
            .select("total_points")
            .eq("user_id", actor_id)
            .single();

          if (existing) {
            await supabase.from("user_points").update({
              total_points: existing.total_points + points,
            }).eq("user_id", actor_id);
          } else {
            await supabase.from("user_points").insert({
              user_id: actor_id,
              total_points: points,
            });
          }
        }

        // 2. Create activity feed entry
        if (actor_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", actor_id)
            .single();

          const actionMap: Record<string, string> = {
            USER_ENROLLED: "enrolled in a course",
            SHEET_UPLOADED: "uploaded a design sheet",
            CRITIQUE_CREATED: "wrote a sheet critique",
            FORUM_ANSWER: "answered a forum question",
            PORTFOLIO_PUBLISHED: "published their portfolio",
            CHALLENGE_SUBMITTED: "submitted a challenge entry",
            COURSE_COMPLETED: "completed a course",
          };

          const action = actionMap[event_type] || event_type.toLowerCase().replace(/_/g, " ");

          await supabase.from("activity_feed").insert({
            user_id: actor_id,
            action,
            target_type: payload?.target_type || null,
            target_id: payload?.target_id || null,
            target_title: payload?.target_title || null,
            metadata: { event_type, points: points || 0, actor_name: profile?.full_name },
          });
        }

        // 3. Create notifications for relevant parties
        if (event_type === "CRITIQUE_CREATED" && payload?.sheet_owner_id) {
          await supabase.from("notifications").insert({
            user_id: payload.sheet_owner_id,
            title: "New critique on your sheet",
            message: `Someone critiqued your sheet "${payload.target_title || "design sheet"}"`,
            type: "info",
            action_url: payload.target_id ? `/sheets/${payload.target_id}` : "/sheets",
          });
        }

        if (event_type === "FORUM_ANSWER" && payload?.topic_owner_id) {
          await supabase.from("notifications").insert({
            user_id: payload.topic_owner_id,
            title: "New answer to your question",
            message: `Someone answered your forum post "${payload.target_title || "question"}"`,
            type: "info",
            action_url: payload.target_id ? `/forum/${payload.target_id}` : "/forum",
          });
        }

        // Mark processed
        await supabase.from("platform_events").update({ processed: true }).eq("id", event.id);
        results.processed++;
      } catch (e) {
        console.error(`Failed to process event ${event.id}:`, e);
        results.errors++;
      }
    }

    console.log("Event processing completed:", results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Event processor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
