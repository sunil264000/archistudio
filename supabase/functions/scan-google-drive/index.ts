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

// Maximum recursion depth for scanning - DEEP 12 levels for complex nested structures
const MAX_SCAN_DEPTH = 12;

// Video file extensions to identify
const VIDEO_EXTENSIONS = ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpeg', '.mpg', '.3gp'];
const VIDEO_MIMETYPES = ['video/mp4', 'video/avi', 'video/mkv', 'video/quicktime', 'video/x-ms-wmv', 'video/x-flv', 'video/webm', 'video/x-m4v', 'video/mpeg', 'video/3gpp'];

function isVideoFile(file: DriveFile): boolean {
  if (file.mimeType.startsWith("video/") || VIDEO_MIMETYPES.includes(file.mimeType)) {
    return true;
  }
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
      throw new Error("GOOGLE_API_KEY not configured. Please add it in Cloud secrets.");
    }

    const { folderId, courseId, action, scanMode, maxDepth } = await req.json();

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

    // Allow custom depth override (1-12), default to MAX_SCAN_DEPTH
    const scanDepth = Math.min(Math.max(maxDepth || MAX_SCAN_DEPTH, 1), MAX_SCAN_DEPTH);

    console.log(`Scanning folder: ${extractedFolderId}, Action: ${action}, Mode: ${scanMode}, Depth: ${scanDepth}`);

    // For bulk parent scanning - only scan top-level subfolders (deep count)
    if (scanMode === "bulk-parent") {
      const structure = await scanFolderShallow(extractedFolderId, GOOGLE_API_KEY, scanDepth);
      return new Response(JSON.stringify({ success: true, structure, maxDepth: scanDepth }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Quick scan - just count content without full structure
    if (action === "quick-scan") {
      const counts = await quickScanFolder(extractedFolderId, GOOGLE_API_KEY, scanDepth);
      return new Response(JSON.stringify({ success: true, ...counts, maxDepth: scanDepth }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // For single course folder - deep scan with video metadata
    if (action === "scan" || action === "scan-deep") {
      const structure = await scanFolder(extractedFolderId, GOOGLE_API_KEY, 0, action === "scan-deep", scanDepth);
      return new Response(JSON.stringify({ success: true, structure, maxDepth: scanDepth }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SMART SYNC IMPORT - replaces existing content, no duplicates
    if ((action === "import" || action === "import-fast" || action === "sync") && courseId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fast parallel scan with configurable depth
      const structure = await scanFolderFast(extractedFolderId, GOOGLE_API_KEY, scanDepth);
      
      // SMART SYNC: Delete existing modules and lessons for this course first
      const deleteResult = await deleteExistingContent(supabase, courseId);
      console.log("Deleted existing content:", deleteResult);
      
      const importResult = await importStructureFast(supabase, courseId, structure);

      // Update course stats
      await updateCourseStats(supabase, courseId, importResult.lessonsCreated);

      return new Response(JSON.stringify({ 
        success: true, 
        ...importResult,
        deletedModules: deleteResult.modulesDeleted,
        deletedLessons: deleteResult.lessonsDeleted,
        synced: true,
        maxDepth: scanDepth
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Default: simple scan
    const structure = await scanFolder(extractedFolderId, GOOGLE_API_KEY, 0, false, scanDepth);
    return new Response(JSON.stringify({ success: true, structure, maxDepth: scanDepth }), {
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

// Quick scan - just count videos and folders without full structure
async function quickScanFolder(
  folderId: string,
  apiKey: string,
  maxDepth: number
): Promise<{ videoCount: number; folderCount: number; resourceCount: number }> {
  let videoCount = 0;
  let folderCount = 0;
  let resourceCount = 0;

  async function countRecursive(fid: string, depth: number): Promise<void> {
    if (depth > maxDepth) return;
    
    const files = await listFilesInFolder(fid, apiKey);
    
    for (const file of files) {
      if (file.mimeType === "application/vnd.google-apps.folder") {
        folderCount++;
        await countRecursive(file.id, depth + 1);
      } else if (isVideoFile(file)) {
        videoCount++;
      } else {
        resourceCount++;
      }
    }
  }

  await countRecursive(folderId, 0);
  return { videoCount, folderCount, resourceCount };
}

// Deep scan - scans up to maxDepth levels of subfolders to count ALL videos
async function scanFolderShallow(
  folderId: string,
  apiKey: string,
  maxDepth: number
): Promise<any> {
  const files = await listFilesInFolder(folderId, apiKey);

  const folders: any[] = [];
  let rootVideos = 0;

  // Helper to recursively count videos up to maxDepth levels
  async function countVideosDeep(folderId: string, currentDepth: number): Promise<number> {
    if (currentDepth > maxDepth) return 0;
    
    const files = await listFilesInFolder(folderId, apiKey);
    let count = 0;
    
    // Count videos at this level
    count += files.filter(f => isVideoFile(f)).length;
    
    // Recursively count in subfolders
    const subFolders = files.filter(f => f.mimeType === "application/vnd.google-apps.folder");
    
    // Process subfolders in parallel for speed
    const subCounts = await Promise.all(
      subFolders.map(f => countVideosDeep(f.id, currentDepth + 1))
    );
    
    count += subCounts.reduce((sum, c) => sum + c, 0);
    return count;
  }

  // Count subfolders at level 2 (for display info)
  async function countSubFolders(folderId: string): Promise<number> {
    const files = await listFilesInFolder(folderId, apiKey);
    return files.filter(f => f.mimeType === "application/vnd.google-apps.folder").length;
  }

  // Process top-level folders in parallel
  const topLevelFolders = files.filter(f => f.mimeType === "application/vnd.google-apps.folder");
  const topLevelVideos = files.filter(f => isVideoFile(f));
  rootVideos = topLevelVideos.length;

  // Scan all top-level folders in parallel (each scanning maxDepth levels deep)
  const folderResults = await Promise.all(
    topLevelFolders.map(async (file) => {
      // Count ALL videos up to maxDepth levels deep
      const videoCount = await countVideosDeep(file.id, 1);
      const subFolderCount = await countSubFolders(file.id);

      return {
        id: file.id,
        name: file.name,
        type: "folder",
        videoCount,
        subFolderCount,
        url: `https://drive.google.com/drive/folders/${file.id}`,
      };
    })
  );

  folders.push(...folderResults);

  // Sort folders by name
  folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  return { folders, rootVideos, totalFolders: folders.length, maxDepth };
}

// FAST parallel scan - scans up to maxDepth levels of subfolders in parallel for speed
async function scanFolderFast(
  folderId: string,
  apiKey: string,
  maxDepth: number
): Promise<any> {
  // Recursive function to scan folder and all subfolders up to maxDepth
  async function scanDeepParallel(folderId: string, depth: number, pathPrefix: string = ""): Promise<{ videos: any[], resources: any[], nestedFolders: any[] }> {
    if (depth > maxDepth) return { videos: [], resources: [], nestedFolders: [] };
    
    const files = await listFilesInFolder(folderId, apiKey);
    
    const videos = files.filter(f => isVideoFile(f)).map(v => ({
      id: v.id,
      name: v.name,
      type: "video",
      mimeType: v.mimeType,
      durationMinutes: 0,
      driveUrl: `https://drive.google.com/file/d/${v.id}/view`,
      embedUrl: `https://drive.google.com/file/d/${v.id}/preview`,
      _pathPrefix: pathPrefix,
    }));
    
    const resources = files.filter(f => !isVideoFile(f) && f.mimeType !== "application/vnd.google-apps.folder").map(r => ({
      id: r.id,
      name: r.name,
      type: "resource",
      mimeType: r.mimeType,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${r.id}`,
    }));
    
    const subFolders = files.filter(f => f.mimeType === "application/vnd.google-apps.folder");
    
    // Scan all subfolders in parallel
    const nestedResults = await Promise.all(
      subFolders.map(async (sf) => {
        const newPrefix = pathPrefix ? `${pathPrefix} > ${sf.name}` : sf.name;
        const nested = await scanDeepParallel(sf.id, depth + 1, newPrefix);
        return {
          name: sf.name,
          id: sf.id,
          pathPrefix: newPrefix,
          ...nested,
        };
      })
    );
    
    return { videos, resources, nestedFolders: nestedResults };
  }

  const files = await listFilesInFolder(folderId, apiKey);
  const folderFiles = files.filter(f => f.mimeType === "application/vnd.google-apps.folder");
  const videoFiles = files.filter(f => isVideoFile(f));
  const resourceFiles = files.filter(f => !isVideoFile(f) && f.mimeType !== "application/vnd.google-apps.folder");

  // Scan all top-level folders in PARALLEL (each will scan maxDepth levels deep)
  const subFolderResults = await Promise.all(
    folderFiles.map(async (folder) => {
      const deepScan = await scanDeepParallel(folder.id, 1, "");
      
      // Flatten all nested videos into a single list with folder prefix
      const allVideos: any[] = [...deepScan.videos];
      const allResources: any[] = [...deepScan.resources];
      
      // Recursive helper to flatten nested folder videos
      function flattenVideos(folders: any[], prefix: string = "") {
        for (const f of folders) {
          const folderPrefix = prefix ? `${prefix} > ${f.name}` : f.name;
          for (const v of f.videos || []) {
            allVideos.push({
              ...v,
              name: `${folderPrefix} - ${v.name}`,
              _originalName: v.name,
              _folderPath: folderPrefix,
            });
          }
          allResources.push(...(f.resources || []));
          if (f.nestedFolders?.length > 0) {
            flattenVideos(f.nestedFolders, folderPrefix);
          }
        }
      }
      
      flattenVideos(deepScan.nestedFolders);

      return {
        id: folder.id,
        name: folder.name,
        type: "folder",
        videos: allVideos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
        resources: allResources,
        folders: deepScan.nestedFolders.filter(n => n.videos?.length > 0 || n.nestedFolders?.length > 0),
      };
    })
  );

  const videos = videoFiles.map(v => ({
    id: v.id,
    name: v.name,
    type: "video",
    mimeType: v.mimeType,
    durationMinutes: 0,
    driveUrl: `https://drive.google.com/file/d/${v.id}/view`,
    embedUrl: `https://drive.google.com/file/d/${v.id}/preview`,
  }));

  const resources = resourceFiles.map(r => ({
    id: r.id,
    name: r.name,
    type: "resource",
    mimeType: r.mimeType,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${r.id}`,
  }));

  // Sort folders by name
  subFolderResults.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  videos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  return { folders: subFolderResults, videos, resources };
}

// Full recursive scan with optional video metadata
async function scanFolder(
  folderId: string,
  apiKey: string,
  depth: number = 0,
  fetchDurations: boolean = false,
  maxDepth: number = MAX_SCAN_DEPTH
): Promise<any> {
  if (depth > maxDepth) {
    return { folders: [], videos: [], resources: [] };
  }

  const files = await listFilesInFolder(folderId, apiKey);

  const folders: any[] = [];
  const videos: any[] = [];
  const resources: any[] = [];

  for (const file of files) {
    if (file.mimeType === "application/vnd.google-apps.folder") {
      const subContent = await scanFolder(file.id, apiKey, depth + 1, fetchDurations, maxDepth);
      folders.push({
        id: file.id,
        name: file.name,
        type: "folder",
        ...subContent,
      });
    } else if (isVideoFile(file)) {
      // Only fetch duration if requested (slower but more accurate)
      const duration = fetchDurations ? await getVideoDuration(file.id, apiKey) : 0;
      videos.push({
        id: file.id,
        name: file.name,
        type: "video",
        mimeType: file.mimeType,
        durationMinutes: duration,
        driveUrl: `https://drive.google.com/file/d/${file.id}/view`,
        embedUrl: `https://drive.google.com/file/d/${file.id}/preview`,
      });
    } else {
      resources.push({
        id: file.id,
        name: file.name,
        type: "resource",
        mimeType: file.mimeType,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${file.id}`,
        canDownload: true,
      });
    }
  }

  // Sort by name
  folders.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  videos.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  resources.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

  return { folders, videos, resources };
}

async function getVideoDuration(fileId: string, apiKey: string): Promise<number> {
  try {
    const url = `https://www.googleapis.com/drive/v3/files/${fileId}?key=${apiKey}&fields=videoMediaMetadata`;
    const response = await fetch(url);
    
    if (!response.ok) return 0;
    
    const data = await response.json();
    if (data.videoMediaMetadata?.durationMillis) {
      return Math.ceil(parseInt(data.videoMediaMetadata.durationMillis) / 60000);
    }
    return 0;
  } catch {
    return 0;
  }
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

// Delete all existing modules/lessons for a course (for clean sync)
async function deleteExistingContent(
  supabase: any,
  courseId: string
): Promise<{ modulesDeleted: number; lessonsDeleted: number; resourcesDeleted: number }> {
  // Get all modules for this course
  const { data: modules } = await supabase
    .from("modules")
    .select("id")
    .eq("course_id", courseId);
  
  if (!modules || modules.length === 0) {
    return { modulesDeleted: 0, lessonsDeleted: 0, resourcesDeleted: 0 };
  }
  
  const moduleIds = modules.map((m: any) => m.id);
  
  // Get all lessons for these modules
  const { data: lessons } = await supabase
    .from("lessons")
    .select("id")
    .in("module_id", moduleIds);
  
  const lessonIds = lessons?.map((l: any) => l.id) || [];
  
  // Delete resources first (foreign key)
  let resourcesDeleted = 0;
  if (lessonIds.length > 0) {
    const { count } = await supabase
      .from("lesson_resources")
      .delete({ count: 'exact' })
      .in("lesson_id", lessonIds);
    resourcesDeleted = count || 0;
  }
  
  // Delete all lessons for these modules
  const { count: lessonsDeleted } = await supabase
    .from("lessons")
    .delete({ count: 'exact' })
    .in("module_id", moduleIds);
  
  // Delete all modules
  const { count: modulesDeleted } = await supabase
    .from("modules")
    .delete({ count: 'exact' })
    .eq("course_id", courseId);
  
  return { 
    modulesDeleted: modulesDeleted || 0, 
    lessonsDeleted: lessonsDeleted || 0,
    resourcesDeleted 
  };
}

// Update course stats after import
async function updateCourseStats(
  supabase: any,
  courseId: string,
  totalLessons: number
): Promise<void> {
  await supabase
    .from("courses")
    .update({
      total_lessons: totalLessons,
      updated_at: new Date().toISOString()
    })
    .eq("id", courseId);
}

// FAST import - uses batch inserts for maximum speed
async function importStructureFast(
  supabase: any,
  courseId: string,
  structure: any
): Promise<{ modulesCreated: number; lessonsCreated: number; resourcesCreated: number }> {
  let modulesCreated = 0;
  let lessonsCreated = 0;
  let resourcesCreated = 0;

  // Get existing max order_index for modules
  const { data: existingModules } = await supabase
    .from("modules")
    .select("order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: false })
    .limit(1);

  let moduleOrderIndex = existingModules?.[0]?.order_index ?? -1;

  // Prepare all modules for batch insert
  const modulesToInsert = structure.folders.map((folder: any, idx: number) => ({
    course_id: courseId,
    title: folder.name,
    order_index: moduleOrderIndex + 1 + idx,
    _videos: folder.videos || [],
    _resources: folder.resources || [],
    _subFolders: folder.folders || [],
  }));

  // Add root videos module if needed
  if (structure.videos?.length > 0) {
    modulesToInsert.push({
      course_id: courseId,
      title: "Course Content",
      order_index: moduleOrderIndex + 1 + structure.folders.length,
      _videos: structure.videos,
      _resources: structure.resources || [],
      _subFolders: [],
    });
  }

  // Batch insert all modules at once
  if (modulesToInsert.length > 0) {
    const moduleInsertData = modulesToInsert.map((m: any) => ({
      course_id: m.course_id,
      title: m.title,
      order_index: m.order_index,
    }));

    const { data: insertedModules, error: modulesError } = await supabase
      .from("modules")
      .insert(moduleInsertData)
      .select();

    if (modulesError) {
      console.error("Batch module insert error:", modulesError);
      return { modulesCreated: 0, lessonsCreated: 0, resourcesCreated: 0 };
    }

    modulesCreated = insertedModules.length;

    // Now batch insert all lessons
    const allLessons: any[] = [];

    for (let i = 0; i < insertedModules.length; i++) {
      const module = insertedModules[i];
      const moduleData = modulesToInsert[i];
      let lessonIdx = 0;

      // Direct videos
      for (const video of moduleData._videos || []) {
        allLessons.push({
          module_id: module.id,
          title: cleanVideoTitle(video.name),
          video_url: video.embedUrl,
          order_index: lessonIdx++,
          duration_minutes: 0,
          is_free_preview: false,
        });
      }

      // Nested folder videos
      for (const subFolder of moduleData._subFolders || []) {
        for (const video of subFolder.videos || []) {
          allLessons.push({
            module_id: module.id,
            title: `${subFolder.name} - ${cleanVideoTitle(video.name)}`,
            video_url: video.embedUrl,
            order_index: lessonIdx++,
            duration_minutes: 0,
            is_free_preview: false,
          });
        }
      }
    }

    // Batch insert all lessons at once (chunks of 100 for safety)
    const LESSON_BATCH_SIZE = 100;
    for (let i = 0; i < allLessons.length; i += LESSON_BATCH_SIZE) {
      const batch = allLessons.slice(i, i + LESSON_BATCH_SIZE);
      const { data: insertedLessons, error: lessonsError } = await supabase
        .from("lessons")
        .insert(batch)
        .select();

      if (!lessonsError && insertedLessons) {
        lessonsCreated += insertedLessons.length;
      }
    }
  }

  return { modulesCreated, lessonsCreated, resourcesCreated };
}

function cleanVideoTitle(filename: string): string {
  let title = filename.replace(/\.[^/.]+$/, "");
  title = title.replace(/^\d+[\s._-]+/, "");
  return title.trim();
}
