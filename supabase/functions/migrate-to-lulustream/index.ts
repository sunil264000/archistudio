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
    const filterCourseIds: string[] = courseIds?.length ? courseIds : courseId ? [courseId] : [];

    // Helper: fetch all rows with pagination
    async function fetchAllPaginated(table: string, select: string, filters?: (q: any) => any) {
      const all: any[] = [];
      let offset = 0;
      const pageSize = 1000;
      while (true) {
        let q = supabase.from(table).select(select).range(offset, offset + pageSize - 1);
        if (filters) q = filters(q);
        const { data } = await q;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < pageSize) break;
        offset += pageSize;
      }
      return all;
    }

    // ACTION: Real-time status — queries lessons directly, no stale migration table dependency
    if (action === "status") {
      const migrations = await fetchAllPaginated("video_migrations", "status, course_id", (q) => {
        if (filterCourseIds.length > 0) return q.in("course_id", filterCourseIds);
        return q;
      });

      const counts = {
        total: migrations.length,
        pending: migrations.filter(s => s.status === "pending").length,
        uploading: migrations.filter(s => s.status === "uploading").length,
        completed: migrations.filter(s => s.status === "completed").length,
        failed: migrations.filter(s => s.status === "failed").length,
      };

      return jsonResponse({ success: true, counts });
    }

    // ACTION: Sync — clean duplicates, remove orphans, add missing lessons
    if (action === "sync") {
      // 1. Remove duplicates (keep newest per lesson_id)
      // Manual fallback: fetch all, find dupes, delete
      const allMigrations = await fetchAllPaginated("video_migrations", "id, lesson_id, created_at");
      const seen = new Map<string, { id: string; created_at: string }>();
      const dupeIds: string[] = [];
      for (const m of allMigrations) {
        const existing = seen.get(m.lesson_id);
        if (existing) {
          // Keep the newer one
          if (m.created_at > existing.created_at) {
            dupeIds.push(existing.id);
            seen.set(m.lesson_id, m);
          } else {
            dupeIds.push(m.id);
          }
        } else {
          seen.set(m.lesson_id, m);
        }
      }

      // Delete dupes in chunks
      for (let i = 0; i < dupeIds.length; i += 500) {
        await supabase.from("video_migrations").delete().in("id", dupeIds.slice(i, i + 500));
      }

      // 2. Remove orphaned migration records (lesson no longer exists or URL changed to lulustream)
      const allLessonIds = await fetchAllPaginated("lessons", "id, video_url");
      const driveLesonIds = new Set(allLessonIds.filter(l => l.video_url?.includes("drive.google.com")).map(l => l.id));
      const luluLessonIds = new Set(allLessonIds.filter(l => l.video_url?.includes("lulustream.com")).map(l => l.id));
      
      // Mark migrations as completed if lesson already has lulustream URL
      const remainingMigrations = await fetchAllPaginated("video_migrations", "id, lesson_id, status");
      const orphanIds: string[] = [];
      const alreadyDoneIds: string[] = [];
      
      for (const m of remainingMigrations) {
        if (luluLessonIds.has(m.lesson_id) && m.status !== "completed") {
          alreadyDoneIds.push(m.id);
        } else if (!driveLesonIds.has(m.lesson_id) && !luluLessonIds.has(m.lesson_id)) {
          orphanIds.push(m.id);
        }
      }

      for (let i = 0; i < orphanIds.length; i += 500) {
        await supabase.from("video_migrations").delete().in("id", orphanIds.slice(i, i + 500));
      }
      for (let i = 0; i < alreadyDoneIds.length; i += 500) {
        await supabase.from("video_migrations").update({ status: "completed" }).in("id", alreadyDoneIds.slice(i, i + 500));
      }

      // 3. Add missing lessons that have Google Drive URLs but no migration record
      const trackedLessonIds = new Set(remainingMigrations.map(m => m.lesson_id));
      const missingLessons = allLessonIds.filter(l => 
        l.video_url?.includes("drive.google.com") && !trackedLessonIds.has(l.id)
      );

      // Get course_id for missing lessons
      if (missingLessons.length > 0) {
        const missingIds = missingLessons.map(l => l.id);
        const lessonDetails: any[] = [];
        for (let i = 0; i < missingIds.length; i += 500) {
          const { data } = await supabase
            .from("lessons")
            .select("id, video_url, modules!inner(course_id)")
            .in("id", missingIds.slice(i, i + 500));
          if (data) lessonDetails.push(...data);
        }

        const newRecords = lessonDetails.map(l => ({
          lesson_id: l.id,
          course_id: (l as any).modules?.course_id || null,
          original_url: l.video_url!,
          status: "pending",
        }));

        for (let i = 0; i < newRecords.length; i += 500) {
          await supabase.from("video_migrations").insert(newRecords.slice(i, i + 500));
        }
      }

      return jsonResponse({
        success: true,
        message: `Sync complete: removed ${dupeIds.length} duplicates, ${orphanIds.length} orphans, marked ${alreadyDoneIds.length} already done, added ${missingLessons.length} missing`,
        duplicatesRemoved: dupeIds.length,
        orphansRemoved: orphanIds.length,
        alreadyDone: alreadyDoneIds.length,
        missingAdded: missingLessons.length,
      });
    }

    // ACTION: Migrate — auto-prepares missing records then processes batch
    if (action === "migrate") {
      const batchSize = Math.min(customBatchSize || 50, 50); // LuluStream limit: 60 req/min

      // Auto-prepare: find Drive lessons without migration records and add them
      let lessonQuery = supabase
        .from("lessons")
        .select("id, title, video_url, module_id, modules!inner(course_id, courses!inner(title))")
        .like("video_url", "%drive.google.com%")
        .limit(batchSize);

      if (filterCourseIds.length > 0) {
        lessonQuery = lessonQuery.in("modules.course_id", filterCourseIds);
      }

      const { data: driveLessons } = await lessonQuery;

      if (driveLessons && driveLessons.length > 0) {
        const lessonIds = driveLessons.map(l => l.id);
        const { data: existing } = await supabase
          .from("video_migrations")
          .select("lesson_id")
          .in("lesson_id", lessonIds);
        const existingSet = new Set(existing?.map(e => e.lesson_id) || []);

        const newRecords = driveLessons
          .filter(l => !existingSet.has(l.id))
          .map(l => ({
            lesson_id: l.id,
            course_id: (l as any).modules?.course_id || null,
            original_url: l.video_url!,
            status: "pending",
          }));

        if (newRecords.length > 0) {
          await supabase.from("video_migrations").insert(newRecords);
        }
      }

      // Now fetch pending migrations
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

      // Get course titles for organization
      const uniqueCourseIds = [...new Set(pending.map(p => p.course_id).filter(Boolean))];
      let courseTitleMap: Record<string, string> = {};
      if (uniqueCourseIds.length > 0) {
        const { data: courses } = await supabase.from("courses").select("id, title").in("id", uniqueCourseIds);
        courses?.forEach(c => { courseTitleMap[c.id] = c.title; });
      }

      // Process ALL concurrently
      const results = await Promise.allSettled(pending.map(async (migration) => {
        try {
          const fileId = extractFileId(migration.original_url);
          if (!fileId) throw new Error("Could not extract file ID from URL");

          const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${GOOGLE_API_KEY}`;
          const courseTitle = migration.course_id ? courseTitleMap[migration.course_id] || "" : "";
          const organizedTitle = courseTitle ? `[${courseTitle}] ${fileId}` : fileId;

          const uploadRes = await fetch(
            `${LULUSTREAM_API_BASE}/upload/url?key=${LULUSTREAM_API_KEY}&url=${encodeURIComponent(downloadUrl)}&new_title=${encodeURIComponent(organizedTitle)}`
          );
          const uploadData = await uploadRes.json();

          if (uploadData.status === 200 && uploadData.result) {
            const fileCode = uploadData.result.filecode || uploadData.result.file_code || "";
            await supabase.from("video_migrations")
              .update({ status: "uploading", lulustream_file_code: fileCode, updated_at: new Date().toISOString() })
              .eq("id", migration.id);
            return "ok";
          } else {
            throw new Error(uploadData.msg || "LuluStream API error");
          }
        } catch (err: any) {
          await supabase.from("video_migrations")
            .update({ status: "failed", error_message: err.message, updated_at: new Date().toISOString() })
            .eq("id", migration.id);
          throw err;
        }
      }));

      let processed = 0, failed = 0;
      for (const r of results) {
        if (r.status === "fulfilled") processed++;
        else failed++;
      }

      return jsonResponse({ success: true, message: `Processed ${processed} uploads, ${failed} failed`, processed, failed });
    }

    // ACTION: Check remote upload status
    if (action === "check-progress") {
      const { data: uploading } = await supabase
        .from("video_migrations")
        .select("id, lesson_id, lulustream_file_code")
        .eq("status", "uploading");

      if (!uploading || uploading.length === 0) {
        return jsonResponse({ success: true, message: "No uploads in progress", checked: 0 });
      }

      const statusRes = await fetch(`${LULUSTREAM_API_BASE}/urlupload/list?key=${LULUSTREAM_API_KEY}`);
      const statusData = await statusRes.json();

      let completed = 0;
      let stillUploading = 0;
      const checkedIds = new Set<string>();

      if (statusData.status === 200 && statusData.result) {
        for (const migration of uploading) {
          const match = statusData.result.find((r: any) =>
            r.filecode === migration.lulustream_file_code || r.file_code === migration.lulustream_file_code
          );

          if (match && (match.status === "completed" || (match.status === "working" && match.bytes_loaded === match.bytes_total && match.bytes_total > 0))) {
            const embedUrl = `https://lulustream.com/e/${migration.lulustream_file_code}`;
            await supabase.from("video_migrations")
              .update({ status: "completed", lulustream_embed_url: embedUrl, updated_at: new Date().toISOString() })
              .eq("id", migration.id);
            await supabase.from("lessons").update({ video_url: embedUrl }).eq("id", migration.lesson_id);
            completed++;
            checkedIds.add(migration.id);
          } else {
            stillUploading++;
            checkedIds.add(migration.id);
          }
        }
      }

      // Double-check unchecked ones via file info API
      for (const migration of uploading) {
        if (checkedIds.has(migration.id) || !migration.lulustream_file_code) continue;
        try {
          const fileRes = await fetch(`${LULUSTREAM_API_BASE}/file/info?key=${LULUSTREAM_API_KEY}&file_code=${migration.lulustream_file_code}`);
          const fileData = await fileRes.json();
          if (fileData.status === 200 && fileData.result?.[0]?.status === 200) {
            const embedUrl = `https://lulustream.com/e/${migration.lulustream_file_code}`;
            await supabase.from("video_migrations")
              .update({ status: "completed", lulustream_embed_url: embedUrl, updated_at: new Date().toISOString() })
              .eq("id", migration.id);
            await supabase.from("lessons").update({ video_url: embedUrl }).eq("id", migration.lesson_id);
            completed++;
            stillUploading = Math.max(0, stillUploading - 1);
          }
        } catch { /* not ready */ }
      }

      return jsonResponse({ success: true, checked: uploading.length, completed, stillUploading });
    }

    // ACTION: Retry failed
    if (action === "retry-failed") {
      let query = supabase.from("video_migrations")
        .update({ status: "pending", error_message: null, updated_at: new Date().toISOString() })
        .eq("status", "failed");
      if (filterCourseIds.length > 0) query = query.in("course_id", filterCourseIds);
      const { error } = await query;
      if (error) throw error;
      return jsonResponse({ success: true, message: "Failed migrations reset to pending" });
    }

    // ACTION: Reset completed (for re-upload)
    if (action === "reset-completed") {
      let query = supabase.from("video_migrations")
        .update({ status: "pending", lulustream_file_code: null, lulustream_embed_url: null, error_message: null, updated_at: new Date().toISOString() })
        .eq("status", "completed");
      if (filterCourseIds.length > 0) query = query.in("course_id", filterCourseIds);
      const { data, error } = await query.select("lesson_id, original_url");
      if (error) throw error;
      if (data && data.length > 0) {
        for (const row of data) {
          await supabase.from("lessons").update({ video_url: row.original_url }).eq("id", row.lesson_id);
        }
      }
      return jsonResponse({ success: true, message: `Reset ${data?.length || 0} completed migrations`, reset: data?.length || 0 });
    }

    // ACTION: Per-course stats
    if (action === "course-stats") {
      const allMigrations = await fetchAllPaginated("video_migrations", "status, course_id");
      const courseMap: Record<string, { total: number; pending: number; uploading: number; completed: number; failed: number }> = {};
      for (const m of allMigrations) {
        const cid = m.course_id || "unknown";
        if (!courseMap[cid]) courseMap[cid] = { total: 0, pending: 0, uploading: 0, completed: 0, failed: 0 };
        courseMap[cid].total++;
        if (courseMap[cid][m.status as keyof typeof courseMap[string]] !== undefined) {
          (courseMap[cid] as any)[m.status]++;
        }
      }
      return jsonResponse({ success: true, courseStats: courseMap });
    }

    // ACTION: Account info
    if (action === "account-info") {
      const res = await fetch(`${LULUSTREAM_API_BASE}/account/info?key=${LULUSTREAM_API_KEY}`);
      const data = await res.json();
      return jsonResponse({ success: true, account: data });
    }

    return jsonResponse({ success: false, error: "Invalid action" }, 400);
  } catch (error) {
    console.error("Error:", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 400);
  }
});

function extractFileId(url: string): string | null {
  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
