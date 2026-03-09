import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Play, Clock, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

interface ContinueItem {
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  thumbnailUrl: string | null;
  lastLessonTitle: string;
  lastLessonId: string;
  moduleId: string;
  progressPercent: number;
  lastWatchedAt: string;
  totalLessons: number;
  completedLessons: number;
}

export function ContinueLearning() {
  const { user } = useAuth();
  const [items, setItems] = useState<ContinueItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchContinueData();
  }, [user]);

  const fetchContinueData = async () => {
    if (!user) return;
    try {
      // Get enrollments with course info
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('course_id, courses:course_id (title, slug, thumbnail_url, total_lessons)')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!enrollments || enrollments.length === 0) {
        setLoading(false);
        return;
      }

      const courseIds = enrollments.map((e: any) => e.course_id);

      // Get progress for these courses
      const { data: progressData } = await supabase
        .from('progress')
        .select('lesson_id, completed, watch_time_seconds, updated_at, last_position_seconds, lessons:lesson_id (title, module_id, modules:module_id (course_id))')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      const continueItems: ContinueItem[] = [];

      for (const enrollment of enrollments) {
        const course = enrollment.courses as any;
        if (!course) continue;

        const courseProgress = (progressData || []).filter((p: any) => 
          p.lessons?.modules?.course_id === enrollment.course_id
        );

        const completedCount = courseProgress.filter((p: any) => p.completed).length;
        const totalLessons = course.total_lessons || 1;
        const progressPercent = Math.round((completedCount / totalLessons) * 100);

        // Skip completed courses
        if (progressPercent >= 100) continue;

        // Find the last watched lesson
        const lastWatched = courseProgress
          .filter((p: any) => p.updated_at)
          .sort((a: any, b: any) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];

        continueItems.push({
          courseId: enrollment.course_id,
          courseTitle: course.title,
          courseSlug: course.slug,
          thumbnailUrl: course.thumbnail_url,
          lastLessonTitle: lastWatched?.lessons?.title || 'Start learning',
          lastLessonId: lastWatched?.lesson_id || '',
          moduleId: lastWatched?.lessons?.module_id || '',
          progressPercent,
          lastWatchedAt: lastWatched?.updated_at || '',
          totalLessons,
          completedLessons: completedCount,
        });
      }

      // Sort by most recently watched
      continueItems.sort((a, b) => 
        new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
      );

      setItems(continueItems.slice(0, 3));
    } catch (err) {
      console.error('Failed to load continue learning:', err);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Play className="h-4 w-4 text-accent" /> Continue Learning
        </h3>
        {[1, 2].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Play className="h-4 w-4 text-accent" /> Continue Where You Left Off
      </h3>
      {items.map((item, i) => (
        <motion.div
          key={item.courseId}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <Link to={`/course/${item.courseSlug}`}>
            <Card className="overflow-hidden hover:border-accent/30 transition-all group cursor-pointer">
              <CardContent className="p-0">
                <div className="flex gap-3">
                  {item.thumbnailUrl && (
                    <div className="w-28 h-20 shrink-0 overflow-hidden">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.courseTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="flex-1 py-2 pr-3 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{item.courseTitle}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {item.lastLessonTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Progress value={item.progressPercent} className="h-1.5 flex-1" />
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {item.progressPercent}%
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <BookOpen className="h-2.5 w-2.5" /> {item.completedLessons}/{item.totalLessons}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center pr-3">
                    <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Play className="h-3.5 w-3.5 text-accent fill-accent" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
