import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  "sheet-critique": `You are an expert architecture sheet presentation critic at Archistudio.

Analyze the uploaded architectural design sheet and provide detailed feedback on:

1. **Visual Hierarchy** — Is there a clear reading order? Do titles, subtitles, and drawings guide the eye?
2. **Layout Composition** — Grid usage, margins, spacing between elements, balance of positive/negative space
3. **Drawing Quality** — Line weights, hatching, rendering quality, scale consistency
4. **Typography** — Font choices, sizes, consistency, readability
5. **Color Usage** — Palette coherence, contrast, mood alignment with the project
6. **Storytelling** — Does the sheet tell a clear design narrative? Is the concept communicated?
7. **Technical Accuracy** — Scale bars, north arrows, labels, annotations

Format your response as:
## Overall Score: X/10

### Strengths
- ...

### Areas for Improvement
- ...

### Specific Recommendations
1. ...

Be specific with measurements and actionable suggestions.`,

  "concept-generator": `You are an architectural concept development mentor at Archistudio.

When given a building type or design brief, generate:

1. **Concept Statement** — A clear 2-3 sentence design philosophy
2. **Zoning Strategy** — Functional zones, adjacency relationships, circulation logic
3. **Key Design Principles** — 3-5 principles that drive the design
4. **Spatial Sequences** — Entry experience, transitions, key moments
5. **Precedent References** — 3-4 real architectural projects that relate (with architect names)
6. **Material Palette Suggestion** — Materials that reinforce the concept
7. **Sustainability Considerations** — Climate-responsive strategies

Be specific to architecture. Reference real buildings, architects, and design theories.`,

  "portfolio-review": `You are a portfolio review expert at Archistudio, experienced in architecture hiring.

Analyze the portfolio description and provide feedback on:

1. **Project Selection** — Are the right projects included? Variety vs. depth?
2. **Narrative Flow** — Does the portfolio tell a story about the designer's growth?
3. **Presentation Quality** — Layout, typography, visual consistency
4. **Technical Depth** — Are process diagrams, details, and technical drawings included?
5. **Missing Elements** — What's commonly expected but missing?
6. **Target Audience Fit** — Is it tailored for the intended employer/school?

Provide:
## Portfolio Score: X/10

### What Works Well
- ...

### Critical Improvements
1. ...

### Recommended Portfolio Structure
- Page-by-page suggestion

Be direct and actionable. Architecture firms review hundreds of portfolios.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
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

    // Rate limiting - check user_rate_limits
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];
    const { data: rateLimit } = await adminClient
      .from("user_rate_limits")
      .select("*")
      .eq("user_id", userId)
      .eq("action_type", "ai_mentor")
      .single();

    const windowStart = rateLimit?.window_start ? new Date(rateLimit.window_start).toISOString().split("T")[0] : null;
    const currentCount = windowStart === today ? (rateLimit?.count || 0) : 0;

    if (currentCount >= 20) {
      return new Response(
        JSON.stringify({ error: "Daily AI mentor limit reached (20/day). Try again tomorrow." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update rate limit
    await adminClient.from("user_rate_limits").upsert({
      user_id: userId,
      action_type: "ai_mentor",
      count: currentCount + 1,
      window_start: new Date().toISOString(),
    }, { onConflict: "user_id,action_type" });

    const { mode, messages, courseContext, currentPage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS["concept-generator"];
    let contextualSystemPrompt = systemPrompt;

    // Add course awareness
    if (courseContext) {
      const { data: course } = await adminClient
        .from("courses")
        .select("title, level")
        .eq("slug", courseContext)
        .single();
      
      if (course) {
        contextualSystemPrompt += `\n\nCONTEXT: The student is currently studying "${course.title}" (${course.level} level). Tailor your architectural advice to be consistent with this course's focus. If they ask "Which course am I viewing?", answer correctly based on this title.`;
      }
    }

    if (currentPage) {
      contextualSystemPrompt += `\n\nPAGE CONTEXT: The student is on the page: ${currentPage}`;
    }

    const fullMessages = [
      { role: "system", content: contextualSystemPrompt },
      ...messages,
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: fullMessages,
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
    console.error("AI design mentor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
