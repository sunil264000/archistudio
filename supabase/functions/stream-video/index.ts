import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Secure Video Streaming Proxy
 * 
 * This function streams video content directly without exposing the source URL.
 * It serves video as chunked transfer, making it harder for download managers
 * to capture the full file URL.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, range",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get parameters from URL
    const url = new URL(req.url);
    const token = url.searchParams.get("t");
    const lessonId = url.searchParams.get("l");
    const videoPath = url.searchParams.get("p");
    const timestamp = url.searchParams.get("ts");

    // Validate timestamp (URL expires after 30 minutes)
    if (timestamp) {
      const urlTime = parseInt(timestamp, 10);
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000;
      
      if (now - urlTime > thirtyMinutes) {
        return new Response(
          JSON.stringify({ error: "URL expired" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!token || !lessonId || !videoPath) {
      return new Response(
        JSON.stringify({ error: "Missing parameters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      const { data: lesson } = await supabaseClient
        .from("lessons")
        .select(`id, modules!inner (course_id)`)
        .eq("id", lessonId)
        .single();

      if (!lesson) {
        return new Response(
          JSON.stringify({ error: "Lesson not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const courseId = (lesson.modules as any).course_id;

      const { data: enrollment } = await supabaseClient
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .eq("status", "active")
        .maybeSingle();

      if (!enrollment) {
        return new Response(
          JSON.stringify({ error: "Not enrolled" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get the video from storage
    const { data: fileData, error: fileError } = await supabaseClient
      .storage
      .from("course-videos")
      .download(videoPath);

    if (fileError || !fileData) {
      console.error("File download error:", fileError);
      return new Response(
        JSON.stringify({ error: "Video not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get file size for range requests
    const fileSize = fileData.size;
    const rangeHeader = req.headers.get("range");

    // Handle range requests for seeking
    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunkSize = end - start + 1;

      const buffer = await fileData.arrayBuffer();
      const chunk = buffer.slice(start, end + 1);

      return new Response(chunk, {
        status: 206,
        headers: {
          ...corsHeaders,
          "Content-Type": "video/mp4",
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        },
      });
    }

    // Full file response with anti-cache headers
    return new Response(fileData, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "video/mp4",
        "Content-Length": fileSize.toString(),
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      },
    });
  } catch (error: any) {
    console.error("Stream error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
