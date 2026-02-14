import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LULUSTREAM_API_BASE = "https://api.lulustream.com/api";

// Rate-limit safe delay
function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

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

    const { action, courseId, courseIds, batchSize: customBatchSize, fromCron } = await req.json();
    const filterCourseIds: string[] = courseIds?.length ? courseIds : courseId ? [courseId] : [];

    // If called from cron, check if cron is enabled in site_settings
    if (fromCron) {
      const { data: setting } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "lulustream_cron_enabled")
        .maybeSingle();
      if (setting?.value !== "true") {
        return jsonResponse({ success: true, message: "Cron disabled by admin", skipped: true });
      }
    }

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

    // ACTION: Status
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

    // ACTION: Sync
    if (action === "sync") {
      const allMigrations = await fetchAllPaginated("video_migrations", "id, lesson_id, created_at");
      const seen = new Map<string, { id: string; created_at: string }>();
      const dupeIds: string[] = [];
      for (const m of allMigrations) {
        const existing = seen.get(m.lesson_id);
        if (existing) {
          if (m.created_at > existing.created_at) { dupeIds.push(existing.id); seen.set(m.lesson_id, m); }
          else { dupeIds.push(m.id); }
        } else { seen.set(m.lesson_id, m); }
      }
      for (let i = 0; i < dupeIds.length; i += 500) {
        await supabase.from("video_migrations").delete().in("id", dupeIds.slice(i, i + 500));
      }

      const allLessonIds = await fetchAllPaginated("lessons", "id, video_url");
      const driveLesonIds = new Set(allLessonIds.filter(l => l.video_url?.includes("drive.google.com")).map(l => l.id));
      const luluLessonIds = new Set(allLessonIds.filter(l => l.video_url?.includes("lulustream.com")).map(l => l.id));
      
      const remainingMigrations = await fetchAllPaginated("video_migrations", "id, lesson_id, status");
      const orphanIds: string[] = [];
      const alreadyDoneIds: string[] = [];
      
      for (const m of remainingMigrations) {
        if (luluLessonIds.has(m.lesson_id) && m.status !== "completed") { alreadyDoneIds.push(m.id); }
        else if (!driveLesonIds.has(m.lesson_id) && !luluLessonIds.has(m.lesson_id)) { orphanIds.push(m.id); }
      }

      for (let i = 0; i < orphanIds.length; i += 500) {
        await supabase.from("video_migrations").delete().in("id", orphanIds.slice(i, i + 500));
      }
      for (let i = 0; i < alreadyDoneIds.length; i += 500) {
        await supabase.from("video_migrations").update({ status: "completed" }).in("id", alreadyDoneIds.slice(i, i + 500));
      }

      const trackedLessonIds = new Set(remainingMigrations.map(m => m.lesson_id));
      const missingLessons = allLessonIds.filter(l => 
        l.video_url?.includes("drive.google.com") && !trackedLessonIds.has(l.id)
      );

      if (missingLessons.length > 0) {
        const missingIds = missingLessons.map(l => l.id);
        const lessonDetails: any[] = [];
        for (let i = 0; i < missingIds.length; i += 500) {
          const { data } = await supabase.from("lessons")
            .select("id, video_url, modules!inner(course_id)")
            .in("id", missingIds.slice(i, i + 500));
          if (data) lessonDetails.push(...data);
        }
        const newRecords = lessonDetails.map(l => ({
          lesson_id: l.id, course_id: (l as any).modules?.course_id || null,
          original_url: l.video_url!, status: "pending",
        }));
        for (let i = 0; i < newRecords.length; i += 500) {
          await supabase.from("video_migrations").insert(newRecords.slice(i, i + 500));
        }
      }

      return jsonResponse({
        success: true,
        message: `Sync: ${dupeIds.length} dupes, ${orphanIds.length} orphans, ${alreadyDoneIds.length} done, ${missingLessons.length} added`,
        duplicatesRemoved: dupeIds.length, orphansRemoved: orphanIds.length,
        alreadyDone: alreadyDoneIds.length, missingAdded: missingLessons.length,
      });
    }

    // ACTION: Migrate — sends batch to LuluStream remote upload
    if (action === "migrate") {
      // Check if we're in a daily-limit cooldown
      const { data: cooldownSetting } = await supabase
        .from("site_settings")
        .select("value, updated_at")
        .eq("key", "lulustream_daily_limit_hit")
        .maybeSingle();
      
      if (cooldownSetting?.value === "true") {
        const hitAt = new Date(cooldownSetting.updated_at || 0).getTime();
        const hoursSince = (Date.now() - hitAt) / (1000 * 60 * 60);
        if (hoursSince < 6) {
          return jsonResponse({ 
            success: true, 
            message: `Daily API limit reached. Auto-retry in ${Math.ceil(6 - hoursSince)}h. Last hit: ${new Date(hitAt).toISOString()}`,
            processed: 0, dailyLimitCooldown: true, cooldownHoursLeft: Math.ceil(6 - hoursSince)
          });
        } else {
          // Cooldown expired, clear it
          await supabase.from("site_settings")
            .update({ value: "false", updated_at: new Date().toISOString() })
            .eq("key", "lulustream_daily_limit_hit");
        }
      }

      // Check LuluStream remote queue capacity FIRST
      let queueSize = 0;
      try {
        const queueRes = await fetch(`${LULUSTREAM_API_BASE}/urlupload/list?key=${LULUSTREAM_API_KEY}`);
        const queueData = await queueRes.json();
        if (queueData.status === 200 && Array.isArray(queueData.result)) {
          queueSize = queueData.result.length;
        }
      } catch {}

      const MAX_QUEUE = 100;
      const availableSlots = Math.max(0, MAX_QUEUE - queueSize);

      if (availableSlots === 0) {
        const { count: uploadingCount } = await supabase
          .from("video_migrations")
          .select("id", { count: "exact", head: true })
          .eq("status", "uploading");
        return jsonResponse({ 
          success: true, 
          message: `Queue full (${queueSize}/${MAX_QUEUE}). Waiting for uploads to finish before sending more.`,
          processed: 0, queueSize, currentUploading: uploadingCount || 0, availableSlots: 0
        });
      }

      const { count: uploadingCount } = await supabase
        .from("video_migrations")
        .select("id", { count: "exact", head: true })
        .eq("status", "uploading");
      const currentUploading = uploadingCount || 0;

      // Auto-reset ONLY queue/retry-safe failures — NOT daily limit errors
      await supabase.from("video_migrations")
        .update({ status: "pending", error_message: null, updated_at: new Date().toISOString() })
        .eq("status", "failed")
        .or("error_message.ilike.%queue%,error_message.ilike.%already%,error_message.ilike.%stuck%,error_message.ilike.%auto-reset%");

      const batchSize = Math.min(customBatchSize || 50, availableSlots);

      // Auto-prepare: find Drive lessons without migration records
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
        const { data: existing } = await supabase.from("video_migrations").select("lesson_id").in("lesson_id", lessonIds);
        const existingSet = new Set(existing?.map(e => e.lesson_id) || []);
        const newRecords = driveLessons.filter(l => !existingSet.has(l.id)).map(l => ({
          lesson_id: l.id, course_id: (l as any).modules?.course_id || null,
          original_url: l.video_url!, status: "pending",
        }));
        if (newRecords.length > 0) {
          await supabase.from("video_migrations").insert(newRecords);
        }
      }

      // Fetch pending
      let query = supabase.from("video_migrations")
        .select("id, lesson_id, original_url, course_id")
        .eq("status", "pending").limit(batchSize);
      if (filterCourseIds.length > 0) query = query.in("course_id", filterCourseIds);
      const { data: pending, error: pendingError } = await query;
      if (pendingError) throw pendingError;

      if (!pending || pending.length === 0) {
        return jsonResponse({ success: true, message: "No pending migrations", processed: 0, queueSize, availableSlots });
      }

      // Get course titles
      const uniqueCourseIds = [...new Set(pending.map(p => p.course_id).filter(Boolean))];
      let courseTitleMap: Record<string, string> = {};
      if (uniqueCourseIds.length > 0) {
        const { data: courses } = await supabase.from("courses").select("id, title").in("id", uniqueCourseIds);
        courses?.forEach(c => { courseTitleMap[c.id] = c.title; });
      }

      let processed = 0, failed = 0;
      const errors: string[] = [];
      let dailyLimitHit = false;
      
      for (const migration of pending) {
        if (dailyLimitHit) break; // Stop immediately if daily limit detected
        
        try {
          const fileId = extractFileId(migration.original_url);
          if (!fileId) throw new Error("Could not extract file ID");

          const downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download&confirm=t`;
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
            processed++;
          } else {
            const errMsg = uploadData.msg || JSON.stringify(uploadData);
            
            // Detect daily limit hit
            if (errMsg.toLowerCase().includes("5000") || errMsg.toLowerCase().includes("requests limit") || errMsg.toLowerCase().includes("per day")) {
              dailyLimitHit = true;
              // Set cooldown flag in site_settings
              const { data: existing } = await supabase.from("site_settings").select("id").eq("key", "lulustream_daily_limit_hit").maybeSingle();
              if (existing) {
                await supabase.from("site_settings").update({ value: "true", updated_at: new Date().toISOString() }).eq("key", "lulustream_daily_limit_hit");
              } else {
                await supabase.from("site_settings").insert({ key: "lulustream_daily_limit_hit", value: "true", description: "Tracks when LuluStream daily API limit was hit" });
              }
              // Don't mark this video as failed — leave it pending for retry after cooldown
              if (errors.length < 3) errors.push("Daily API limit reached (5000/day). Will auto-retry in ~6 hours.");
              break;
            }
            
            throw new Error(errMsg);
          }
        } catch (err: any) {
          if (!dailyLimitHit) {
            await supabase.from("video_migrations")
              .update({ status: "failed", error_message: err.message, updated_at: new Date().toISOString() })
              .eq("id", migration.id);
            failed++;
            if (errors.length < 3) errors.push(err.message);
          }
        }
        if (!dailyLimitHit) await delay(500);
      }

      return jsonResponse({ 
        success: true, 
        message: dailyLimitHit 
          ? `Daily limit hit after ${processed} sent. Auto-retry in ~6h.` 
          : `Sent ${processed}, failed ${failed}`, 
        processed, failed, currentUploading, queueSize, availableSlots, dailyLimitHit,
        errors: errors.length > 0 ? errors : undefined 
      });
    }

    // ACTION: Check remote upload status — RATE-LIMIT SAFE: checks max 20 files per run
    if (action === "check-progress") {
      // Auto-reset uploads stuck for more than 20 minutes
      await supabase.from("video_migrations")
        .update({ status: "pending", lulustream_file_code: null, error_message: "Auto-reset: stuck >20min", updated_at: new Date().toISOString() })
        .eq("status", "uploading")
        .lt("updated_at", new Date(Date.now() - 20 * 60 * 1000).toISOString());

      const { data: uploading } = await supabase
        .from("video_migrations")
        .select("id, lesson_id, lulustream_file_code, updated_at")
        .eq("status", "uploading")
        .limit(30);

      if (!uploading || uploading.length === 0) {
        return jsonResponse({ success: true, message: "No uploads in progress", checked: 0 });
      }

      // 1 API call: get the remote upload queue status
      const statusRes = await fetch(`${LULUSTREAM_API_BASE}/urlupload/list?key=${LULUSTREAM_API_KEY}`);
      const statusData = await statusRes.json();

      let completed = 0, stillUploading = 0, apiCallsUsed = 1;
      const checkedIds = new Set<string>();

      if (statusData.status === 200 && statusData.result) {
        for (const migration of uploading) {
          const match = statusData.result.find((r: any) =>
            r.filecode === migration.lulustream_file_code || r.file_code === migration.lulustream_file_code
          );
          if (match) {
            if (match.status === "completed" || (match.status === "working" && match.bytes_loaded === match.bytes_total && match.bytes_total > 0)) {
              const embedUrl = `https://lulustream.com/e/${migration.lulustream_file_code}`;
              await supabase.from("video_migrations")
                .update({ status: "completed", lulustream_embed_url: embedUrl, updated_at: new Date().toISOString() })
                .eq("id", migration.id);
              await supabase.from("lessons").update({ video_url: embedUrl }).eq("id", migration.lesson_id);
              completed++;
            } else {
              stillUploading++;
            }
            checkedIds.add(migration.id);
          }
        }
      }

      // For unchecked files, use file/info API — but limit to 20 calls max to respect rate limit
      const unchecked = uploading.filter(m => !checkedIds.has(m.id) && m.lulustream_file_code);
      const maxFileInfoChecks = Math.min(unchecked.length, 10);
      
      for (let i = 0; i < maxFileInfoChecks; i++) {
        const migration = unchecked[i];
        try {
          const fileRes = await fetch(`${LULUSTREAM_API_BASE}/file/info?key=${LULUSTREAM_API_KEY}&file_code=${migration.lulustream_file_code}`);
          const fileData = await fileRes.json();
          apiCallsUsed++;
          
          if (fileData.status === 200 && fileData.result?.[0]?.status === 200) {
            const embedUrl = `https://lulustream.com/e/${migration.lulustream_file_code}`;
            await supabase.from("video_migrations")
              .update({ status: "completed", lulustream_embed_url: embedUrl, updated_at: new Date().toISOString() })
              .eq("id", migration.id);
            await supabase.from("lessons").update({ video_url: embedUrl }).eq("id", migration.lesson_id);
            completed++;
            stillUploading = Math.max(0, stillUploading - 1);
          } else {
            stillUploading++;
          }
          // 1.5s delay between file info calls
          await delay(1500);
        } catch { stillUploading++; }
      }

      const totalUploading = uploading.length;
      return jsonResponse({ 
        success: true, checked: totalUploading, completed, stillUploading, 
        uncheckedRemaining: unchecked.length - maxFileInfoChecks, apiCallsUsed 
      });
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

    // ACTION: Reset completed
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
      return jsonResponse({ success: true, message: `Reset ${data?.length || 0} completed`, reset: data?.length || 0 });
    }

    // ACTION: Per-course stats
    if (action === "course-stats") {
      const allMigrations = await fetchAllPaginated("video_migrations", "status, course_id");
      const courseMap: Record<string, any> = {};
      for (const m of allMigrations) {
        const cid = m.course_id || "unknown";
        if (!courseMap[cid]) courseMap[cid] = { total: 0, pending: 0, uploading: 0, completed: 0, failed: 0 };
        courseMap[cid].total++;
        if (courseMap[cid][m.status] !== undefined) courseMap[cid][m.status]++;
      }
      return jsonResponse({ success: true, courseStats: courseMap });
    }

    // ACTION: Clear LuluStream remote upload queue
    if (action === "clear-queue") {
      // Get the remote upload list
      const listRes = await fetch(`${LULUSTREAM_API_BASE}/urlupload/list?key=${LULUSTREAM_API_KEY}`);
      const listData = await listRes.json();
      let removed = 0;
      
      if (listData.status === 200 && listData.result && Array.isArray(listData.result)) {
        for (const item of listData.result) {
          const fileCode = item.filecode || item.file_code;
          if (fileCode) {
            try {
              // Try to remove from queue
              await fetch(`${LULUSTREAM_API_BASE}/urlupload/remove?key=${LULUSTREAM_API_KEY}&file_code=${fileCode}`);
              removed++;
              await delay(500);
            } catch {}
          }
        }
      }
      
      return jsonResponse({ success: true, message: `Cleared ${removed} items from LuluStream queue`, removed, queueItems: listData.result?.length || 0 });
    }

    // ACTION: Account info
    if (action === "account-info") {
      const res = await fetch(`${LULUSTREAM_API_BASE}/account/info?key=${LULUSTREAM_API_KEY}`);
      const data = await res.json();
      return jsonResponse({ success: true, account: data });
    }

    // ACTION: Test single upload — actually submits to LuluStream and shows result
    if (action === "test-upload") {
      const { data: testItem } = await supabase.from("video_migrations")
        .select("id, lesson_id, original_url, course_id")
        .eq("status", "pending")
        .limit(1)
        .maybeSingle();
      
      if (!testItem) return jsonResponse({ success: false, error: "No pending items" });
      
      const fileId = extractFileId(testItem.original_url);
      if (!fileId) return jsonResponse({ success: false, error: "Could not extract file ID", url: testItem.original_url });

      const downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download&confirm=t`;
      
      // Actually submit to LuluStream
      const uploadUrl = `${LULUSTREAM_API_BASE}/upload/url?key=${LULUSTREAM_API_KEY}&url=${encodeURIComponent(downloadUrl)}&new_title=${encodeURIComponent(`TEST_${fileId}`)}`;
      const uploadRes = await fetch(uploadUrl);
      const uploadData = await uploadRes.json();
      
      let fileCode = "";
      if (uploadData.status === 200 && uploadData.result) {
        fileCode = uploadData.result.filecode || uploadData.result.file_code || "";
        // Mark as uploading
        await supabase.from("video_migrations")
          .update({ status: "uploading", lulustream_file_code: fileCode, updated_at: new Date().toISOString() })
          .eq("id", testItem.id);
      }

      // Check remote upload queue status
      await delay(3000);
      const queueRes = await fetch(`${LULUSTREAM_API_BASE}/urlupload/list?key=${LULUSTREAM_API_KEY}`);
      const queueData = await queueRes.json();

      return jsonResponse({ 
        success: true, fileId, downloadUrl,
        luluResponse: uploadData,
        fileCode,
        queueAfter3s: queueData,
        migrationId: testItem.id,
      });
    }

    return jsonResponse({ success: false, error: "Invalid action" }, 400);
  } catch (error) {
    console.error("Error:", error);
    return jsonResponse({ success: false, error: error instanceof Error ? error.message : "Unknown error" }, 400);
  }
});

function extractFileId(url: string): string | null {
  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
