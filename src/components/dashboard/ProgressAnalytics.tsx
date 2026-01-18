import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, BookOpen, Award, TrendingUp, Calendar, Target } from 'lucide-react';

interface ProgressStats {
  totalWatchTime: number;
  totalLessonsCompleted: number;
  totalCoursesEnrolled: number;
  totalCoursesCompleted: number;
  currentStreak: number;
  longestStreak: number;
  weeklyProgress: { day: string; minutes: number }[];
  recentActivity: { lesson: string; course: string; date: string }[];
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
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      // Fetch progress data
      const { data: progressData } = await supabase
        .from('progress')
        .select(`
          *,
          lessons:lesson_id (
            title,
            modules:module_id (
              courses:course_id (title)
            )
          )
        `)
        .eq('user_id', user?.id);

      // Fetch enrollments
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'active');

      // Fetch certificates (completed courses)
      const { data: certificates } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', user?.id);

      // Calculate stats
      const totalWatchTime = progressData?.reduce((sum, p) => sum + (p.watch_time_seconds || 0), 0) || 0;
      const completedLessons = progressData?.filter(p => p.completed) || [];
      
      // Calculate streak (consecutive days with activity)
      const activityDates = progressData
        ?.filter(p => p.updated_at)
        .map(p => new Date(p.updated_at!).toDateString())
        .filter((date, i, arr) => arr.indexOf(date) === i)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) || [];

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

      // Weekly progress (last 7 days)
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weeklyProgress = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86400000);
        const dateStr = date.toDateString();
        const dayProgress = progressData
          ?.filter(p => new Date(p.updated_at || '').toDateString() === dateStr)
          .reduce((sum, p) => sum + (p.watch_time_seconds || 0), 0) || 0;
        
        weeklyProgress.push({
          day: weekDays[date.getDay()],
          minutes: Math.round(dayProgress / 60),
        });
      }

      // Recent activity
      const recentActivity = progressData
        ?.filter(p => p.updated_at && p.lessons)
        .sort((a, b) => new Date(b.updated_at!).getTime() - new Date(a.updated_at!).getTime())
        .slice(0, 5)
        .map(p => ({
          lesson: p.lessons?.title || 'Unknown',
          course: p.lessons?.modules?.courses?.title || 'Unknown',
          date: new Date(p.updated_at!).toLocaleDateString(),
        })) || [];

      setStats({
        totalWatchTime,
        totalLessonsCompleted: completedLessons.length,
        totalCoursesEnrolled: enrollments?.length || 0,
        totalCoursesCompleted: certificates?.length || 0,
        currentStreak,
        longestStreak,
        weeklyProgress,
        recentActivity,
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
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 animate-pulse bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const maxMinutes = Math.max(...stats.weeklyProgress.map(d => d.minutes), 1);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{formatTime(stats.totalWatchTime)}</p>
                <p className="text-sm text-muted-foreground">Watch Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <BookOpen className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalLessonsCompleted}</p>
                <p className="text-sm text-muted-foreground">Lessons Done</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.currentStreak} days</p>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalCoursesCompleted}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
                    style={{ 
                      height: `${Math.max((day.minutes / maxMinutes) * 100, 5)}%`,
                      minHeight: '4px'
                    }}
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

      {/* Progress Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Learning Progress</CardTitle>
          <CardDescription>
            {stats.totalCoursesEnrolled} courses enrolled • {stats.totalCoursesCompleted} completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Course Completion</span>
              <span className="font-medium">
                {stats.totalCoursesEnrolled > 0 
                  ? Math.round((stats.totalCoursesCompleted / stats.totalCoursesEnrolled) * 100) 
                  : 0}%
              </span>
            </div>
            <Progress 
              value={stats.totalCoursesEnrolled > 0 
                ? (stats.totalCoursesCompleted / stats.totalCoursesEnrolled) * 100 
                : 0} 
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}