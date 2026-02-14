import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LULUSTREAM_API_BASE = "https://api.lulustream.com/api";

function delay(ms: number) { return new Promise(r => setTimeout(r, ms)); }

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LULUSTREAM_API_KEY_1 = Deno.env.get("LULUSTREAM_API_KEY");
    const LULUSTREAM_API_KEY_2 = Deno.env.get("LULUSTREAM_API_KEY_2");
    if (!LULUSTREAM_API_KEY_1 && !LULUSTREAM_API_KEY_2) throw new Error("No LULUSTREAM_API_KEY configured");
    
    // Build list of available API keys for rotation
    const apiKeys = [LULUSTREAM_API_KEY_1, LULUSTREAM_API_KEY_2].filter(Boolean) as string[];

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Helper: get a working API key (tries each key, skips rate-limited ones)
    async function getWorkingApiKey(): Promise<{ key: string; index: number } | null> {
      for (let i = 0; i < apiKeys.length; i++) {
        const key = apiKeys[i];
        // Check if this specific key is rate-limited
        const { data } = await supabase.from("site_settings")
          .select("value, updated_at")
          .eq("key", `lulustream_limit_key_${i}`)
          .maybeSingle();
        if (data?.value === "true") {
          const hitAt = new Date(data.updated_at || 0).getTime();
          const hoursSince = (Date.now() - hitAt) / (1000 * 60 * 60);
          if (hoursSince < 8) continue; // Still in cooldown
          // Cooldown expired, clear it
          await supabase.from("site_settings")
            .update({ value: "false", updated_at: new Date().toISOString() })
            .eq("key", `lulustream_limit_key_${i}`);
        }
        // Test this key with a lightweight call
        try {
          const res = await fetch(`${LULUSTREAM_API_BASE}/account/info?key=${key}`);
          const data = await res.json();
          if (data.status === 200) return { key, index: i };
          if (data.status === 403 || isDailyLimitError(data.msg || "")) {
            await markKeyLimited(i);
            continue;
          }
          return { key, index: i }; // Unknown status, try anyway
        } catch {
          continue;
        }
      }
      return null;
    }

    async function markKeyLimited(keyIndex: number) {
      const settingKey = `lulustream_limit_key_${keyIndex}`;
      const { data: existing } = await supabase.from("site_settings").select("id").eq("key", settingKey).maybeSingle();
      if (existing) {
        await supabase.from("site_settings").update({ value: "true", updated_at: new Date().toISOString() }).eq("key", settingKey);
      } else {
        await supabase.from("site_settings").insert({ key: settingKey, value: "true", description: `Rate limit tracker for LuluStream API key ${keyIndex}` });
      }
    }

    const { action, courseId, courseIds, batchSize: customBatchSize, fromCron } = await req.json();
    const filterCourseIds: string[] = courseIds?.length ? courseIds : courseId ? [courseId] : [];

    // If called from cron, check if cron is enabled
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

    // Helper: check daily limit cooldown (returns true if still in cooldown)
    async function isDailyLimitActive(): Promise<{ active: boolean; hoursLeft: number }> {
      const { data } = await supabase
        .from("site_settings")
        .select("value, updated_at")
        .eq("key", "lulustream_daily_limit_hit")
        .maybeSingle();
      if (data?.value === "true") {
        const hitAt = new Date(data.updated_at || 0).getTime();
        const hoursSince = (Date.now() - hitAt) / (1000 * 60 * 60);
        if (hoursSince < 8) {
          return { active: true, hoursLeft: Math.ceil(8 - hoursSince) };
        }
        // Cooldown expired, clear it
        await supabase.from("site_settings")
          .update({ value: "false", updated_at: new Date().toISOString() })
          .eq("key", "lulustream_daily_limit_hit");
      }
      return { active: false, hoursLeft: 0 };
    }

    // Helper: set daily limit flag
    async function setDailyLimitHit() {
      const { data: existing } = await supabase.from("site_settings").select("id").eq("key", "lulustream_daily_limit_hit").maybeSingle();
      if (existing) {
        await supabase.from("site_settings").update({ value: "true", updated_at: new Date().toISOString() }).eq("key", "lulustream_daily_limit_hit");
      } else {
        await supabase.from("site_settings").insert({ key: "lulustream_daily_limit_hit", value: "true", description: "Tracks when LuluStream daily API limit was hit" });
      }
    }

    // Helper: detect if error is daily limit
    function isDailyLimitError(msg: string): boolean {
      const lower = msg.toLowerCase();
      return lower.includes("5000") || lower.includes("requests limit") || lower.includes("per day");
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

    // =====================================================
    // ACTION: Status (NO LuluStream API calls — DB only)
    // =====================================================
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
      // Return key status info
      const keyStatuses: any[] = [];
      for (let i = 0; i < apiKeys.length; i++) {
        const { data: ks } = await supabase.from("site_settings").select("value, updated_at").eq("key", `lulustream_limit_key_${i}`).maybeSingle();
        const limited = ks?.value === "true";
        const hoursLeft = limited ? Math.max(0, 8 - (Date.now() - new Date(ks?.updated_at || 0).getTime()) / 3600000) : 0;
        keyStatuses.push({ index: i, limited, hoursLeft: Math.ceil(hoursLeft) });
      }
      return jsonResponse({ success: true, counts, keyStatuses, totalKeys: apiKeys.length });
    }

    // =====================================================
    // ACTION: Sync (NO LuluStream API calls — DB only)
    // =====================================================
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

    // =====================================================
    // ACTION: Migrate — DIRECT UPLOAD (streams Drive → Edge → LuluStream)
    // This is the primary migration method. Each video uses ~2 API calls.
    // No separate check-progress needed — files complete instantly.
    // =====================================================
    if (action === "migrate") {
      // Find a working API key (rotates through all keys, skips rate-limited ones)
      const workingKey = await getWorkingApiKey();
      if (!workingKey) {
        return jsonResponse({ 
          success: true, 
          message: `All ${apiKeys.length} API keys are rate-limited. Auto-retry when a key resets.`,
          processed: 0, allKeysLimited: true, totalKeys: apiKeys.length
        });
      }

      const ACTIVE_KEY = workingKey.key;
      const keyLabel = `Key #${workingKey.index + 1}`;

      // Get upload server URL (1 API call)
      let uploadServerUrl = "";
      try {
        const serverRes = await fetch(`${LULUSTREAM_API_BASE}/upload/server?key=${ACTIVE_KEY}`);
        const serverData = await serverRes.json();
        if (serverData.status === 200 && serverData.result) {
          uploadServerUrl = serverData.result;
        } else if (isDailyLimitError(serverData.msg || "")) {
          await markKeyLimited(workingKey.index);
          // Try the next key recursively by re-calling
          return jsonResponse({ success: true, message: `${keyLabel} hit limit. Will try next key on next run.`, processed: 0, keyLimited: keyLabel });
        } else {
          throw new Error(`Upload server error: ${serverData.msg || JSON.stringify(serverData)}`);
        }
      } catch (err: any) {
        if (isDailyLimitError(err.message)) {
          await markKeyLimited(workingKey.index);
          return jsonResponse({ success: true, message: `${keyLabel} hit limit.`, processed: 0, keyLimited: keyLabel });
        }
        throw err;
      }

      // Auto-prepare: find Drive lessons without migration records
      const batchSize = Math.min(customBatchSize || 3, 5); // Small batches — each upload takes time (downloading + uploading full video)
      
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
        return jsonResponse({ success: true, message: "No pending migrations", processed: 0 });
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

      for (const migration of pending) {
        try {
          const fileId = extractFileId(migration.original_url);
          if (!fileId) throw new Error("Could not extract file ID");

          // Mark as uploading
          await supabase.from("video_migrations")
            .update({ status: "uploading", updated_at: new Date().toISOString() })
            .eq("id", migration.id);

          // Use remote URL upload — LuluStream's servers download from Drive (avoids our Drive quota)
          const downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download&confirm=t`;
          const courseTitle = migration.course_id ? courseTitleMap[migration.course_id] || "" : "";
          const organizedTitle = courseTitle ? `[${courseTitle}] ${fileId}` : fileId;

          const uploadRes = await fetch(
            `${LULUSTREAM_API_BASE}/upload/url?key=${ACTIVE_KEY}&url=${encodeURIComponent(downloadUrl)}&new_title=${encodeURIComponent(organizedTitle)}`
          );
          const uploadData = await uploadRes.json();
          console.log(`Upload response for ${fileId}:`, JSON.stringify(uploadData).substring(0, 300));

          if (uploadData.status === 200 && uploadData.result) {
            const fileCode = uploadData.result.filecode || uploadData.result.file_code || "";
            await supabase.from("video_migrations")
              .update({ status: "uploading", lulustream_file_code: fileCode, updated_at: new Date().toISOString() })
              .eq("id", migration.id);
            processed++;
          } else {
            const errMsg = uploadData.msg || JSON.stringify(uploadData);
            if (isDailyLimitError(errMsg)) {
              await markKeyLimited(workingKey.index);
              await supabase.from("video_migrations")
                .update({ status: "pending", updated_at: new Date().toISOString() })
                .eq("id", migration.id);
              return jsonResponse({ 
                success: true, 
                message: `${keyLabel} hit limit after ${processed} uploads. Will try next key on next run.`, 
                processed, failed, keyLimited: keyLabel 
              });
            }
            // "Already in upload queue" means LuluStream is already processing it — treat as uploading, not failed
            if (errMsg.toLowerCase().includes("already in upload queue")) {
              await supabase.from("video_migrations")
                .update({ status: "uploading", updated_at: new Date().toISOString() })
                .eq("id", migration.id);
              processed++;
              continue;
            }
            throw new Error(errMsg);
          }
        } catch (err: any) {
          if (isDailyLimitError(err.message)) {
            await markKeyLimited(workingKey.index);
            await supabase.from("video_migrations")
              .update({ status: "pending", updated_at: new Date().toISOString() })
              .eq("id", migration.id);
            return jsonResponse({ 
              success: true, 
              message: `${keyLabel} hit limit after ${processed} uploads.`, 
              processed, failed, keyLimited: keyLabel 
            });
          }
          await supabase.from("video_migrations")
            .update({ status: "failed", error_message: err.message, updated_at: new Date().toISOString() })
            .eq("id", migration.id);
          failed++;
          if (errors.length < 5) errors.push(err.message);
        }
      }

      return jsonResponse({ 
        success: true, 
        message: `Direct upload: ${processed} completed, ${failed} failed`, 
        processed, failed, 
        errors: errors.length > 0 ? errors : undefined 
      });
    }

    // =====================================================
    // ACTION: Check progress — for legacy remote uploads still in "uploading" state
    // Also respects daily limit to avoid wasting API calls
    // =====================================================
    if (action === "check-progress") {
      // Check daily limit first
      const limitCheck = await isDailyLimitActive();
      
      // Auto-reset uploads stuck for more than 30 minutes (back to pending for direct upload)
      await supabase.from("video_migrations")
        .update({ status: "pending", lulustream_file_code: null, error_message: "Auto-reset: stuck >30min", updated_at: new Date().toISOString() })
        .eq("status", "uploading")
        .lt("updated_at", new Date(Date.now() - 30 * 60 * 1000).toISOString());

      const { data: uploading } = await supabase
        .from("video_migrations")
        .select("id, lesson_id, lulustream_file_code, updated_at")
        .eq("status", "uploading")
        .limit(30);

      if (!uploading || uploading.length === 0) {
        return jsonResponse({ success: true, message: "No uploads in progress", checked: 0 });
      }

      // Find a working key for API calls
      const workingKey = await getWorkingApiKey();
      if (!workingKey) {
        return jsonResponse({ 
          success: true, 
          message: `All API keys rate-limited. ${uploading.length} uploads pending check.`,
          checked: 0, allKeysLimited: true 
        });
      }

      // 1 API call: get the remote upload queue status
      const statusRes = await fetch(`${LULUSTREAM_API_BASE}/urlupload/list?key=${workingKey.key}`);
      const statusData = await statusRes.json();

      if (isDailyLimitError(statusData.msg || "")) {
        await markKeyLimited(workingKey.index);
        return jsonResponse({ success: true, message: "Key hit limit during check.", checked: 0 });
      }

      let completed = 0, stillUploading = 0;

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
          }
        }
      }

      return jsonResponse({ success: true, checked: uploading.length, completed, stillUploading });
    }

    // =====================================================
    // ACTION: Retry failed (DB only — no API calls)
    // =====================================================
    if (action === "retry-failed") {
      let query = supabase.from("video_migrations")
        .update({ status: "pending", error_message: null, updated_at: new Date().toISOString() })
        .eq("status", "failed");
      if (filterCourseIds.length > 0) query = query.in("course_id", filterCourseIds);
      const { error } = await query;
      if (error) throw error;
      return jsonResponse({ success: true, message: "Failed migrations reset to pending" });
    }

    // =====================================================
    // ACTION: Reset completed (DB only)
    // =====================================================
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

    // =====================================================
    // ACTION: Per-course stats (DB only — no API calls)
    // =====================================================
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

    // =====================================================
    // ACTION: Account info — shows status of ALL keys
    // =====================================================
    if (action === "account-info") {
      const results: any[] = [];
      for (let i = 0; i < apiKeys.length; i++) {
        try {
          const res = await fetch(`${LULUSTREAM_API_BASE}/account/info?key=${apiKeys[i]}`);
          const data = await res.json();
          results.push({ keyIndex: i, label: `Key #${i + 1}`, ...data });
        } catch (err: any) {
          results.push({ keyIndex: i, label: `Key #${i + 1}`, error: err.message });
        }
      }
      return jsonResponse({ success: true, accounts: results, totalKeys: apiKeys.length });
    }

    // =====================================================
    // ACTION: Clear all key cooldowns manually
    // =====================================================
    if (action === "clear-cooldown") {
      for (let i = 0; i < apiKeys.length; i++) {
        await supabase.from("site_settings")
          .update({ value: "false", updated_at: new Date().toISOString() })
          .eq("key", `lulustream_limit_key_${i}`);
      }
      await supabase.from("site_settings")
        .update({ value: "false", updated_at: new Date().toISOString() })
        .eq("key", "lulustream_daily_limit_hit");
      return jsonResponse({ success: true, message: `Cleared cooldown for ${apiKeys.length} keys` });
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
