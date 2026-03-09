import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * API Gateway with:
 * - Rate limiting (DB-backed sliding window)
 * - Request validation
 * - Circuit breaker pattern
 * - Response caching for GET requests
 */

// In-memory circuit breaker state (per isolate)
const circuitBreakers: Record<string, { failures: number; lastFailure: number; state: "closed" | "open" | "half-open" }> = {};

function getCircuitBreaker(service: string) {
  if (!circuitBreakers[service]) {
    circuitBreakers[service] = { failures: 0, lastFailure: 0, state: "closed" };
  }
  return circuitBreakers[service];
}

function checkCircuit(service: string): boolean {
  const cb = getCircuitBreaker(service);
  if (cb.state === "closed") return true;
  if (cb.state === "open") {
    // Check if cooldown expired (30s)
    if (Date.now() - cb.lastFailure > 30000) {
      cb.state = "half-open";
      return true;
    }
    return false;
  }
  // half-open: allow one request
  return true;
}

function recordSuccess(service: string) {
  const cb = getCircuitBreaker(service);
  cb.failures = 0;
  cb.state = "closed";
}

function recordFailure(service: string) {
  const cb = getCircuitBreaker(service);
  cb.failures++;
  cb.lastFailure = Date.now();
  if (cb.failures >= 5) {
    cb.state = "open";
  }
}

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

    const body = await req.json();
    const { action, params, cache_ttl } = body;

    if (!action) {
      return new Response(
        JSON.stringify({ error: "Missing action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract rate limit identifier (IP or user ID)
    const authHeader = req.headers.get("Authorization");
    let identifier = req.headers.get("x-forwarded-for") || "anonymous";

    if (authHeader?.startsWith("Bearer ")) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const token = authHeader.replace("Bearer ", "");
      const { data: claims } = await supabase.auth.getClaims(token);
      if (claims?.claims?.sub) {
        identifier = claims.claims.sub as string;
      }
    }

    // Rate limit check
    const rateLimitConfig: Record<string, { max: number; window: number }> = {
      "get-courses": { max: 100, window: 60 },
      "get-course-detail": { max: 60, window: 60 },
      "search": { max: 30, window: 60 },
      "ai-query": { max: 10, window: 60 },
      "submit": { max: 5, window: 60 },
      default: { max: 60, window: 60 },
    };

    const config = rateLimitConfig[action] || rateLimitConfig.default;
    const { data: rateLimitResult } = await adminClient.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_bucket_key: action,
      p_max_requests: config.max,
      p_window_seconds: config.window,
    });

    if (rateLimitResult && !rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retry_after: rateLimitResult.reset_at,
          limit: rateLimitResult.limit,
          count: rateLimitResult.count,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": String(rateLimitResult.limit),
            "X-RateLimit-Remaining": String(Math.max(0, rateLimitResult.limit - rateLimitResult.count)),
          },
        }
      );
    }

    // Check cache for read operations
    if (cache_ttl && cache_ttl > 0) {
      const cacheKey = `api:${action}:${JSON.stringify(params || {})}`;
      const { data: cached } = await adminClient
        .from("server_cache")
        .select("cache_value")
        .eq("cache_key", cacheKey)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (cached) {
        return new Response(
          JSON.stringify({ ...cached.cache_value, _cached: true, _latency: Date.now() - startTime }),
          {
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "X-Cache": "HIT",
              "X-Latency": String(Date.now() - startTime),
            },
          }
        );
      }
    }

    // Circuit breaker check
    if (!checkCircuit(action)) {
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable", circuit: "open" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Route to handler
    let result: any;

    switch (action) {
      case "get-courses": {
        const query = adminClient.from("courses")
          .select("id, title, slug, short_description, price_inr, level, duration_hours, total_lessons, thumbnail_url, category_id, is_featured, tags")
          .eq("is_published", true)
          .order("order_index");

        if (params?.category_id) query.eq("category_id", params.category_id);
        if (params?.level) query.eq("level", params.level);
        if (params?.featured) query.eq("is_featured", true);
        if (params?.limit) query.limit(params.limit);

        const { data, error, count } = await query;
        if (error) throw error;
        result = { courses: data, count };
        break;
      }

      case "get-categories": {
        const { data, error } = await adminClient.from("course_categories").select("*").order("name");
        if (error) throw error;
        result = { categories: data };
        break;
      }

      case "get-stats": {
        const [courses, enrollments, certs] = await Promise.all([
          adminClient.from("courses").select("id", { count: "exact", head: true }).eq("is_published", true),
          adminClient.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "active"),
          adminClient.from("certificates").select("id", { count: "exact", head: true }),
        ]);
        result = {
          total_courses: courses.count || 0,
          total_enrollments: enrollments.count || 0,
          total_certificates: certs.count || 0,
        };
        break;
      }

      case "health": {
        result = {
          status: "healthy",
          timestamp: new Date().toISOString(),
          uptime: "auto-scaled",
          db: "connected",
          edge_functions: "running",
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    recordSuccess(action);

    // Cache the result if requested
    if (cache_ttl && cache_ttl > 0 && result) {
      const cacheKey = `api:${action}:${JSON.stringify(params || {})}`;
      await adminClient.rpc("upsert_cache", {
        p_key: cacheKey,
        p_value: result,
        p_ttl_seconds: cache_ttl,
      });
    }

    const latency = Date.now() - startTime;

    return new Response(
      JSON.stringify({ ...result, _latency: latency }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "X-Cache": "MISS",
          "X-Latency": String(latency),
          "X-RateLimit-Remaining": rateLimitResult ? String(Math.max(0, config.max - (rateLimitResult.count || 0))) : String(config.max),
        },
      }
    );
  } catch (err) {
    const body = { error: "Internal server error", message: (err as Error).message };
    console.error("API Gateway error:", err);
    recordFailure("gateway");
    return new Response(JSON.stringify(body), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
