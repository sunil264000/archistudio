import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// LuluStream uses the same API pattern as DoodStream/StreamTape
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

    const { action, courseId, lessonId } = await req.json();

    // ACTION: Check LuluStream account info
    if (action === "account-info") {
      const res = await fetch(`${LULUSTREAM_API_BASE}/account/info?key=${LULUSTREAM_API_KEY}`);
      const data = await res.json();
      return jsonResponse({ success: true, account: data });
    }

    // ACTION: Get migration status/stats
    if (action === "status") {
      const { data: stats } = await supabase
        .from("video_migrations")
        .select("status");

      const counts = {
        total: stats?.length || 0,
        pending: stats?.filter(s => s.status === "pending").length || 0,
        uploading: stats?.filter(s => s.status === "uploading").length || 0,
        completed: stats?.filter(s => s.status === "completed").length || 0,
        failed: stats?.filter(s => s.status === "failed").length || 0,
      };

      return jsonResponse({ success: true, counts });
    }

    // ACTION: Prepare migration - scan all Google Drive lessons and create migration records
    if (action === "prepare") {
      // Fetch ALL lessons using pagination to bypass the 1000-row default limit
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

        if (courseId) {
          query = query.eq("modules.course_id", courseId);
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

      const lessons = allLessons;

      if (!lessons || lessons.length === 0) {
        return jsonResponse({ success: true, message: "No Google Drive videos found", prepared: 0 });
      }

      // Check which lessons already have migration records
      const lessonIds = lessons.map(l => l.id);
      const { data: existing } = await supabase
        .from("video_migrations")
        .select("lesson_id")
        .in("lesson_id", lessonIds);

      const existingIds = new Set(existing?.map(e => e.lesson_id) || []);

      // Create migration records for new lessons only
      const newRecords = lessons
        .filter(l => !existingIds.has(l.id))
        .map(l => ({
          lesson_id: l.id,
          course_id: (l as any).modules?.course_id || null,
          original_url: l.video_url!,
          status: "pending",
        }));

      if (newRecords.length > 0) {
        const { error: insertError } = await supabase
          .from("video_migrations")
          .insert(newRecords);
        if (insertError) throw insertError;
      }

      return jsonResponse({
        success: true,
        message: `Prepared ${newRecords.length} new videos for migration (${existingIds.size} already tracked)`,
        prepared: newRecords.length,
        alreadyTracked: existingIds.size,
        totalDriveVideos: lessons.length,
      });
    }

    // ACTION: Start migration - process pending videos in batch
    if (action === "migrate") {
      const batchSize = 5; // Process 5 at a time (LuluStream remote upload is async on their end)

      let query = supabase
        .from("video_migrations")
        .select("id, lesson_id, original_url, course_id")
        .eq("status", "pending")
        .limit(batchSize);

      if (courseId) {
        query = query.eq("course_id", courseId);
      }

      const { data: pending, error: pendingError } = await query;
      if (pendingError) throw pendingError;

      if (!pending || pending.length === 0) {
        return jsonResponse({ success: true, message: "No pending migrations", processed: 0 });
      }

      let processed = 0;
      let failed = 0;

      for (const migration of pending) {
        try {
          // Mark as uploading
          await supabase
            .from("video_migrations")
            .update({ status: "uploading", updated_at: new Date().toISOString() })
            .eq("id", migration.id);

          // Extract Google Drive file ID
          const fileId = extractFileId(migration.original_url);
          if (!fileId) throw new Error("Could not extract file ID from URL");

          // Get file name from Google Drive
          const fileInfoRes = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?key=${GOOGLE_API_KEY}&fields=name,size`
          );
          const fileInfo = await fileInfoRes.json();
          const fileName = fileInfo.name || "video";

          // Create a direct download URL for Google Drive
          const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`;

          // Send remote upload request to LuluStream
          const uploadRes = await fetch(
            `${LULUSTREAM_API_BASE}/upload/url?key=${LULUSTREAM_API_KEY}&url=${encodeURIComponent(downloadUrl)}&new_title=${encodeURIComponent(fileName)}`
          );
          const uploadData = await uploadRes.json();

          console.log(`LuluStream upload response for ${fileName}:`, JSON.stringify(uploadData));

          if (uploadData.status === 200 && uploadData.result) {
            // Remote upload queued successfully - LuluStream will download in background
            const fileCode = uploadData.result.filecode || uploadData.result.file_code || "";

            await supabase
              .from("video_migrations")
              .update({
                status: "uploading", // Still uploading on LuluStream's end
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
      // Get all migrations that are in "uploading" state
      const { data: uploading } = await supabase
        .from("video_migrations")
        .select("id, lesson_id, lulustream_file_code")
        .eq("status", "uploading");

      if (!uploading || uploading.length === 0) {
        return jsonResponse({ success: true, message: "No uploads in progress", checked: 0 });
      }

      // Check remote upload status on LuluStream
      const statusRes = await fetch(
        `${LULUSTREAM_API_BASE}/urlupload/list?key=${LULUSTREAM_API_KEY}`
      );
      const statusData = await statusRes.json();

      let completed = 0;
      let stillUploading = 0;

      if (statusData.status === 200 && statusData.result) {
        const remoteUploads = statusData.result;

        for (const migration of uploading) {
          // Find matching remote upload by file code
          const match = remoteUploads.find((r: any) =>
            r.filecode === migration.lulustream_file_code ||
            r.file_code === migration.lulustream_file_code
          );

          if (match && (match.status === "completed" || match.status === "working" && match.bytes_loaded === match.bytes_total && match.bytes_total > 0)) {
            // Upload completed - get the embed URL
            const fileCode = migration.lulustream_file_code;
            const embedUrl = `https://lulustream.com/e/${fileCode}`;

            // Update migration record
            await supabase
              .from("video_migrations")
              .update({
                status: "completed",
                lulustream_embed_url: embedUrl,
                updated_at: new Date().toISOString(),
              })
              .eq("id", migration.id);

            // Update the lesson's video URL to LuluStream embed
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

      // Also check if any file_codes that aren't in remote list might already be done
      // Try getting file info directly
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
              .update({
                status: "completed",
                lulustream_embed_url: embedUrl,
                updated_at: new Date().toISOString(),
              })
              .eq("id", migration.id);

            await supabase
              .from("lessons")
              .update({ video_url: embedUrl })
              .eq("id", migration.lesson_id);

            completed++;
            stillUploading = Math.max(0, stillUploading - 1);
          }
        } catch {
          // Ignore - file might not be ready yet
        }
      }

      return jsonResponse({
        success: true,
        checked: uploading.length,
        completed,
        stillUploading,
      });
    }

    // ACTION: Retry failed migrations
    if (action === "retry-failed") {
      const { error } = await supabase
        .from("video_migrations")
        .update({ status: "pending", error_message: null, updated_at: new Date().toISOString() })
        .eq("status", "failed");

      if (error) throw error;
      return jsonResponse({ success: true, message: "Failed migrations reset to pending" });
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
