import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  parents?: string[];
}

interface DriveListResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

// Video file extensions to identify
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg', '.3gp'];
const VIDEO_MIMETYPES = ['video/mp4', 'video/avi', 'video/mkv', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/x-m4v', 'video/mpeg', 'video/3gpp'];

function isVideoFile(file: DriveFile): boolean {
  // Check by mimeType
  if (file.mimeType.startsWith("video/") || VIDEO_MIMETYPES.includes(file.mimeType)) {
    return true;
  }
  // Check by extension
  const lowerName = file.name.toLowerCase();
  return VIDEO_EXTENSIONS.some(ext => lowerName.endsWith(ext));
}

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
      // Refresh all courses that have Google Drive links
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, slug');
      
      if (coursesError) throw coursesError;

      // Get all modules with Google Drive video URLs
      const { data: allModules } = await supabase
        .from('modules')
        .select('id, course_id');
      
      const { data: allLessons } = await supabase
        .from('lessons')
        .select('id, module_id, video_url')
        .like('video_url', '%drive.google.com%');

      // Group by course and update
      const coursesWithDriveContent = new Set<string>();
      allLessons?.forEach(lesson => {
        const module = allModules?.find(m => m.id === lesson.module_id);
        if (module) {
          coursesWithDriveContent.add(module.course_id);
        }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Found ${coursesWithDriveContent.size} courses with Google Drive content`,
          courseIds: Array.from(coursesWithDriveContent)
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
        .select('id, title, video_url, module_id, description')
        .in('module_id', modules?.map(m => m.id) || []);

      // Check each video URL and verify it's still accessible
      let validLinks = 0;
      let brokenLinks = 0;
      
      for (const lesson of lessons || []) {
        if (lesson.video_url?.includes('drive.google.com')) {
          try {
            const fileId = extractFileId(lesson.video_url);
            if (fileId) {
              const isValid = await checkDriveFile(fileId, GOOGLE_API_KEY);
              if (isValid) {
                validLinks++;
              } else {
                brokenLinks++;
                // Mark lesson as having broken link
                const currentDesc = (lesson as any).description || '';
                await supabase.from('lessons').update({ 
                  description: `[BROKEN LINK] ${currentDesc}` 
                }).eq('id', lesson.id);
              }
            }
          } catch (e) {
            brokenLinks++;
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          courseId,
          validLinks,
          brokenLinks,
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
  // Handle various Google Drive URL formats
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

async function checkDriveFile(fileId: string, apiKey: string): Promise<boolean> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?key=${apiKey}&fields=id,name`;
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}
