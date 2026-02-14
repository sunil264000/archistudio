import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Cloud, Play, RefreshCw, Loader2, CheckCircle, XCircle, AlertTriangle, FolderOpen, Zap, DatabaseZap } from "lucide-react";

interface MigrationStats {
  total: number;
  pending: number;
  uploading: number;
  completed: number;
  failed: number;
}

export function LuluStreamMigration() {
  const [stats, setStats] = useState<MigrationStats>({ total: 0, pending: 0, uploading: 0, completed: 0, failed: 0 });
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoMigrate, setAutoMigrate] = useState(false);
  const [batchSize, setBatchSize] = useState(10);
  const [courseStats, setCourseStats] = useState<Record<string, MigrationStats>>({});

  const courseIdsParam = selectedCourses.length > 0 ? selectedCourses : undefined;

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke("migrate-to-lulustream", {
        body: { action: "status", courseIds: courseIdsParam },
      });
      if (data?.success) setStats(data.counts);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, [courseIdsParam]);

  const fetchCourseStats = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke("migrate-to-lulustream", {
        body: { action: "course-stats" },
      });
      if (data?.success) setCourseStats(data.courseStats);
    } catch (err) {
      console.error("Failed to fetch course stats:", err);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    const { data } = await supabase.from("courses").select("id, title").order("title");
    if (data) setCourses(data);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCourses();
    fetchCourseStats();
  }, [fetchStats, fetchCourses, fetchCourseStats]);

  useEffect(() => {
    fetchStats();
  }, [selectedCourses, fetchStats]);

  // Auto-migration loop
  useEffect(() => {
    if (!autoMigrate) return;
    const interval = setInterval(async () => {
      if (stats.pending > 0) {
        try {
          await supabase.functions.invoke("migrate-to-lulustream", {
            body: { action: "migrate", courseIds: courseIdsParam, batchSize },
          });
        } catch (err) { console.error("Auto-migrate error:", err); }
      }
      if (stats.uploading > 0) {
        try {
          await supabase.functions.invoke("migrate-to-lulustream", {
            body: { action: "check-progress" },
          });
        } catch (err) { console.error("Auto-check error:", err); }
      }
      await fetchStats();
      if (stats.pending === 0 && stats.uploading === 0) {
        setAutoMigrate(false);
        toast.success("Migration complete! All videos have been processed.");
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [autoMigrate, stats, courseIdsParam, batchSize, fetchStats]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("migrate-to-lulustream", {
        body: { action: "sync" },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(data.message);
        await fetchStats();
        await fetchCourseStats();
      } else {
        throw new Error(data?.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Sync failed");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMigrateBatch = async () => {
    setIsMigrating(true);
    try {
      const { data, error } = await supabase.functions.invoke("migrate-to-lulustream", {
        body: { action: "migrate", courseIds: courseIdsParam, batchSize },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(data.message);
        await fetchStats();
      } else {
        throw new Error(data?.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Migration batch failed");
    } finally {
      setIsMigrating(false);
    }
  };

  const handleCheckProgress = async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke("migrate-to-lulustream", {
        body: { action: "check-progress" },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(`Checked ${data.checked}: ${data.completed} completed, ${data.stillUploading} still uploading`);
        await fetchStats();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to check progress");
    } finally {
      setIsChecking(false);
    }
  };

  const handleRetryFailed = async () => {
    setIsRetrying(true);
    try {
      const { data, error } = await supabase.functions.invoke("migrate-to-lulustream", {
        body: { action: "retry-failed", courseIds: courseIdsParam },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success("Failed migrations reset to pending");
        await fetchStats();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to retry");
    } finally {
      setIsRetrying(false);
    }
  };

  const handleResetCompleted = async () => {
    setIsResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke("migrate-to-lulustream", {
        body: { action: "reset-completed", courseIds: courseIdsParam },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(data.message);
        await fetchStats();
        await fetchCourseStats();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reset");
    } finally {
      setIsResetting(false);
    }
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourses(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  const selectAllCourses = () => {
    setSelectedCourses(prev => prev.length === courses.length ? [] : courses.map(c => c.id));
  };

  const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            LuluStream Video Migration
          </CardTitle>
          <CardDescription>
            Migrate videos from Google Drive to LuluStream. No preparation needed — just click migrate and it auto-detects &amp; uploads.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatBadge label="Total" count={stats.total} variant="secondary" />
            <StatBadge label="Pending" count={stats.pending} variant="outline" />
            <StatBadge label="Uploading" count={stats.uploading} variant="default" />
            <StatBadge label="Completed" count={stats.completed} variant="secondary" icon={<CheckCircle className="h-3 w-3 text-green-500" />} />
            <StatBadge label="Failed" count={stats.failed} variant="destructive" icon={<XCircle className="h-3 w-3" />} />
          </div>

          {stats.total > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Migration Progress</span>
                <span>{stats.completed}/{stats.total} ({progressPercent}%)</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
          )}

          {autoMigrate && (
            <div className="p-3 bg-primary/10 rounded-md text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <div>
                <strong>Auto-migration running.</strong> Sending batches of {batchSize} every 12 seconds.
                Lesson URLs are automatically updated once LuluStream finishes processing.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderOpen className="h-4 w-4" />
            Select Courses to Migrate
          </CardTitle>
          <CardDescription>
            Choose specific courses or leave empty to process everything.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={selectAllCourses}>
              {selectedCourses.length === courses.length ? "Deselect All" : "Select All"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {selectedCourses.length === 0
                ? "All courses (no filter)"
                : `${selectedCourses.length} course${selectedCourses.length > 1 ? "s" : ""} selected`}
            </span>
            {selectedCourses.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedCourses([])}>Clear</Button>
            )}
          </div>
          <ScrollArea className="h-[240px] border rounded-md p-3">
            <div className="space-y-2">
              {courses.map(course => {
                const cs = courseStats[course.id];
                return (
                  <label key={course.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors">
                    <Checkbox checked={selectedCourses.includes(course.id)} onCheckedChange={() => toggleCourse(course.id)} />
                    <span className="flex-1 text-sm truncate">{course.title}</span>
                    {cs ? (
                      <div className="flex items-center gap-1.5 text-xs shrink-0">
                        {cs.completed > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">✅ {cs.completed}</Badge>}
                        {cs.pending > 0 && <Badge variant="outline" className="text-[10px] px-1.5 py-0">⏳ {cs.pending}</Badge>}
                        {cs.uploading > 0 && <Badge variant="default" className="text-[10px] px-1.5 py-0">⬆ {cs.uploading}</Badge>}
                        {cs.failed > 0 && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">❌ {cs.failed}</Badge>}
                        {!cs.total && <span className="text-muted-foreground">No videos</span>}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">No data</span>
                    )}
                  </label>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Migration Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Batch size */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium">Batch Size:</span>
            {[10, 20, 30, 50].map(size => (
              <Button key={size} variant={batchSize === size ? "default" : "outline"} size="sm" onClick={() => setBatchSize(size)}>
                {size}
              </Button>
            ))}
          </div>

          {/* Main actions — no more prepare step */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSync} disabled={isSyncing} variant="outline">
              {isSyncing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DatabaseZap className="mr-2 h-4 w-4" />}
              {isSyncing ? "Syncing..." : "Sync & Clean Data"}
            </Button>

            <Button onClick={handleMigrateBatch} disabled={isMigrating} variant="outline">
              {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              {isMigrating ? "Sending..." : `Migrate Batch (${batchSize})`}
            </Button>

            <Button onClick={handleCheckProgress} disabled={isChecking || stats.uploading === 0} variant="outline">
              {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              {isChecking ? "Checking..." : "Check Progress"}
            </Button>

            <Button
              onClick={() => setAutoMigrate(!autoMigrate)}
              variant={autoMigrate ? "destructive" : "default"}
            >
              {autoMigrate ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Stop Auto-Migrate</>
              ) : (
                <><Play className="mr-2 h-4 w-4" />Auto-Migrate All</>
              )}
            </Button>
          </div>

          {/* Secondary actions */}
          <div className="flex flex-wrap gap-3">
            {stats.failed > 0 && (
              <Button onClick={handleRetryFailed} disabled={isRetrying} variant="outline" size="sm">
                {isRetrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
                Retry Failed ({stats.failed})
              </Button>
            )}
            {stats.completed > 0 && (
              <Button onClick={handleResetCompleted} disabled={isResetting} variant="destructive" size="sm">
                {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Reset Completed ({stats.completed}) — Re-upload
              </Button>
            )}
            <Button onClick={() => { fetchStats(); fetchCourseStats(); }} variant="ghost" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBadge({ label, count, variant, icon }: { label: string; count: number; variant: any; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 p-3 border rounded-md">
      {icon}
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-bold">{count}</p>
      </div>
    </div>
  );
}
