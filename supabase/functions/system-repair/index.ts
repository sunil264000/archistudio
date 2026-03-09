import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const results = {
      errors_fixed: 0,
      errors_escalated: 0,
      integrity_issues: 0,
      details: [] as string[],
    };

    // === 1. Process unresolved system errors ===
    const { data: errors } = await supabase
      .from("system_errors")
      .select("*")
      .eq("resolved", false)
      .lt("attempts", 3)
      .order("created_at")
      .limit(50);

    for (const error of errors || []) {
      let fixed = false;

      try {
        switch (error.error_type) {
          case "missing_profile": {
            const userId = error.payload?.user_id;
            if (userId) {
              const { error: insertErr } = await supabase
                .from("profiles")
                .upsert({ user_id: userId, full_name: "User", created_at: new Date().toISOString() }, { onConflict: "user_id" });
              fixed = !insertErr;
            }
            break;
          }
          case "failed_enrollment": {
            const { user_id, course_id, payment_id } = error.payload || {};
            if (user_id && course_id) {
              const { data: existing } = await supabase
                .from("enrollments")
                .select("id")
                .eq("user_id", user_id)
                .eq("course_id", course_id)
                .single();
              if (!existing) {
                const { error: enrollErr } = await supabase
                  .from("enrollments")
                  .insert({ user_id, course_id, payment_id, status: "active" });
                fixed = !enrollErr;
              } else {
                fixed = true; // Already enrolled
              }
            }
            break;
          }
          case "orphan_enrollment": {
            const enrollId = error.payload?.enrollment_id;
            if (enrollId) {
              await supabase.from("enrollments").delete().eq("id", enrollId);
              fixed = true;
            }
            break;
          }
          case "invalid_certificate": {
            const certId = error.payload?.certificate_id;
            if (certId) {
              await supabase.from("certificates").delete().eq("id", certId);
              fixed = true;
              results.details.push(`Removed invalid certificate ${certId}`);
            }
            break;
          }
        }
      } catch (e) {
        console.error(`Fix attempt failed for ${error.id}:`, e);
      }

      if (fixed) {
        await supabase.from("system_errors").update({
          resolved: true,
          auto_fix_attempted: true,
          attempts: error.attempts + 1,
          resolved_at: new Date().toISOString(),
          resolution_note: "Auto-fixed by system-repair",
        }).eq("id", error.id);
        results.errors_fixed++;
      } else {
        await supabase.from("system_errors").update({
          auto_fix_attempted: true,
          attempts: error.attempts + 1,
        }).eq("id", error.id);
        if (error.attempts + 1 >= 3) results.errors_escalated++;
      }
    }

    // === 2. Data integrity checks ===

    // Check for orphan enrollments (user doesn't exist in profiles)
    const { data: orphanEnrollments } = await supabase.rpc("get_referral_by_code", { code: "__noop__" }).maybeSingle();
    // Instead, query directly
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("id, user_id, course_id")
      .limit(500);

    if (enrollments) {
      const userIds = [...new Set(enrollments.map(e => e.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id")
        .in("user_id", userIds);
      const profileSet = new Set(profiles?.map(p => p.user_id) || []);

      for (const e of enrollments) {
        if (!profileSet.has(e.user_id)) {
          await supabase.from("system_errors").insert({
            service: "integrity-check",
            error_type: "orphan_enrollment",
            payload: { enrollment_id: e.id, user_id: e.user_id },
          });
          results.integrity_issues++;
        }
      }
    }

    // Check courses with no lessons
    const { data: courses } = await supabase
      .from("courses")
      .select("id, title, is_published, total_lessons")
      .eq("is_published", true);

    for (const course of courses || []) {
      const { count } = await supabase
        .from("lessons")
        .select("id", { count: "exact", head: true })
        .eq("course_id", course.id);

      if ((count || 0) === 0 && course.is_published) {
        await supabase.from("system_errors").insert({
          service: "integrity-check",
          error_type: "empty_published_course",
          payload: { course_id: course.id, title: course.title },
        });
        results.integrity_issues++;
        results.details.push(`Course "${course.title}" is published with 0 lessons`);
      }
    }

    console.log("System repair completed:", results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("System repair error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
