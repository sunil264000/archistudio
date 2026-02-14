import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Cloud, Play, RefreshCw, Loader2, CheckCircle, XCircle, Upload, AlertTriangle } from "lucide-react";

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
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [isPreparing, setIsPreparing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [autoMigrate, setAutoMigrate] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await supabase.functions.invoke("migrate-to-lulustream", {
        body: { action: "status" },
      });
      if (data?.success) setStats(data.counts);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    const { data } = await supabase.from("courses").select("id, title").order("title");
    if (data) setCourses(data);
  }, []);

  useEffect(() => {
    fetchStats();
    fetchCourses();
  }, [fetchStats, fetchCourses]);

  // Auto-migration loop
  useEffect(() => {
    if (!autoMigrate) return;

    const interval = setInterval(async () => {
      // Send batch for migration
      if (stats.pending > 0) {
        try {
          const { data } = await supabase.functions.invoke("migrate-to-lulustream", {
            body: { action: "migrate", courseId: selectedCourse === "all" ? undefined : selectedCourse },
          });
          if (data?.success) {
            console.log(`Auto-migrate batch: ${data.message}`);
          }
        } catch (err) {
          console.error("Auto-migrate error:", err);
        }
      }

      // Check progress of uploads
      if (stats.uploading > 0) {
        try {
          await supabase.functions.invoke("migrate-to-lulustream", {
            body: { action: "check-progress" },
          });
        } catch (err) {
          console.error("Auto-check error:", err);
        }
      }

      // Refresh stats
      await fetchStats();

      // Stop if everything is done
      if (stats.pending === 0 && stats.uploading === 0) {
        setAutoMigrate(false);
        toast.success("Migration complete! All videos have been processed.");
      }
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [autoMigrate, stats, selectedCourse, fetchStats]);

  const handlePrepare = async () => {
    setIsPreparing(true);
    try {
      const { data, error } = await supabase.functions.invoke("migrate-to-lulustream", {
        body: { action: "prepare", courseId: selectedCourse === "all" ? undefined : selectedCourse },
      });
      if (error) throw error;
      if (data?.success) {
        toast.success(data.message);
        await fetchStats();
      } else {
        throw new Error(data?.error);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to prepare migration");
    } finally {
      setIsPreparing(false);
    }
  };

  const handleMigrateBatch = async () => {
    setIsMigrating(true);
    try {
      const { data, error } = await supabase.functions.invoke("migrate-to-lulustream", {
        body: { action: "migrate", courseId: selectedCourse === "all" ? undefined : selectedCourse },
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
        body: { action: "retry-failed" },
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

  const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          LuluStream Video Migration
        </CardTitle>
        <CardDescription>
          Migrate videos from Google Drive to LuluStream for smooth HLS streaming with unlimited storage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Course Filter */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Course:</span>
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatBadge label="Total" count={stats.total} variant="secondary" />
          <StatBadge label="Pending" count={stats.pending} variant="outline" />
          <StatBadge label="Uploading" count={stats.uploading} variant="default" />
          <StatBadge label="Completed" count={stats.completed} variant="secondary" icon={<CheckCircle className="h-3 w-3 text-green-500" />} />
          <StatBadge label="Failed" count={stats.failed} variant="destructive" icon={<XCircle className="h-3 w-3" />} />
        </div>

        {/* Progress Bar */}
        {stats.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Migration Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-3" />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={handlePrepare} disabled={isPreparing} variant="outline">
            {isPreparing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            {isPreparing ? "Scanning..." : "1. Prepare Migration"}
          </Button>

          <Button onClick={handleMigrateBatch} disabled={isMigrating || stats.pending === 0} variant="outline">
            {isMigrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            {isMigrating ? "Sending..." : "2. Send Batch (5)"}
          </Button>

          <Button onClick={handleCheckProgress} disabled={isChecking || stats.uploading === 0} variant="outline">
            {isChecking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            {isChecking ? "Checking..." : "3. Check Progress"}
          </Button>

          <Button
            onClick={() => setAutoMigrate(!autoMigrate)}
            variant={autoMigrate ? "destructive" : "default"}
            disabled={stats.pending === 0 && stats.uploading === 0}
          >
            {autoMigrate ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Stop Auto-Migrate
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Auto-Migrate All
              </>
            )}
          </Button>
        </div>

        {/* Retry + Refresh */}
        <div className="flex gap-3">
          {stats.failed > 0 && (
            <Button onClick={handleRetryFailed} disabled={isRetrying} variant="outline" size="sm">
              {isRetrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
              Retry Failed ({stats.failed})
            </Button>
          )}
          <Button onClick={fetchStats} variant="ghost" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Stats
          </Button>
        </div>

        {autoMigrate && (
          <div className="p-3 bg-primary/10 rounded-md text-sm">
            <strong>Auto-migration is running.</strong> Videos are being sent to LuluStream in batches of 5 every 15 seconds.
            Lesson URLs will be automatically updated once LuluStream finishes processing each video.
          </div>
        )}
      </CardContent>
    </Card>
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
