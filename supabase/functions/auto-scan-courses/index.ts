import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BATCH_SIZE = 20; // Process 20 lessons concurrently for speed

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, courseId } = await req.json();

    if (action === "refresh-all") {
      console.log("Starting optimized refresh-all scan...");
      
      // Get all lessons with Google Drive video URLs
      const { data: allLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, video_url, duration_minutes, module_id')
        .like('video_url', '%drive.google.com%');
      
      if (lessonsError) throw lessonsError;

      let validLinks = 0;
      let brokenLinks = 0;
      let durationsUpdated = 0;

      // Process in batches for speed
      const lessons = allLessons || [];
      for (let i = 0; i < lessons.length; i += BATCH_SIZE) {
        const batch = lessons.slice(i, i + BATCH_SIZE);
        
        const results = await Promise.all(
          batch.map(async (lesson) => {
            if (!lesson.video_url) return { lesson, valid: false, duration: 0 };
            const fileId = extractFileId(lesson.video_url);
            if (!fileId) return { lesson, valid: false, duration: 0 };
            
            const result = await checkAndGetDuration(fileId, GOOGLE_API_KEY);
            return { lesson, ...result };
          })
        );

        // Batch update durations
        const updates = results
          .filter(r => r.valid && r.duration > 0 && r.lesson.duration_minutes !== r.duration)
          .map(r => ({ id: r.lesson.id, duration_minutes: r.duration }));

        if (updates.length > 0) {
          // Use parallel updates for speed
          await Promise.all(
            updates.map(u => 
              supabase.from('lessons').update({ duration_minutes: u.duration_minutes }).eq('id', u.id)
            )
          );
          durationsUpdated += updates.length;
        }

        validLinks += results.filter(r => r.valid).length;
        brokenLinks += results.filter(r => !r.valid).length;
      }

      // Update course-level statistics for ALL courses (optimized)
      const coursesUpdated = await updateAllCourseStatsOptimized(supabase);

      console.log(`Refresh complete: ${validLinks} valid, ${brokenLinks} broken, ${durationsUpdated} durations, ${coursesUpdated} courses updated`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Scanned ${lessons.length} lessons across all courses`,
          validLinks,
          brokenLinks,
          durationsUpdated,
          coursesUpdated
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "scan-single" && courseId) {
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', courseId);

      const moduleIds = modules?.map(m => m.id) || [];
      if (moduleIds.length === 0) {
        return new Response(
          JSON.stringify({ success: true, courseId, validLinks: 0, brokenLinks: 0, durationsUpdated: 0, totalLessons: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, video_url, duration_minutes')
        .in('module_id', moduleIds);

      let validLinks = 0;
      let brokenLinks = 0;
      let durationsUpdated = 0;
      
      // Process in parallel batches
      const lessonsList = lessons || [];
      for (let i = 0; i < lessonsList.length; i += BATCH_SIZE) {
        const batch = lessonsList.slice(i, i + BATCH_SIZE);
        
        const results = await Promise.all(
          batch.map(async (lesson) => {
            if (!lesson.video_url?.includes('drive.google.com')) return { lesson, valid: false, duration: 0 };
            const fileId = extractFileId(lesson.video_url);
            if (!fileId) return { lesson, valid: false, duration: 0 };
            
            const result = await checkAndGetDuration(fileId, Deno.env.get("GOOGLE_API_KEY")!);
            return { lesson, ...result };
          })
        );

        const updates = results.filter(r => r.valid && r.duration > 0 && r.lesson.duration_minutes !== r.duration);
        
        await Promise.all(
          updates.map(u => 
            supabase.from('lessons').update({ duration_minutes: u.duration }).eq('id', u.lesson.id)
          )
        );
        
        durationsUpdated += updates.length;
        validLinks += results.filter(r => r.valid).length;
        brokenLinks += results.filter(r => !r.valid).length;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          courseId,
          validLinks,
          brokenLinks,
          durationsUpdated,
          totalLessons: lessonsList.length
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function extractFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function checkAndGetDuration(fileId: string, apiKey: string): Promise<{ valid: boolean; duration: number }> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?key=${apiKey}&fields=id,videoMediaMetadata`;
    const response = await fetch(url);
    
    if (!response.ok) {
      return { valid: false, duration: 0 };
    }
    
    const data = await response.json();
    let duration = 0;
    
    if (data.videoMediaMetadata?.durationMillis) {
      duration = Math.ceil(parseInt(data.videoMediaMetadata.durationMillis) / 60000);
    }
    
    return { valid: true, duration };
  } catch {
    return { valid: false, duration: 0 };
  }
}

// Optimized: Single query to get all data, then batch update
async function updateAllCourseStatsOptimized(supabase: any): Promise<number> {
  // Get all courses with their modules and lessons in fewer queries
  const { data: courses } = await supabase.from('courses').select('id');
  const { data: allModules } = await supabase.from('modules').select('id, course_id');
  const { data: allLessons } = await supabase.from('lessons').select('id, module_id, duration_minutes');

  // Build lookup maps for O(1) access
  const modulesByCourse = new Map<string, string[]>();
  for (const m of allModules || []) {
    if (!modulesByCourse.has(m.course_id)) modulesByCourse.set(m.course_id, []);
    modulesByCourse.get(m.course_id)!.push(m.id);
  }

  const lessonsByModule = new Map<string, { id: string; duration_minutes: number }[]>();
  for (const l of allLessons || []) {
    if (!lessonsByModule.has(l.module_id)) lessonsByModule.set(l.module_id, []);
    lessonsByModule.get(l.module_id)!.push(l);
  }

  // Calculate stats for each course
  const updates: { id: string; total_lessons: number; duration_hours: number | null }[] = [];
  
  for (const course of courses || []) {
    const moduleIds = modulesByCourse.get(course.id) || [];
    let totalLessons = 0;
    let totalMinutes = 0;

    for (const moduleId of moduleIds) {
      const lessons = lessonsByModule.get(moduleId) || [];
      totalLessons += lessons.length;
      totalMinutes += lessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0);
    }

    const durationHours = Math.round(totalMinutes / 60 * 10) / 10;
    updates.push({
      id: course.id,
      total_lessons: totalLessons,
      duration_hours: durationHours > 0 ? durationHours : null
    });
  }

  // Batch update all courses in parallel (chunks of 20)
  let coursesUpdated = 0;
  for (let i = 0; i < updates.length; i += 20) {
    const batch = updates.slice(i, i + 20);
    const results = await Promise.all(
      batch.map(u => 
        supabase.from('courses').update({ 
          total_lessons: u.total_lessons, 
          duration_hours: u.duration_hours 
        }).eq('id', u.id)
      )
    );
    coursesUpdated += results.filter(r => !r.error).length;
  }

  return coursesUpdated;
}
