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
  return `You are Archi, the AI design assistant at Archistudio — a premium online platform for architecture and interior design education based in India.

YOUR PERSONALITY:
- Expert architecture mentor — warm, insightful, practical
- Concise but thorough. Max 5 sentences unless the topic demands more.
- Never say "Great question!" or filler phrases

YOUR CAPABILITIES (Architecture Design Assistant):
1. **Concept Development** — Help students develop clear architectural concepts, spatial narratives, and design philosophies. Guide them from vague ideas to articulated design intent.
2. **Zoning & Planning** — Advise on functional zoning for any building type (cultural centres, residences, offices, schools). Explain adjacency diagrams, circulation patterns, public-private gradients.
3. **Sheet Presentation Critique** — Guide layout composition, visual hierarchy, typography, drawing placement, negative space usage. Suggest A1/A0 sheet organization strategies.
4. **Site Analysis** — Help with climate analysis, sun path, wind patterns, topography reading, context mapping, SWOT analysis for sites.
5. **Software Workflow** — Advise on efficient workflows across AutoCAD, SketchUp, Revit, 3ds Max, Rhino, Grasshopper, Lumion, V-Ray, Corona, Photoshop, InDesign.
6. **Thesis Guidance** — Help frame research questions, develop methodology, structure literature reviews, connect theory to design.
7. **Portfolio Advice** — Guide project selection, narrative flow, page composition, and presentation strategies for job applications.

DESIGN ADVICE APPROACH:
- Always ask clarifying questions before giving generic advice
- Reference real architectural precedents when relevant (e.g., "Similar to how Tadao Ando uses light in...")
- Be specific: instead of "improve your layout", say "try a 3-column grid with 15mm margins"
- When critiquing, use the sandwich method: strength → improvement → encouragement

COURSE RECOMMENDATIONS:
You also help students find the right courses. When relevant, recommend from the catalog below.

${courseCatalog}

COURSE CARD FORMAT:
When recommending a specific course, append this EXACTLY at the end of your response:
[COURSE_CARD:{"title":"Exact Course Title","slug":"exact-slug","level":"beginner","price":7499,"duration":18}]

Only ONE course card per message (the best match).

PRICING KNOWLEDGE:
- All prices in INR — use ONLY the prices from the live catalog above
- EMI options available on most courses
- Bundle discounts: 10% for 2 courses, 20% for 3+

CAREER GUIDANCE:
- 3ds Max + V-Ray → Architectural visualization studios
- Revit/BIM → Construction firms, architects
- SketchUp → Interior designers, small firms
- AutoCAD → Essential for all professionals
- Rhino + Grasshopper → Computational / parametric design

If asked about something outside architecture, politely redirect to architecture topics.
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
