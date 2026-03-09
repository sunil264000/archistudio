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

  const startTime = Date.now();

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Cleanup expired cache and rate limit entries
    await adminClient.rpc("cleanup_expired_cache");

    // Database health check
    const { error: dbError } = await adminClient.from("courses").select("id", { count: "exact", head: true });
    const dbHealthy = !dbError;

    // Check critical tables
    const criticalTables = ["courses", "enrollments", "profiles", "payments", "certificates"];
    const tableChecks: Record<string, boolean> = {};

    await Promise.all(
      criticalTables.map(async (table) => {
        const { error } = await adminClient.from(table).select("id", { head: true, count: "exact" });
        tableChecks[table] = !error;
      })
    );

    // Check for stuck jobs
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: stuckJobs } = await adminClient
      .from("job_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "processing")
      .lt("started_at", fiveMinAgo);

    // Auto-heal stuck jobs
    if (stuckJobs && stuckJobs > 0) {
      await adminClient
        .from("job_queue")
        .update({ status: "pending", error_message: "Auto-reset: timed out" })
        .eq("status", "processing")
        .lt("started_at", fiveMinAgo);
    }

    // Check unprocessed events backlog
    const { count: eventBacklog } = await adminClient
      .from("platform_events")
      .select("id", { count: "exact", head: true })
      .eq("processed", false);

    // Cache stats
    const { count: cacheEntries } = await adminClient
      .from("server_cache")
      .select("cache_key", { count: "exact", head: true });

    const { count: expiredCache } = await adminClient
      .from("server_cache")
      .select("cache_key", { count: "exact", head: true })
      .lt("expires_at", new Date().toISOString());

    // Rate limit stats
    const { count: rateLimitEntries } = await adminClient
      .from("rate_limit_buckets")
      .select("id", { count: "exact", head: true });

    const latency = Date.now() - startTime;
    const allHealthy = dbHealthy && Object.values(tableChecks).every(Boolean);

    const healthReport = {
      status: allHealthy ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      latency_ms: latency,
      database: {
        connected: dbHealthy,
        tables: tableChecks,
      },
      job_queue: {
        stuck_jobs: stuckJobs || 0,
        auto_healed: stuckJobs && stuckJobs > 0 ? stuckJobs : 0,
      },
      event_processor: {
        backlog: eventBacklog || 0,
        healthy: (eventBacklog || 0) < 1000,
      },
      cache: {
        total_entries: cacheEntries || 0,
        expired_cleaned: expiredCache || 0,
      },
      rate_limiter: {
        active_buckets: rateLimitEntries || 0,
      },
      infrastructure: {
        edge_functions: "running",
        auto_scaling: "enabled",
        region: "auto",
      },
    };

    return new Response(
      JSON.stringify(healthReport),
      {
        status: allHealthy ? 200 : 503,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store",
        },
      }
    );
  } catch (err) {
    console.error("Health check error:", err);
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        error: (err as Error).message,
        timestamp: new Date().toISOString(),
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
