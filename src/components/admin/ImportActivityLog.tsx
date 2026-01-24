import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Clock, Trash2, FolderSync, CheckCircle2, XCircle, 
  AlertCircle, Loader2, RefreshCw, ExternalLink, Eraser
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityLog {
  id: string;
  course_id: string | null;
  course_title: string;
  folder_id: string;
  folder_name: string;
  action: string;
  modules_count: number;
  lessons_count: number;
  resources_count: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

interface ImportActivityLogProps {
  onCourseClean: () => void;
}

export function ImportActivityLog({ onCourseClean }: ImportActivityLogProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cleaningCourseId, setCleaningCourseId] = useState<string | null>(null);
  const [courseToClean, setCourseToClean] = useState<ActivityLog | null>(null);

  const fetchActivities = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('import_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activity log');
    } else {
      setActivities(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleCleanCourse = async (activity: ActivityLog) => {
    if (!activity.course_id) {
      toast.error('Course not found');
      return;
    }

    setCleaningCourseId(activity.course_id);
    
    try {
      // Get all modules for this course
      const { data: modules } = await supabase
        .from('modules')
        .select('id')
        .eq('course_id', activity.course_id);

      if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id);

        // Delete resources first
        await supabase
          .from('lesson_resources')
          .delete()
          .in('lesson_id', 
            (await supabase
              .from('lessons')
              .select('id')
              .in('module_id', moduleIds)
            ).data?.map(l => l.id) || []
          );

        // Delete lessons
        await supabase
          .from('lessons')
          .delete()
          .in('module_id', moduleIds);

        // Delete modules
        await supabase
          .from('modules')
          .delete()
          .eq('course_id', activity.course_id);
      }

      // Update course stats
      await supabase
        .from('courses')
        .update({ total_lessons: 0, duration_hours: null })
        .eq('id', activity.course_id);

      // Log the clean action
      await supabase
        .from('import_activity_log')
        .insert({
          course_id: activity.course_id,
          course_title: activity.course_title,
          folder_id: activity.folder_id,
          folder_name: activity.folder_name,
          action: 'clean',
          status: 'success'
        });

      toast.success(`Cleaned all content from "${activity.course_title}"`);
      fetchActivities();
      onCourseClean();
    } catch (err: any) {
      console.error('Clean error:', err);
      toast.error('Failed to clean course: ' + err.message);
    } finally {
      setCleaningCourseId(null);
      setCourseToClean(null);
    }
  };

  const handleDeleteLog = async (logId: string) => {
    const { error } = await supabase
      .from('import_activity_log')
      .delete()
      .eq('id', logId);

    if (error) {
      toast.error('Failed to delete log');
    } else {
      setActivities(prev => prev.filter(a => a.id !== logId));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-primary" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'import':
        return <Badge variant="default" className="gap-1"><FolderSync className="h-3 w-3" />Import</Badge>;
      case 'sync':
        return <Badge variant="secondary" className="gap-1"><RefreshCw className="h-3 w-3" />Sync</Badge>;
      case 'clean':
        return <Badge variant="outline" className="gap-1"><Eraser className="h-3 w-3" />Clean</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Import Activities
          </CardTitle>
          <CardDescription>
            Track all import and sync operations. Quick actions to clean courses if something went wrong.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchActivities} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FolderSync className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No import activities yet</p>
            <p className="text-sm">Activities will appear here after you import courses</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {activities.map((activity) => (
                <div 
                  key={activity.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    activity.status === 'error' 
                      ? 'bg-destructive/5 border-destructive/30'
                      : activity.action === 'clean'
                        ? 'bg-muted/30 border-muted'
                        : 'bg-primary/5 border-primary/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusIcon(activity.status)}
                        <span className="font-medium truncate">{activity.course_title}</span>
                        {getActionBadge(activity.action)}
                      </div>
                      
                      <div className="mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          Folder: <span className="font-mono text-xs truncate max-w-[200px]">{activity.folder_name}</span>
                          <a 
                            href={`https://drive.google.com/drive/folders/${activity.folder_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </span>
                      </div>

                      {activity.action !== 'clean' && activity.status === 'success' && (
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{activity.modules_count} modules</span>
                          <span>{activity.lessons_count} lessons</span>
                          {activity.resources_count > 0 && (
                            <span>{activity.resources_count} resources</span>
                          )}
                        </div>
                      )}

                      {activity.error_message && (
                        <p className="mt-1 text-xs text-destructive">{activity.error_message}</p>
                      )}

                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {activity.course_id && activity.action !== 'clean' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCourseToClean(activity)}
                          disabled={cleaningCourseId === activity.course_id}
                          className="text-destructive hover:text-destructive gap-1"
                        >
                          {cleaningCourseId === activity.course_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Eraser className="h-3 w-3" />
                          )}
                          Clean
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLog(activity.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Clean Confirmation Dialog */}
        <AlertDialog open={!!courseToClean} onOpenChange={() => setCourseToClean(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clean Course Content?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all modules, lessons, and resources from 
                "<strong>{courseToClean?.course_title}</strong>". 
                The course itself will remain but will be empty.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => courseToClean && handleCleanCourse(courseToClean)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes, Clean All Content
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
