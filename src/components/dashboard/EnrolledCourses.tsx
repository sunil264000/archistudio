import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Play, Award, Clock } from 'lucide-react';

interface EnrolledCourse {
  id: string;
  course_id: string;
  enrolled_at: string;
  course: {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    total_lessons: number | null;
    duration_hours: number | null;
  };
  progress: number;
  completedLessons: number;
  totalLessons: number;
}

export function EnrolledCourses() {
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalCourses: 0, totalTime: 0, certificates: 0 });

  useEffect(() => {
    if (user) fetchEnrolledCourses();
  }, [user]);

  const fetchEnrolledCourses = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch enrollments with course details
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select(`
          id, course_id, enrolled_at,
          courses:course_id (id, title, slug, thumbnail_url, total_lessons, duration_hours)
        `)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!enrollments || enrollments.length === 0) {
        setEnrolledCourses([]);
        setLoading(false);
        return;
      }

      // For each course, calculate progress
      const coursesWithProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
          const course = enrollment.courses as any;
          if (!course) return null;

          // Get all lessons for this course
          const { data: modules } = await supabase
            .from('modules')
            .select('id')
            .eq('course_id', course.id);

          if (!modules?.length) {
            return {
              ...enrollment,
              course,
              progress: 0,
              completedLessons: 0,
              totalLessons: course.total_lessons || 0,
            };
          }

          const moduleIds = modules.map(m => m.id);
          const { data: lessons } = await supabase
            .from('lessons')
            .select('id')
            .in('module_id', moduleIds);

          const lessonIds = lessons?.map(l => l.id) || [];
          const totalLessons = lessonIds.length || course.total_lessons || 0;

          if (lessonIds.length === 0) {
            return {
              ...enrollment,
              course,
              progress: 0,
              completedLessons: 0,
              totalLessons,
            };
          }

          // Get completed lessons
          const { data: progressData } = await supabase
            .from('progress')
            .select('lesson_id')
            .eq('user_id', user.id)
            .eq('completed', true)
            .in('lesson_id', lessonIds);

          const completedLessons = progressData?.length || 0;
          const progress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

          return {
            ...enrollment,
            course,
            progress,
            completedLessons,
            totalLessons,
          };
        })
      );

      const validCourses = coursesWithProgress.filter(Boolean) as EnrolledCourse[];
      setEnrolledCourses(validCourses);

      // Fetch certificates count
      const { count: certCount } = await supabase
        .from('certificates')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id);

      // Calculate total watch time
      const { data: progressTime } = await supabase
        .from('progress')
        .select('watch_time_seconds')
        .eq('user_id', user.id);

      const totalSeconds = progressTime?.reduce((sum, p) => sum + (p.watch_time_seconds || 0), 0) || 0;

      setStats({
        totalCourses: validCourses.length,
        totalTime: Math.round(totalSeconds / 3600), // hours
        certificates: certCount || 0,
      });
    } catch (error) {
      console.error('Error fetching enrolled courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Enrolled Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCourses}</div>
            <p className="text-sm text-muted-foreground">courses in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Learning Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTime}h</div>
            <p className="text-sm text-muted-foreground">total watch time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.certificates}</div>
            <p className="text-sm text-muted-foreground">earned certificates</p>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Courses */}
      <Card>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <CardDescription>Continue learning where you left off</CardDescription>
        </CardHeader>
        <CardContent>
          {enrolledCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-4">Start your learning journey today!</p>
              <Link to="/courses">
                <Button>Browse Courses</Button>
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {enrolledCourses.map((enrollment) => (
                <Card key={enrollment.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    {enrollment.course.thumbnail_url ? (
                      <img
                        src={enrollment.course.thumbnail_url}
                        alt={enrollment.course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {enrollment.progress === 100 && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-success text-success-foreground">Completed</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2 line-clamp-1">{enrollment.course.title}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{enrollment.completedLessons}/{enrollment.totalLessons} lessons</span>
                        <span>{Math.round(enrollment.progress)}%</span>
                      </div>
                      <Progress value={enrollment.progress} className="h-2" />
                    </div>
                    <Link to={`/learn/${enrollment.course.slug}`}>
                      <Button className="w-full mt-4 gap-2">
                        <Play className="h-4 w-4" />
                        {enrollment.progress > 0 ? 'Continue' : 'Start Learning'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
