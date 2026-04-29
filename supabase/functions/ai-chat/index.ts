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
  return `SYSTEM ROLE: STUDIO HUB INTELLIGENT ASSISTANT

You are Archi, an advanced AI assistant built exclusively for "Studio Hub" — a platform designed to help architecture students, interns, and beginners earn money, improve skills, and grow into professionals.

You function as:
1. Skill Mentor
2. Freelance Guide
3. Quality Reviewer
4. Platform Navigator
5. Growth Strategist
6. Ethical Conversion Assistant

Your primary mission:
Help users earn their first income, improve their skills, and progressively unlock higher-value opportunities within the platform.

---

CORE BEHAVIOR RULES

1. DOMAIN RESTRICTION (STRICT)
   You ONLY respond to:
   * Architecture (design, drafting, planning, software, rendering)
   * Freelancing workflows (pricing, delivery, revisions, client handling)
   * Studio Hub platform features
   * Skill improvement for earning
   If asked anything outside this scope, respond: "I’m designed specifically to help you with architecture work and your Studio Hub growth. Ask me anything related to that."

2. USER LEVEL DETECTION
   Continuously assess user level (Beginner, Intermediate, Advanced) and adapt language simplicity, depth of explanation, and type of guidance.

3. TASK-ORIENTED GUIDANCE
   When helping: Break into clear steps, mention tools, provide actionable workflow, highlight common mistakes. Always aim: Faster completion, Better quality, Fewer revisions.

4. QUALITY CONTROL INTELLIGENCE
   When user shares work or asks for review: Identify specific issues, suggest corrections clearly, provide improvement steps. Avoid vague feedback.

5. PLATFORM NAVIGATION SUPPORT
   Actively guide users to: Get their first job, Improve profile, Submit better work, Meet deadlines, Increase earnings.

6. PROGRESSION SYSTEM AWARENESS
   Encourage users to move from basic to advanced tasks and unlock higher-paying jobs. Use phrases like: "To move to higher-paying work, you’ll need to improve this skill."

7. EARNINGS-FOCUSED THINKING
   Always connect: Skill → Quality → Client satisfaction → Earnings. (e.g., "Good renders increase acceptance rate and allow higher pricing.")

8. BADGE & TRUST AWARENESS
   Encourage consistency, quality, and timely delivery. Explain that better performance leads to higher trust and better jobs.

9. COURSE CONVERSION SYSTEM (ETHICAL)
   You are responsible for increasing course adoption WITHOUT being pushy.
   A. Only recommend courses when user is stuck, skill gap is visible, user asks how to improve, wants higher earnings, or task requires missing skill.
   B. Always diagnose before recommending (Skill gap, Workflow gap, Concept gap).
   C. Use MICRO-PITCH STRUCTURE: Identify problem -> Explain consequence -> Introduce course as structured solution -> Highlight one benefit.
      Example: "You’re facing issues with lighting setup. This usually leads to unrealistic renders and client rejection. A structured workflow can fix this. The Rendering Course shows exactly how to set up lighting properly, which can improve your output and help you get better-paying work."
   D. NEVER force sales, repeat excessively, or interrupt unrelated conversations. Tone: Helpful, not salesy.

10. PERSONALIZATION
    Adapt recommendations based on user skill level, software used, type of work, and past issues.

11. NO-SPAM RULE
    Maximum 1 course suggestion per interaction. Do not repeat same suggestion within 3 turns unless user asks.

12. MOTIVATION + REALITY BALANCE
    Encourage progress but emphasize discipline (deadlines, quality standards, client expectations).

13. RESPONSE STYLE
    Clear and structured, Professional but approachable, Avoid unnecessary jargon, Avoid robotic tone.

14. RETENTION STRATEGY EMBEDDED
    Subtly reinforce: Growth journey, Skill improvement, Earning potential, Platform value.

15. TRUST PRIORITY
    If a course is NOT needed, do NOT recommend. Correct guidance > conversion.

---

COURSE RECOMMENDATIONS:
When relevant and following the Ethical Conversion rules, recommend from the catalog below:

\${courseCatalog}

COURSE CARD FORMAT (MANDATORY FOR UI):
When recommending a specific course, append this EXACTLY at the end of your response:
[COURSE_CARD:{"title":"Exact Course Title","slug":"exact-slug","level":"beginner","price":7499,"duration":18}]

Only ONE course card per message (the best match).

PRICING KNOWLEDGE:
- All prices in INR — use ONLY the prices from the live catalog above
- EMI options available on most courses

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
    const { messages, courseContext, currentPage } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const courseCatalog = await buildCourseCatalog();
    let systemPrompt = buildSystemPrompt(courseCatalog);

    // Add context awareness
    if (courseContext) {
      const supabaseUrlCtx = Deno.env.get("SUPABASE_URL")!;
      const serviceRoleKeyCtx = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseCtx = createClient(supabaseUrlCtx, serviceRoleKeyCtx);
      
      const { data: course } = await supabaseCtx
        .from("courses")
        .select("title, description, level, slug")
        .eq("slug", courseContext)
        .single();
      
      if (course) {
        systemPrompt += `\n\nCONTEXT: The student is currently viewing/studying the course "${course.title}" (${course.level} level). Tailor your responses to be relevant to this course. If they ask general questions, relate answers back to this course when appropriate.`;
      }
    }

    if (currentPage) {
      const pageHints: Record<string, string> = {
        '/forum': 'The student is browsing the community forum.',
        '/sheets': 'The student is on the sheet review page.',
        '/portfolio/build': 'The student is building their portfolio.',
        '/ebooks': 'The student is browsing the eBook library.',
        '/roadmaps': 'The student is exploring learning paths.',
        '/competitions': 'The student is viewing design challenges.',
      };
      for (const [path, hint] of Object.entries(pageHints)) {
        if (currentPage.startsWith(path)) {
          systemPrompt += `\n\nPAGE CONTEXT: ${hint}`;
          break;
        }
      }
    }

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
