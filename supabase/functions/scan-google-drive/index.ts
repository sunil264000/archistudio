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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY not configured");
    }

    const { folderId, courseId, action } = await req.json();

    if (!folderId) {
      throw new Error("Folder ID is required");
    }

    // Extract folder ID from various Google Drive URL formats
    let extractedFolderId = folderId;
    if (folderId.includes("drive.google.com")) {
      const match = folderId.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (match) {
        extractedFolderId = match[1];
      }
    }

    console.log("Scanning folder:", extractedFolderId);

    // Scan the folder structure
    const structure = await scanFolder(extractedFolderId, GOOGLE_API_KEY);

    if (action === "scan") {
      // Just return the structure for preview
      return new Response(JSON.stringify({ success: true, structure }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "import" && courseId) {
      // Import the structure into the database
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const importResult = await importStructure(supabase, courseId, structure);

      return new Response(JSON.stringify({ success: true, ...importResult }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, structure }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function scanFolder(
  folderId: string,
  apiKey: string,
  depth: number = 0
): Promise<any> {
  const files = await listFilesInFolder(folderId, apiKey);

  const folders: any[] = [];
  const videos: any[] = [];
  const resources: any[] = [];

  for (const file of files) {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      // It's a subfolder (module)
      const subContent = await scanFolder(file.id, apiKey, depth + 1);
      folders.push({
        id: file.id,
        name: file.name,
        type: "folder",
        ...subContent,
      });
    } else if (file.mimeType.startsWith("video/")) {
      // It's a video file (lesson)
      videos.push({
        id: file.id,
        name: file.name,
        type: "video",
        mimeType: file.mimeType,
        driveUrl: `https://drive.google.com/file/d/${file.id}/view`,
        embedUrl: `https://drive.google.com/file/d/${file.id}/preview`,
      });
    } else {
      // Other files (resources like PDFs, images, etc.)
      resources.push({
        id: file.id,
        name: file.name,
        type: "resource",
        mimeType: file.mimeType,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
      });
    }
  }

  // Sort by name to maintain order
  folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  videos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  return { folders, videos, resources };
}

async function listFilesInFolder(
  folderId: string,
  apiKey: string
): Promise<DriveFile[]> {
  const allFiles: DriveFile[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL("https://www.googleapis.com/drive/v3/files");
    url.searchParams.set("q", `'${folderId}' in parents and trashed = false`);
    url.searchParams.set("key", apiKey);
    url.searchParams.set("fields", "nextPageToken, files(id, name, mimeType, parents)");
    url.searchParams.set("pageSize", "1000");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Drive API error:", errorText);
      throw new Error(`Google Drive API error: ${response.status} - ${errorText}`);
    }

    const data: DriveListResponse = await response.json();
    allFiles.push(...data.files);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return allFiles;
}

async function importStructure(
  supabase: any,
  courseId: string,
  structure: any
): Promise<{ modulesCreated: number; lessonsCreated: number }> {
  let modulesCreated = 0;
  let lessonsCreated = 0;

  // Get existing max order_index for modules
  const { data: existingModules } = await supabase
    .from("modules")
    .select("order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: false })
    .limit(1);

  let moduleOrderIndex = existingModules?.[0]?.order_index ?? -1;

  // Process folders as modules
  for (const folder of structure.folders) {
    moduleOrderIndex++;

    // Create module
    const { data: newModule, error: moduleError } = await supabase
      .from("modules")
      .insert({
        course_id: courseId,
        title: folder.name,
        order_index: moduleOrderIndex,
      })
      .select()
      .single();

    if (moduleError) {
      console.error("Error creating module:", moduleError);
      continue;
    }

    modulesCreated++;

    // Create lessons from videos in this folder
    let lessonOrderIndex = 0;
    for (const video of folder.videos || []) {
      const { error: lessonError } = await supabase.from("lessons").insert({
        module_id: newModule.id,
        title: cleanVideoTitle(video.name),
        video_url: video.embedUrl,
        order_index: lessonOrderIndex,
        is_free_preview: lessonOrderIndex === 0, // First lesson is free preview
      });

      if (!lessonError) {
        lessonsCreated++;
      }
      lessonOrderIndex++;
    }

    // Process nested folders (sub-modules) as additional lessons
    for (const subFolder of folder.folders || []) {
      for (const video of subFolder.videos || []) {
        const { error: lessonError } = await supabase.from("lessons").insert({
          module_id: newModule.id,
          title: `${subFolder.name} - ${cleanVideoTitle(video.name)}`,
          video_url: video.embedUrl,
          order_index: lessonOrderIndex,
        });

        if (!lessonError) {
          lessonsCreated++;
        }
        lessonOrderIndex++;
      }
    }
  }

  // If there are videos directly in the root folder, create a "Main Content" module
  if (structure.videos && structure.videos.length > 0) {
    moduleOrderIndex++;

    const { data: mainModule, error: moduleError } = await supabase
      .from("modules")
      .insert({
        course_id: courseId,
        title: "Course Content",
        order_index: moduleOrderIndex,
      })
      .select()
      .single();

    if (!moduleError) {
      modulesCreated++;

      let lessonOrderIndex = 0;
      for (const video of structure.videos) {
        const { error: lessonError } = await supabase.from("lessons").insert({
          module_id: mainModule.id,
          title: cleanVideoTitle(video.name),
          video_url: video.embedUrl,
          order_index: lessonOrderIndex,
          is_free_preview: lessonOrderIndex === 0,
        });

        if (!lessonError) {
          lessonsCreated++;
        }
        lessonOrderIndex++;
      }
    }
  }

  return { modulesCreated, lessonsCreated };
}

function cleanVideoTitle(filename: string): string {
  // Remove file extension
  let title = filename.replace(/\.[^/.]+$/, "");
  // Remove common prefixes like "01 - ", "1. ", etc.
  title = title.replace(/^\d+[\s._-]+/, "");
  return title.trim();
}
