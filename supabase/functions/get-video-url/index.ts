import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VideoRequest {
  lessonId: string;
  videoPath: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { lessonId, videoPath }: VideoRequest = await req.json();

    if (!lessonId || !videoPath) {
      throw new Error("Missing lessonId or videoPath");
    }

    // Check if user is admin
    const { data: adminRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!adminRole;

    // If not admin, verify enrollment
    if (!isAdmin) {
      // Get the lesson and its course
      const { data: lesson, error: lessonError } = await supabaseClient
        .from("lessons")
        .select(`
          id,
          modules!inner (
            course_id
          )
        `)
        .eq("id", lessonId)
        .single();

      if (lessonError || !lesson) {
        throw new Error("Lesson not found");
      }

      const courseId = (lesson.modules as any).course_id;

      // Check enrollment
      const { data: enrollment, error: enrollmentError } = await supabaseClient
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .eq("status", "active")
        .maybeSingle();

      if (enrollmentError || !enrollment) {
        throw new Error("Not enrolled in this course");
      }
    }

    // Generate signed URL (expires in 2 hours)
    const { data: signedUrlData, error: signedUrlError } = await supabaseClient
      .storage
      .from("course-videos")
      .createSignedUrl(videoPath, 7200); // 2 hours

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Signed URL error:", signedUrlError);
      throw new Error("Failed to generate video URL");
    }

    return new Response(
      JSON.stringify({ signedUrl: signedUrlData.signedUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === "Unauthorized" || error.message === "Not enrolled in this course" ? 403 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
