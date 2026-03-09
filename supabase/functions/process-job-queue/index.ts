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

    // Pick up pending jobs ordered by priority
    const { data: jobs } = await supabase
      .from("job_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true })
      .limit(10);

    const results = { processed: 0, failed: 0, skipped: 0 };

    for (const job of jobs || []) {
      // Mark as processing
      await supabase.from("job_queue").update({
        status: "processing",
        started_at: new Date().toISOString(),
        attempts: job.attempts + 1,
      }).eq("id", job.id);

      try {
        let success = false;

        switch (job.job_type) {
          case "send-email": {
            const { template, recipient, data } = job.payload || {};
            if (template && recipient) {
              const fnName = `send-${template}-email`;
              const { error } = await supabase.functions.invoke(fnName, {
                body: { to: recipient, ...data },
              });
              success = !error;
            }
            break;
          }

          case "generate-certificate": {
            const { user_id, course_id } = job.payload || {};
            if (user_id && course_id) {
              const { error } = await supabase.functions.invoke("check-course-completion", {
                body: { userId: user_id, courseId: course_id },
              });
              success = !error;
            }
            break;
          }

          case "process-events": {
            const { error } = await supabase.functions.invoke("event-processor");
            success = !error;
            break;
          }

          case "scan-resources": {
            const { course_id } = job.payload || {};
            if (course_id) {
              const { error } = await supabase.functions.invoke("auto-scan-courses", {
                body: { courseId: course_id },
              });
              success = !error;
            }
            break;
          }

          case "ai-sheet-critique": {
            const { user_id, sheet_description } = job.payload || {};
            if (user_id && sheet_description) {
              // Queue a result back - AI mentor handles this synchronously via the frontend
              success = true;
            }
            break;
          }

          default:
            console.log(`Unknown job type: ${job.job_type}`);
            success = false;
        }

        if (success) {
          await supabase.from("job_queue").update({
            status: "completed",
            completed_at: new Date().toISOString(),
          }).eq("id", job.id);
          results.processed++;

          // Record metric
          await supabase.from("system_metrics").insert({
            metric_name: `job.${job.job_type}.success`,
            metric_value: 1,
          });
        } else {
          throw new Error("Job execution returned failure");
        }
      } catch (e: any) {
        const newAttempts = job.attempts + 1;
        const isFinal = newAttempts >= job.max_attempts;

        await supabase.from("job_queue").update({
          status: isFinal ? "failed" : "pending",
          error_message: e.message || "Unknown error",
          // Exponential backoff for retry
          scheduled_for: isFinal ? undefined : new Date(Date.now() + Math.pow(2, newAttempts) * 60000).toISOString(),
        }).eq("id", job.id);

        results.failed++;

        // Log to system_errors if final failure
        if (isFinal) {
          await supabase.from("system_errors").insert({
            service: "job-queue",
            error_type: `job_failed_${job.job_type}`,
            payload: { job_id: job.id, ...job.payload, error: e.message },
          });
        }
      }
    }

    // Record processing metric
    await supabase.from("system_metrics").insert({
      metric_name: "job_queue.batch_processed",
      metric_value: results.processed,
      tags: { failed: results.failed },
    });

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Job queue processor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
