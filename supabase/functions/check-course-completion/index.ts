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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userId, courseId } = await req.json();

    if (!userId || !courseId) {
      return new Response(
        JSON.stringify({ error: "Missing userId or courseId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if already has certificate
    const { data: existingCert } = await supabase
      .from("certificates")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();

    if (existingCert) {
      return new Response(
        JSON.stringify({ completed: true, certificate: existingCert, alreadyIssued: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all lessons for this course
    const { data: modules } = await supabase
      .from("modules")
      .select("id")
      .eq("course_id", courseId);

    if (!modules || modules.length === 0) {
      return new Response(
        JSON.stringify({ completed: false, message: "No modules found for this course" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const moduleIds = modules.map(m => m.id);
    
    const { data: lessons } = await supabase
      .from("lessons")
      .select("id")
      .in("module_id", moduleIds);

    if (!lessons || lessons.length === 0) {
      return new Response(
        JSON.stringify({ completed: false, message: "No lessons found for this course" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lessonIds = lessons.map(l => l.id);
    const totalLessons = lessonIds.length;

    // Get completed lessons
    const { data: progress } = await supabase
      .from("progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .eq("completed", true)
      .in("lesson_id", lessonIds);

    const completedLessons = progress?.length || 0;

    if (completedLessons < totalLessons) {
      return new Response(
        JSON.stringify({
          completed: false,
          progress: Math.round((completedLessons / totalLessons) * 100),
          completedLessons,
          totalLessons,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // User has completed all lessons - issue certificate!
    const certificateNumber = `CL${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const { data: newCert, error: certError } = await supabase
      .from("certificates")
      .insert({
        user_id: userId,
        course_id: courseId,
        certificate_number: certificateNumber,
      })
      .select()
      .single();

    if (certError) {
      console.error("Error creating certificate:", certError);
      return new Response(
        JSON.stringify({ error: "Failed to issue certificate" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create notification for user
    await supabase.from("notifications").insert({
      user_id: userId,
      title: "🎉 Certificate Earned!",
      message: "Congratulations! You've completed the course and earned your certificate.",
      type: "achievement",
      action_url: "/dashboard",
    });

    return new Response(
      JSON.stringify({
        completed: true,
        certificate: newCert,
        alreadyIssued: false,
        message: "Certificate issued successfully!",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Course completion check error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to check course completion" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
