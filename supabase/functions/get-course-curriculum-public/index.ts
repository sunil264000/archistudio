import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReqBody = {
  courseSlug: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { courseSlug } = (await req.json()) as ReqBody;
    if (!courseSlug) {
      return new Response(JSON.stringify({ error: "Missing courseSlug" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .maybeSingle();

    if (courseError || !course) {
      return new Response(JSON.stringify({ modules: [], totalLessons: 0, totalDuration: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: modulesData, error: modulesError } = await supabase
      .from("modules")
      .select("id, title, description, order_index")
      .eq("course_id", course.id)
      .order("order_index");

    if (modulesError || !modulesData?.length) {
      return new Response(JSON.stringify({ modules: [], totalLessons: 0, totalDuration: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const moduleIds = modulesData.map((m) => m.id);
    const { data: lessonsData } = await supabase
      .from("lessons")
      // IMPORTANT: do NOT return video_url in public curriculum.
      .select("id, title, description, duration_minutes, order_index, is_free_preview, module_id")
      .in("module_id", moduleIds)
      .order("order_index");

    const modules = modulesData.map((mod) => {
      const lessons = (lessonsData || [])
        .filter((l) => (l as any).module_id === mod.id)
        .map((l) => ({
          id: (l as any).id,
          title: (l as any).title,
          description: (l as any).description,
          duration_minutes: (l as any).duration_minutes,
          order_index: (l as any).order_index ?? 0,
          is_free_preview: (l as any).is_free_preview ?? false,
          video_url: null,
        }))
        .sort((a, b) => a.order_index - b.order_index);

      return {
        ...mod,
        order_index: (mod as any).order_index ?? 0,
        lessons,
      };
    });

    const allLessons = lessonsData || [];
    const totalLessons = allLessons.length;
    const totalDuration = allLessons.reduce(
      (sum, l) => sum + ((l as any).duration_minutes || 0),
      0,
    );

    return new Response(JSON.stringify({ modules, totalLessons, totalDuration }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("get-course-curriculum-public error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
