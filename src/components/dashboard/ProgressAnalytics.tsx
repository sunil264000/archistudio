import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, Award, TrendingUp, Calendar, Target, Flame, Zap, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

interface SkillProgress {
  category: string;
  totalLessons: number;
  completedLessons: number;
  percent: number;
}

interface ProgressStats {
  totalWatchTime: number;
  totalLessonsCompleted: number;
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: { day: string; minutes: number }[];
  recentActivity: { lesson: string; course: string; date: string }[];
  skills: SkillProgress[];
  totalHoursLearned: number;
}

export function ProgressAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats>({
    totalWatchTime: 0,
    totalLessonsCompleted: 0,
    totalCoursesEnrolled: 0,
    totalCoursesCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    weeklyProgress: [],
    recentActivity: [],
    skills: [],
    totalHoursLearned: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const [progressRes, enrollmentsRes, certificatesRes, coursesRes] = await Promise.all([
        supabase
          .from('progress')
          .select(`*, lessons:lesson_id (title, module_id, modules:module_id (course_id, courses:course_id (title, category_id, tags)))`)
          .eq('user_id', user?.id),
        supabase.from('enrollments').select('*, courses:course_id (title, category_id, tags, total_lessons)').eq('user_id', user?.id).eq('status', 'active'),
        supabase.from('certificates').select('*').eq('user_id', user?.id),
        supabase.from('courses').select('id, title, category_id, tags, total_lessons'),
      ]);

      const progressData = progressRes.data || [];
      const enrollments = enrollmentsRes.data || [];
      const certificates = certificatesRes.data || [];

      const totalWatchTime = progressData.reduce((sum, p) => sum + (p.watch_time_seconds || 0), 0);
      const completedLessons = progressData.filter(p => p.completed);

      // Calculate skills from enrolled courses' categories/tags
      const skillMap = new Map<string, { total: number; completed: number }>();
      
      for (const enrollment of enrollments) {
        const course = enrollment.courses as any;
        if (!course) continue;
        const skillName = course.category_id || 'General';
        const existing = skillMap.get(skillName) || { total: 0, completed: 0 };
        existing.total += course.total_lessons || 0;
        
        // Count completed lessons for this course
        const courseCompleted = completedLessons.filter(p => {
          const lessonCourse = p.lessons?.modules?.courses;
          return lessonCourse?.title === course.title;
        }).length;
        existing.completed += courseCompleted;
        skillMap.set(skillName, existing);
      }

      const skills: SkillProgress[] = Array.from(skillMap.entries())
        .map(([category, data]) => ({
          category: category.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          totalLessons: data.total,
          completedLessons: data.completed,
          percent: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
        }))
        .sort((a, b) => b.percent - a.percent);

      // Streak calculation
      const activityDates = progressData
        .filter(p => p.updated_at)
        .map(p => new Date(p.updated_at!).toDateString())
        .filter((date, i, arr) => arr.indexOf(date) === i)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (activityDates[0] === today || activityDates[0] === yesterday) {
        for (let i = 0; i < activityDates.length; i++) {
          const current = new Date(activityDates[i]);
          const next = activityDates[i + 1] ? new Date(activityDates[i + 1]) : null;
          tempStreak++;
          if (next) {
            const diff = (current.getTime() - next.getTime()) / 86400000;
            if (diff > 1) {
              longestStreak = Math.max(longestStreak, tempStreak);
              if (i === 0 || activityDates[0] === today || activityDates[0] === yesterday) {
                currentStreak = tempStreak;
              }
              tempStreak = 0;
            }
          } else {
            longestStreak = Math.max(longestStreak, tempStreak);
            if (activityDates[0] === today || activityDates[0] === yesterday) {
              currentStreak = tempStreak;
            }
          }
        }
      }

      // Weekly progress
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyProgress = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000);
        const dateStr = date.toDateString();
        const dayProgress = progressData
          .filter(p => new Date(p.updated_at || '').toDateString() === dateStr)
          .reduce((sum, p) => sum + (p.watch_time_seconds || 0), 0);
        weeklyProgress.push({ day: weekDays[date.getDay()], minutes: Math.round(dayProgress / 60) });
      }

      // Recent activity
      const recentActivity = progressData
        .filter(p => p.updated_at && p.lessons)
        .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
        .slice(0, 5)
        .map(p => ({
          lesson: p.lessons?.title || 'Unknown',
          course: p.lessons?.modules?.courses?.title || 'Unknown',
          date: new Date(p.updated_at!).toLocaleDateString(),
        }));

      setStats({
        totalWatchTime,
        totalLessonsCompleted: completedLessons.length,
        totalCoursesEnrolled: enrollments.length,
        totalCoursesCompleted: certificates.length,
        currentStreak,
        longestStreak,
        weeklyProgress,
        recentActivity,
        skills,
        totalHoursLearned: Math.round(totalWatchTime / 3600 * 10) / 10,
      });
    } catch (error) {
      console.error('Error fetching progress stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}><CardContent className="p-6"><div className="h-20 animate-pulse bg-muted rounded" /></CardContent></Card>
        ))}
      </div>
    );
  }

  const maxMinutes = Math.max(...stats.weeklyProgress.map(d => d.minutes), 1);

  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Clock, label: 'Hours Learned', value: `${stats.totalHoursLearned}h`, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { icon: BookOpen, label: 'Lessons Done', value: stats.totalLessonsCompleted, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { icon: Award, label: 'Courses Completed', value: stats.totalCoursesCompleted, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { icon: Flame, label: 'Day Streak', value: `${stats.currentStreak}🔥`, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { icon: Zap, label: 'Skills Tracked', value: stats.skills.length, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Skills Mastery */}
      {stats.skills.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                Skills Mastery
              </CardTitle>
              <CardDescription>Progress across different skill areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats.skills.map((skill, i) => (
                <div key={skill.category} className="space-y-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">{skill.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">{skill.completedLessons}/{skill.totalLessons} lessons</span>
                      <Badge variant={skill.percent === 100 ? 'default' : 'secondary'} className="text-xs">
                        {skill.percent}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={skill.percent} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Activity
            </CardTitle>
            <CardDescription>Minutes watched per day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-32">
              {stats.weeklyProgress.map((day, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary/20 rounded-t transition-all duration-300 hover:bg-primary/40"
                    style={{ height: `${Math.max((day.minutes / maxMinutes) * 100, 5)}%`, minHeight: '4px' }}
                  />
                  <span className="text-xs text-muted-foreground">{day.day}</span>
                  <span className="text-xs font-medium">{day.minutes}m</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Your latest learning sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No activity yet. Start learning!</p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{activity.lesson}</p>
                      <p className="text-xs text-muted-foreground truncate">{activity.course}</p>
                    </div>
                    <span className="text-xs text-muted-foreground ml-2">{activity.date}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Learning Progress</CardTitle>
          <CardDescription>
            {stats.totalCoursesEnrolled} courses enrolled • {stats.totalCoursesCompleted} completed • Best streak: {stats.longestStreak} days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Course Completion</span>
              <span className="font-medium">
                {stats.totalCoursesEnrolled > 0 ? Math.round((stats.totalCoursesCompleted / stats.totalCoursesEnrolled) * 100) : 0}%
              </span>
            </div>
            <Progress value={stats.totalCoursesEnrolled > 0 ? (stats.totalCoursesCompleted / stats.totalCoursesEnrolled) * 100 : 0} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
