import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Public signed URL mint endpoint for FREE PREVIEW lessons only.
 * - No auth required
 * - Returns a short-lived signed URL from the course-videos bucket
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type VideoRequest = {
  lessonId: string;
  videoPath: string;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { lessonId, videoPath }: VideoRequest = await req.json();
    if (!lessonId || !videoPath) {
      return new Response(JSON.stringify({ error: "Missing lessonId or videoPath" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only allow public URLs for FREE PREVIEW lessons.
    const { data: lesson, error: lessonError } = await supabaseClient
      .from("lessons")
      .select("id, is_free_preview")
      .eq("id", lessonId)
      .maybeSingle();

    if (lessonError || !lesson) {
      return new Response(JSON.stringify({ error: "Lesson not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lesson.is_free_preview) {
      return new Response(JSON.stringify({ error: "Not allowed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Signed URL (short-lived)
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient
      .storage
      .from("course-videos")
      .createSignedUrl(videoPath, 60 * 30); // 30 minutes

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Signed URL error:", signedUrlError);
      return new Response(JSON.stringify({ error: "Failed to generate video URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ signedUrl: signedUrlData.signedUrl }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("get-video-url-public error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate video URL" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
