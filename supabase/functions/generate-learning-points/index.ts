import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Payload {
  courseId?: string | null;
  courseTitle?: string;
  modules?: { title?: string; lessons?: string[] }[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { courseId, courseTitle, modules = [] } = (await req.json()) as Payload;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    let resolvedTitle = courseTitle || "Architecture Course";
    let moduleData = modules;

    if (courseId && moduleData.length === 0) {
      const { data: course } = await supabase
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .maybeSingle();

      if (course?.title) resolvedTitle = course.title;

      const { data: dbModules } = await supabase
        .from("modules")
        .select("id, title")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true })
        .limit(12);

      if (dbModules?.length) {
        const lessonRows = await Promise.all(
          dbModules.map(async (m) => {
            const { data: lessons } = await supabase
              .from("lessons")
              .select("title")
              .eq("module_id", m.id)
              .order("order_index", { ascending: true })
              .limit(20);

            return {
              title: m.title,
              lessons: (lessons || []).map((l) => l.title),
            };
          })
        );

        moduleData = lessonRows;
      }
    }

    const flatLessons = moduleData
      .flatMap((m) => m.lessons || [])
      .filter((x) => typeof x === "string" && x.trim().length > 0)
      .slice(0, 40);

    if (!LOVABLE_API_KEY) {
      const fallback = flatLessons.slice(0, 8).map((l) => `Hands-on mastery of ${l}`);
      return new Response(JSON.stringify({ points: fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are an expert curriculum designer for architecture and design education.\nCourse: ${resolvedTitle}\nModules: ${JSON.stringify(moduleData)}\nLessons: ${JSON.stringify(flatLessons)}\n\nReturn ONLY valid JSON in this exact shape: {"points":["...", "...", "...", "...", "...", "...", "...", "..."]}\nRules:\n- Exactly 8 points\n- Each point max 12 words\n- Practical, outcome-focused, specific to this course content\n- No generic phrases like 'industry standard' unless concrete\n- Do not repeat module names verbatim`; 

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You output strict JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate learning points");
    }

    const result = await response.json();
    const content = result?.choices?.[0]?.message?.content || "{}";

    let parsed: { points?: string[] } = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      const fallback = flatLessons.slice(0, 8).map((l) => `Hands-on mastery of ${l}`);
      parsed = { points: fallback };
    }

    const points = (parsed.points || [])
      .filter((p) => typeof p === "string" && p.trim().length > 0)
      .slice(0, 8);

    return new Response(JSON.stringify({ points }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-learning-points error", error);
    return new Response(JSON.stringify({ points: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
