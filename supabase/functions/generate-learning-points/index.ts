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


const ACTION_VERBS = ['Master', 'Build', 'Apply', 'Create', 'Design', 'Develop', 'Implement', 'Understand'];

function generateFallbackPoints(courseTitle: string, moduleData: { title?: string; lessons?: string[] }[]): string[] {
  const points: string[] = [];
  const seen = new Set<string>();

  for (const module of moduleData) {
    for (const lesson of module.lessons || []) {
      const cleaned = lesson.replace(/^[\d\s._-]+/, '').trim();
      if (cleaned.length < 6 || seen.has(cleaned.toLowerCase())) continue;
      seen.add(cleaned.toLowerCase());
      const verb = ACTION_VERBS[points.length % ACTION_VERBS.length];
      points.push(`${verb} ${cleaned.charAt(0).toLowerCase() + cleaned.slice(1)}`);
      if (points.length >= 8) break;
    }
    if (points.length >= 8) break;
  }

  if (points.length < 4) {
    const titleLower = courseTitle.toLowerCase();
    if (titleLower.includes('autocad')) {
      points.push('Create precise 2D technical drawings to professional standards');
      points.push('Organize drawing files with correct layers and line weights');
    } else if (titleLower.includes('revit') || titleLower.includes('bim')) {
      points.push('Build complete BIM models with accurate families and views');
      points.push('Produce coordinated construction documents from a Revit model');
    } else if (titleLower.includes('3ds') || titleLower.includes('max')) {
      points.push('Model and texture architectural scenes in 3ds Max');
      points.push('Render photorealistic images using V-Ray lighting setups');
    } else if (titleLower.includes('sketchup')) {
      points.push('Model interior and exterior spaces quickly in SketchUp');
      points.push('Prepare clean presentation scenes for client communication');
    } else {
      points.push(`Apply core skills from ${courseTitle} to real projects`);
      points.push('Develop professional workflows used in architecture studios');
    }
  }

  return points.slice(0, 8);
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
      const fallback = generateFallbackPoints(resolvedTitle, moduleData);
      return new Response(JSON.stringify({ points: fallback }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const moduleList = moduleData
      .map((m) => `[${m.title}]: ${(m.lessons || []).slice(0, 10).join(', ')}`)
      .join('\n');

    const prompt = `You are an expert curriculum designer for architecture and design education.
Course Title: "${resolvedTitle}"

Course Modules and Lessons:
${moduleList}

Task: Write exactly 8 concise, specific learning outcomes for this course.
Each outcome must:
- Start with a strong action verb (e.g. Build, Create, Apply, Master, Design, Set up, Produce, Understand)
- Be specific to the actual content — mention real tools, techniques, or concepts from the lesson names
- Be 8–14 words max
- Sound like a genuine skill a student will walk away with
- NOT say "Hands-on mastery of" or just repeat the lesson name

Examples of GOOD outcomes:
- "Set up professional V-Ray lighting rigs for architectural interiors"
- "Create accurate construction drawings using AutoCAD layer standards"
- "Apply BIM workflows to coordinate structural and MEP systems"

Return ONLY valid JSON in this exact format: {"points":["...","...","...","...","...","...","...","..."]}`;

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
      const fallback = generateFallbackPoints(resolvedTitle, moduleData);
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
