import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { courseId, imageUrl } = await req.json();

    if (!courseId || !imageUrl) {
      return new Response(
        JSON.stringify({ error: "courseId and imageUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get course to check if it has an existing thumbnail in storage
    const { data: course, error: courseError } = await supabase
      .from("courses")
      .select("slug, thumbnail_url")
      .eq("id", courseId)
      .single();

    if (courseError) {
      throw new Error(`Course not found: ${courseError.message}`);
    }

    // Delete old thumbnail from storage if it exists
    if (course.thumbnail_url && course.thumbnail_url.includes("/storage/v1/object/public/course-thumbnails/")) {
      const oldPath = course.thumbnail_url.split("/course-thumbnails/")[1]?.split("?")[0];
      if (oldPath) {
        await supabase.storage.from("course-thumbnails").remove([oldPath]);
        console.log(`Deleted old thumbnail: ${oldPath}`);
      }
    }

    // Download the image from external URL
    console.log(`Downloading image from: ${imageUrl}`);
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.status}`);
    }

    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await imageResponse.arrayBuffer();

    // Determine file extension
    let ext = "jpg";
    if (contentType.includes("png")) ext = "png";
    else if (contentType.includes("webp")) ext = "webp";
    else if (contentType.includes("gif")) ext = "gif";

    // Generate unique filename
    const filename = `${course.slug}-${Date.now()}.${ext}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("course-thumbnails")
      .upload(filename, imageBuffer, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("course-thumbnails")
      .getPublicUrl(filename);

    const publicUrl = urlData.publicUrl;

    // Update course with new thumbnail URL
    const { error: updateError } = await supabase
      .from("courses")
      .update({ 
        thumbnail_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq("id", courseId);

    if (updateError) {
      throw new Error(`Failed to update course: ${updateError.message}`);
    }

    console.log(`Successfully uploaded thumbnail for ${course.slug}: ${publicUrl}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        thumbnailUrl: publicUrl,
        message: "Thumbnail uploaded and saved permanently"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errMessage);
    return new Response(
      JSON.stringify({ error: errMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
