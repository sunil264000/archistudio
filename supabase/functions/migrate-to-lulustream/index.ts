import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LULUSTREAM_API_BASE = "https://api.lulustream.com/api";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LULUSTREAM_API_KEY = Deno.env.get("LULUSTREAM_API_KEY");
    if (!LULUSTREAM_API_KEY) throw new Error("LULUSTREAM_API_KEY not configured");

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, courseId, courseIds, batchSize: customBatchSize } = await req.json();

    // Resolve filter IDs: support single courseId or multi courseIds
    const filterCourseIds: string[] = courseIds?.length ? courseIds : courseId ? [courseId] : [];

    // ACTION: Check LuluStream account info
    if (action === "account-info") {
      const res = await fetch(`${LULUSTREAM_API_BASE}/account/info?key=${LULUSTREAM_API_KEY}`);
      const data = await res.json();
      return jsonResponse({ success: true, account: data });
    }

    // ACTION: Get migration status/stats (paginated to get ALL rows)
    if (action === "status") {
      const allStats: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from("video_migrations")
          .select("status, course_id")
          .range(offset, offset + pageSize - 1);

        if (filterCourseIds.length > 0) {
          query = query.in("course_id", filterCourseIds);
        }

        const { data: batch } = await query;
        if (batch && batch.length > 0) {
          allStats.push(...batch);
          offset += pageSize;
          hasMore = batch.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      const counts = {
        total: allStats.length,
        pending: allStats.filter(s => s.status === "pending").length,
        uploading: allStats.filter(s => s.status === "uploading").length,
        completed: allStats.filter(s => s.status === "completed").length,
        failed: allStats.filter(s => s.status === "failed").length,
      };

      return jsonResponse({ success: true, counts });
    }

    // ACTION: Prepare migration - scan ALL Google Drive lessons with pagination
    if (action === "prepare") {
      const allLessons: any[] = [];
      const pageSize = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        let query = supabase
          .from("lessons")
          .select("id, title, video_url, module_id, modules!inner(course_id, courses!inner(title))")
          .like("video_url", "%drive.google.com%")
          .range(offset, offset + pageSize - 1);

        if (filterCourseIds.length > 0) {
          query = query.in("modules.course_id", filterCourseIds);
        }

        const { data: batch, error: batchError } = await query;
        if (batchError) throw batchError;

        if (batch && batch.length > 0) {
          allLessons.push(...batch);
          offset += pageSize;
          hasMore = batch.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      if (allLessons.length === 0) {
        return jsonResponse({ success: true, message: "No Google Drive videos found", prepared: 0 });
      }

      // Check existing records with pagination too
      const lessonIds = allLessons.map(l => l.id);
      const existingIds = new Set<string>();
      
      // Query existing in chunks of 500 (IN clause limit)
      for (let i = 0; i < lessonIds.length; i += 500) {
        const chunk = lessonIds.slice(i, i + 500);
        const { data: existing } = await supabase
          .from("video_migrations")
          .select("lesson_id")
          .in("lesson_id", chunk);
        existing?.forEach(e => existingIds.add(e.lesson_id));
      }

      const newRecords = allLessons
        .filter(l => !existingIds.has(l.id))
        .map(l => ({
          lesson_id: l.id,
          course_id: (l as any).modules?.course_id || null,
          original_url: l.video_url!,
          status: "pending",
        }));

      // Insert in batches of 500
      if (newRecords.length > 0) {
        for (let i = 0; i < newRecords.length; i += 500) {
          const chunk = newRecords.slice(i, i + 500);
          const { error: insertError } = await supabase
            .from("video_migrations")
            .insert(chunk);
          if (insertError) throw insertError;
        }
      }

      return jsonResponse({
        success: true,
        message: `Prepared ${newRecords.length} new videos for migration (${existingIds.size} already tracked)`,
        prepared: newRecords.length,
        alreadyTracked: existingIds.size,
        totalDriveVideos: allLessons.length,
      });
    }

    // ACTION: Create folder on LuluStream
    if (action === "create-folder") {
      const { folderName, parentId } = await req.json().catch(() => ({}));
      let url = `${LULUSTREAM_API_BASE}/folder/create?key=${LULUSTREAM_API_KEY}&name=${encodeURIComponent(folderName || "Courses")}`;
      if (parentId) url += `&parent_id=${parentId}`;
      const res = await fetch(url);
      const data = await res.json();
      return jsonResponse({ success: true, folder: data });
    }

    // ACTION: Start migration - process pending videos in batch
    if (action === "migrate") {
      const batchSize = Math.min(customBatchSize || 10, 20);

      let query = supabase
        .from("video_migrations")
        .select("id, lesson_id, original_url, course_id")
        .eq("status", "pending")
        .limit(batchSize);

      if (filterCourseIds.length > 0) {
        query = query.in("course_id", filterCourseIds);
      }

      const { data: pending, error: pendingError } = await query;
      if (pendingError) throw pendingError;

      if (!pending || pending.length === 0) {
        return jsonResponse({ success: true, message: "No pending migrations", processed: 0 });
      }

      // Get course titles for folder naming
      const uniqueCourseIds = [...new Set(pending.map(p => p.course_id).filter(Boolean))];
      let courseTitleMap: Record<string, string> = {};
      if (uniqueCourseIds.length > 0) {
        const { data: courses } = await supabase
          .from("courses")
          .select("id, title")
          .in("id", uniqueCourseIds);
        courses?.forEach(c => { courseTitleMap[c.id] = c.title; });
      }

      let processed = 0;
      let failed = 0;

      for (const migration of pending) {
        try {
          await supabase
            .from("video_migrations")
            .update({ status: "uploading", updated_at: new Date().toISOString() })
            .eq("id", migration.id);

          const fileId = extractFileId(migration.original_url);
          if (!fileId) throw new Error("Could not extract file ID from URL");

          const fileInfoRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?key=${GOOGLE_API_KEY}&fields=name,size`
          );
          const fileInfo = await fileInfoRes.json();
          const fileName = fileInfo.name || "video";

          const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`;

          // Build upload URL with course folder name as title prefix for organization
          const courseTitle = migration.course_id ? courseTitleMap[migration.course_id] || "" : "";
          const organizedTitle = courseTitle ? `[${courseTitle}] ${fileName}` : fileName;

          const uploadRes = await fetch(
            `${LULUSTREAM_API_BASE}/upload/url?key=${LULUSTREAM_API_KEY}&url=${encodeURIComponent(downloadUrl)}&new_title=${encodeURIComponent(organizedTitle)}`
          );
          const uploadData = await uploadRes.json();

          console.log(`LuluStream upload response for ${organizedTitle}:`, JSON.stringify(uploadData));

          if (uploadData.status === 200 && uploadData.result) {
            const fileCode = uploadData.result.filecode || uploadData.result.file_code || "";

            await supabase
              .from("video_migrations")
              .update({
                status: "uploading",
                lulustream_file_code: fileCode,
                updated_at: new Date().toISOString(),
              })
              .eq("id", migration.id);

            processed++;
          } else {
            throw new Error(uploadData.msg || "LuluStream API error");
          }
        } catch (err: any) {
          console.error(`Migration failed for lesson ${migration.lesson_id}:`, err.message);
          await supabase
            .from("video_migrations")
            .update({
              status: "failed",
              error_message: err.message,
              updated_at: new Date().toISOString(),
            })
            .eq("id", migration.id);
          failed++;
        }
      }

      return jsonResponse({
        success: true,
        message: `Processed ${processed} uploads, ${failed} failed`,
        processed,
        failed,
        remaining: pending.length - processed - failed,
      });
    }

    // ACTION: Check remote upload status and update completed ones
    if (action === "check-progress") {
      const { data: uploading } = await supabase
        .from("video_migrations")
        .select("id, lesson_id, lulustream_file_code")
        .eq("status", "uploading");

      if (!uploading || uploading.length === 0) {
        return jsonResponse({ success: true, message: "No uploads in progress", checked: 0 });
      }

      const statusRes = await fetch(
        `${LULUSTREAM_API_BASE}/urlupload/list?key=${LULUSTREAM_API_KEY}`
      );
      const statusData = await statusRes.json();

      let completed = 0;
      let stillUploading = 0;

      if (statusData.status === 200 && statusData.result) {
        const remoteUploads = statusData.result;

        for (const migration of uploading) {
          const match = remoteUploads.find((r: any) =>
            r.filecode === migration.lulustream_file_code ||
            r.file_code === migration.lulustream_file_code
          );

          if (match && (match.status === "completed" || (match.status === "working" && match.bytes_loaded === match.bytes_total && match.bytes_total > 0))) {
            const fileCode = migration.lulustream_file_code;
            const embedUrl = `https://lulustream.com/e/${fileCode}`;

            await supabase
              .from("video_migrations")
              .update({ status: "completed", lulustream_embed_url: embedUrl, updated_at: new Date().toISOString() })
              .eq("id", migration.id);

            await supabase
              .from("lessons")
              .update({ video_url: embedUrl })
              .eq("id", migration.lesson_id);

            completed++;
          } else {
            stillUploading++;
          }
        }
      }

      // Double-check via file info API
      for (const migration of uploading) {
        if (!migration.lulustream_file_code) continue;

        try {
          const fileRes = await fetch(
            `${LULUSTREAM_API_BASE}/file/info?key=${LULUSTREAM_API_KEY}&file_code=${migration.lulustream_file_code}`
          );
          const fileData = await fileRes.json();

          if (fileData.status === 200 && fileData.result?.[0]?.status === 200) {
            const embedUrl = `https://lulustream.com/e/${migration.lulustream_file_code}`;

            await supabase
              .from("video_migrations")
              .update({ status: "completed", lulustream_embed_url: embedUrl, updated_at: new Date().toISOString() })
              .eq("id", migration.id);

            await supabase
              .from("lessons")
              .update({ video_url: embedUrl })
              .eq("id", migration.lesson_id);

            completed++;
            stillUploading = Math.max(0, stillUploading - 1);
          }
        } catch {
          // File not ready yet
        }
      }

      return jsonResponse({ success: true, checked: uploading.length, completed, stillUploading });
    }

    // ACTION: Retry failed migrations
    if (action === "retry-failed") {
      let query = supabase
        .from("video_migrations")
        .update({ status: "pending", error_message: null, updated_at: new Date().toISOString() })
        .eq("status", "failed");

      if (filterCourseIds.length > 0) {
        query = query.in("course_id", filterCourseIds);
      }

      const { error } = await query;
      if (error) throw error;
      return jsonResponse({ success: true, message: "Failed migrations reset to pending" });
    }

    // ACTION: Get per-course breakdown
    if (action === "course-stats") {
      const allMigrations: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: batch } = await supabase
          .from("video_migrations")
          .select("status, course_id")
          .range(offset, offset + pageSize - 1);
        
        if (batch && batch.length > 0) {
          allMigrations.push(...batch);
          offset += pageSize;
          hasMore = batch.length === pageSize;
        } else {
          hasMore = false;
        }
      }

      // Group by course_id
      const courseMap: Record<string, { total: number; pending: number; uploading: number; completed: number; failed: number }> = {};
      for (const m of allMigrations) {
        const cid = m.course_id || "unknown";
        if (!courseMap[cid]) courseMap[cid] = { total: 0, pending: 0, uploading: 0, completed: 0, failed: 0 };
        courseMap[cid].total++;
        courseMap[cid][m.status as keyof typeof courseMap[string]]++;
      }

      return jsonResponse({ success: true, courseStats: courseMap });
    }

    return jsonResponse({ success: false, error: "Invalid action" }, 400);
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return jsonResponse({ success: false, error: errorMessage }, 400);
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

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Content-Type": "application/json",
    },
  });
}
