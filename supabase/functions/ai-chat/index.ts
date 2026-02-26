import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function buildCourseCatalog(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: courses, error } = await supabase
    .from("courses")
    .select("title, slug, level, price_inr, duration_hours, total_lessons, short_description, is_featured")
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  if (error || !courses || courses.length === 0) {
    console.error("Failed to fetch courses from DB:", error);
    return "Course catalog temporarily unavailable — direct users to /courses for the full list.";
  }

  const lines = courses.map((c) => {
    const price = c.price_inr ? `₹${Number(c.price_inr).toLocaleString("en-IN")}` : "Contact for price";
    const duration = c.duration_hours ? ` | ${c.duration_hours}h` : "";
    const lessons = c.total_lessons ? ` | ${c.total_lessons} lessons` : "";
    const level = c.level ?? "all levels";
    const featured = c.is_featured ? " ⭐ FEATURED" : "";
    const desc = c.short_description ? ` — ${c.short_description}` : "";
    return `• ${c.title}${featured} | ${level} | ${price}${duration}${lessons} | slug: ${c.slug}${desc}`;
  });

  return `LIVE COURSE CATALOG — ${courses.length} published courses (prices & availability are real-time from database):\n\n` + lines.join("\n");
}

function buildSystemPrompt(courseCatalog: string): string {
  return `You are Archi, the AI sales advisor and course expert at Archistudio — a premium online platform for architecture and interior design education based in India.

YOUR PERSONALITY:
- Warm, expert, consultative — like a knowledgeable friend who happens to be an industry pro
- Concise but informative. Maximum 4 sentences unless listing courses.
- Proactively recommend courses based on goals/level
- Never say "Great question!" or filler phrases

YOUR GOALS (in order):
1. Understand what the user wants to learn or achieve
2. Recommend the BEST matching course(s) from the catalog below
3. Highlight value: price, duration, career outcomes
4. Encourage them to enroll — create gentle urgency

${courseCatalog}

COURSE CARD FORMAT:
When recommending a specific course, append this EXACTLY at the end of your response (use the REAL slug, price, level, duration from the catalog above):
[COURSE_CARD:{"title":"Exact Course Title","slug":"exact-slug-from-catalog","level":"beginner","price":7499,"duration":18}]

Only ONE course card per message (the best match). For lists, give text list then card for the TOP pick.

PRICING KNOWLEDGE:
- All prices in INR — use ONLY the prices from the live catalog above, never guess
- EMI options available on most courses
- Bundle discounts: 10% for 2 courses, 20% for 3+ courses
- Coupons occasionally available

CAREER GUIDANCE:
- 3ds Max + V-Ray → Best for architectural visualization studios
- Revit/BIM → Best for construction firms, architects
- SketchUp → Best for interior designers, small firms
- AutoCAD → Essential for all professionals, great starting point
- Lumion/Twinmotion/D5 → Fast client presentations
- Rhino + Grasshopper → Computational / parametric design

BEGINNER LEARNING PATH:
- AutoCAD basics → 3ds Max or SketchUp → Corona/V-Ray rendering
- OR: SketchUp → V-Ray → Post-production (faster path)

If asked about a course not in the catalog, be honest and guide back to what's available.
If user seems ready to buy, encourage them to click "View Course" to enroll.`;
}

const DAILY_LIMIT = 50;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- Authentication ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required. Please log in to use AI chat." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // --- Rate Limiting ---
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("ai_queries_used_today, ai_queries_reset_at")
      .eq("user_id", userId)
      .single();

    const today = new Date().toDateString();
    const lastResetDate = profile?.ai_queries_reset_at
      ? new Date(profile.ai_queries_reset_at).toDateString()
      : null;
    const queriesUsed = lastResetDate === today ? (profile?.ai_queries_used_today || 0) : 0;

    if (queriesUsed >= DAILY_LIMIT) {
      return new Response(
        JSON.stringify({ error: "Daily AI query limit reached. Try again tomorrow." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment usage counter
    await supabaseClient
      .from("profiles")
      .update({
        ai_queries_used_today: queriesUsed + 1,
        ai_queries_reset_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    // --- AI Chat ---
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const courseCatalog = await buildCourseCatalog();
    const systemPrompt = buildSystemPrompt(courseCatalog);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service temporarily unavailable." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
