import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { courseId, action } = await req.json();

    if (action === "translate-lessons") {
      // Fetch lessons for the course
      let query = supabase.from("lessons").select("id, title, description");
      if (courseId !== "all") {
        const { data: modules } = await supabase.from("modules").select("id").eq("course_id", courseId);
        const moduleIds = modules?.map(m => m.id) || [];
        query = query.in("module_id", moduleIds);
      }

      const { data: lessons, error } = await query;
      if (error) throw error;

      console.log(`Found ${lessons?.length} lessons to check for translation.`);

      for (const lesson of (lessons || [])) {
        // Simple check if translation is needed: contains non-ASCII or specific keywords
        const needsTranslation = /[^\x00-\x7F]/.test(lesson.title);
        
        if (needsTranslation) {
          console.log(`Translating lesson: ${lesson.title}`);
          const translation = await translateText(lesson.title, lesson.description || "", LOVABLE_API_KEY!);
          
          await supabase.from("lessons").update({
            title: translation.title,
            description: translation.description
          }).eq("id", lesson.id);
        }
      }

      return new Response(JSON.stringify({ success: true, message: "Translation completed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400 });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});

async function translateText(title: string, description: string, apiKey: string) {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-pro",
      messages: [
        {
          role: "system",
          content: "You are a translation expert. Translate the following architectural lesson title and description to clear, professional English. Return ONLY a JSON object with 'title' and 'description' fields."
        },
        {
          role: "user",
          content: `Title: ${title}\nDescription: ${description}`
        }
      ],
      response_format: { type: "json_object" }
    }),
  });

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);
  return content;
}
