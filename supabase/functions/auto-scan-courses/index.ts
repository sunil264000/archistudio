import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Video file extensions to identify
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg', '.3gp'];
const VIDEO_MIMETYPES = ['video/mp4', 'video/avi', 'video/mkv', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/x-m4v', 'video/mpeg', 'video/3gpp'];

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
      console.log("Starting refresh-all scan...");
      
      // Get all lessons with Google Drive video URLs
      const { data: allLessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('id, video_url, duration_minutes')
        .like('video_url', '%drive.google.com%');
      
      if (lessonsError) throw lessonsError;

      let validLinks = 0;
      let brokenLinks = 0;
      let durationsUpdated = 0;

      // Check each video URL and update durations
      for (const lesson of allLessons || []) {
        if (lesson.video_url) {
          const fileId = extractFileId(lesson.video_url);
          if (fileId) {
            const result = await checkAndGetDuration(fileId, GOOGLE_API_KEY);
            if (result.valid) {
              validLinks++;
              // Update duration if it was 0 or different
              if (result.duration > 0 && lesson.duration_minutes !== result.duration) {
                await supabase.from('lessons').update({ 
                  duration_minutes: result.duration 
                }).eq('id', lesson.id);
                durationsUpdated++;
              }
            } else {
              brokenLinks++;
            }
          }
        }
      }

      console.log(`Refresh complete: ${validLinks} valid, ${brokenLinks} broken, ${durationsUpdated} durations updated`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Scanned ${allLessons?.length || 0} lessons`,
          validLinks,
          brokenLinks,
          durationsUpdated
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "scan-single" && courseId) {
      // Scan a single course's Google Drive folders
      const { data: modules } = await supabase
        .from('modules')
        .select('id, title')
        .eq('course_id', courseId);

      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, title, video_url, module_id, duration_minutes')
        .in('module_id', modules?.map(m => m.id) || []);

      let validLinks = 0;
      let brokenLinks = 0;
      let durationsUpdated = 0;
      
      for (const lesson of lessons || []) {
        if (lesson.video_url?.includes('drive.google.com')) {
          const fileId = extractFileId(lesson.video_url);
          if (fileId) {
            const result = await checkAndGetDuration(fileId, GOOGLE_API_KEY);
            if (result.valid) {
              validLinks++;
              if (result.duration > 0 && lesson.duration_minutes !== result.duration) {
                await supabase.from('lessons').update({ 
                  duration_minutes: result.duration 
                }).eq('id', lesson.id);
                durationsUpdated++;
              }
            } else {
              brokenLinks++;
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          courseId,
          validLinks,
          brokenLinks,
          durationsUpdated,
          totalLessons: lessons?.length || 0
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
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?key=${apiKey}&fields=id,name,videoMediaMetadata`;
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
