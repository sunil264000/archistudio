import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Users, AlertTriangle,
  DollarSign, RefreshCw, Loader2, Calendar, Target, Flame
} from 'lucide-react';

interface CourseDropoff {
  courseId: string;
  courseTitle: string;
  enrolled: number;
  completed: number;
  dropoffRate: number;
  avgProgress: number;
}

interface HeatmapDay {
  date: string;
  dayOfWeek: number;
  weekIndex: number;
  count: number;
}

interface RevenueForecast {
  month: string;
  actual: number;
  projected: number;
}

export function EngagementAnalytics() {
  const [loading, setLoading] = useState(true);
  const [dropoffs, setDropoffs] = useState<CourseDropoff[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapDay[]>([]);
  const [revenue, setRevenue] = useState<RevenueForecast[]>([]);
  const [engagementStats, setEngagementStats] = useState({
    avgSessionMin: 0,
    weeklyActiveUsers: 0,
    monthlyActiveUsers: 0,
    avgCompletionRate: 0,
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchDropoffs(), fetchHeatmap(), fetchRevenue(), fetchEngagementStats()]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const fetchDropoffs = async () => {
    const [coursesRes, enrollmentsRes, certsRes, progressRes] = await Promise.all([
      supabase.from('courses').select('id, title, total_lessons').eq('is_published', true),
      supabase.from('enrollments').select('course_id, user_id').eq('status', 'active'),
      supabase.from('certificates').select('course_id, user_id'),
      supabase.from('progress').select('lesson_id, user_id, completed, lessons:lesson_id(module_id, modules:module_id(course_id))'),
    ]);

    const courses = coursesRes.data || [];
    const enrollments = enrollmentsRes.data || [];
    const certs = certsRes.data || [];
    const progress = progressRes.data || [];

    const result: CourseDropoff[] = courses.map(course => {
      const courseEnrollments = enrollments.filter(e => e.course_id === course.id);
      const courseCompletions = certs.filter(c => c.course_id === course.id);
      const courseProgress = progress.filter(p => (p.lessons as any)?.modules?.course_id === course.id && p.completed);
      
      const uniqueUsers = new Set(courseProgress.map(p => p.user_id));
      const avgLessonsCompleted = uniqueUsers.size > 0
        ? courseProgress.length / uniqueUsers.size
        : 0;
      const avgProgress = course.total_lessons && course.total_lessons > 0
        ? Math.round((avgLessonsCompleted / course.total_lessons) * 100)
        : 0;

      return {
        courseId: course.id,
        courseTitle: course.title,
        enrolled: courseEnrollments.length,
        completed: courseCompletions.length,
        dropoffRate: courseEnrollments.length > 0
          ? Math.round(((courseEnrollments.length - courseCompletions.length) / courseEnrollments.length) * 100)
          : 0,
        avgProgress: Math.min(avgProgress, 100),
      };
    }).filter(c => c.enrolled > 0).sort((a, b) => b.dropoffRate - a.dropoffRate);

    setDropoffs(result);
  };

  const fetchHeatmap = async () => {
    // Last 12 weeks of activity
    const twelveWeeksAgo = new Date(Date.now() - 84 * 86400000).toISOString();
    const { data } = await supabase
      .from('progress')
      .select('updated_at')
      .gte('updated_at', twelveWeeksAgo)
      .not('updated_at', 'is', null);

    if (!data) return;

    const countMap = new Map<string, number>();
    data.forEach(p => {
      const d = new Date(p.updated_at!).toISOString().split('T')[0];
      countMap.set(d, (countMap.get(d) || 0) + 1);
    });

    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const days: HeatmapDay[] = [];
    for (let i = 83; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const dateStr = date.toISOString().split('T')[0];
      const daysSinceStart = 83 - i;
      days.push({
        date: dateStr,
        dayOfWeek: date.getDay(),
        weekIndex: Math.floor(daysSinceStart / 7),
        count: countMap.get(dateStr) || 0,
      });
    }
    setHeatmap(days);
  };

  const fetchRevenue = async () => {
    const { data } = await supabase
      .from('payments')
      .select('amount, created_at')
      .eq('status', 'completed')
      .order('created_at', { ascending: true });

    if (!data || data.length === 0) return;

    const monthlyRevenue = new Map<string, number>();
    data.forEach(p => {
      const month = new Date(p.created_at!).toISOString().slice(0, 7);
      monthlyRevenue.set(month, (monthlyRevenue.get(month) || 0) + Number(p.amount || 0));
    });

    const entries = Array.from(monthlyRevenue.entries()).sort();
    const last3 = entries.slice(-3);
    const avgGrowth = last3.length >= 2
      ? last3.reduce((sum, [, val], i, arr) => {
          if (i === 0) return 0;
          return sum + (val - arr[i - 1][1]);
        }, 0) / (last3.length - 1)
      : 0;

    const forecasts: RevenueForecast[] = entries.slice(-6).map(([month, amount]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      actual: Math.round(amount),
      projected: 0,
    }));

    // Add 3 months forecast
    const lastAmount = entries[entries.length - 1]?.[1] || 0;
    for (let i = 1; i <= 3; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);
      forecasts.push({
        month: futureDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        actual: 0,
        projected: Math.max(0, Math.round(lastAmount + avgGrowth * i)),
      });
    }

    setRevenue(forecasts);
  };

  const fetchEngagementStats = async () => {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    const [weeklyRes, monthlyRes, progressRes] = await Promise.all([
      supabase.from('progress').select('user_id').gte('updated_at', weekAgo),
      supabase.from('progress').select('user_id').gte('updated_at', monthAgo),
      supabase.from('progress').select('watch_time_seconds').gte('updated_at', monthAgo),
    ]);

    const weeklyUsers = new Set((weeklyRes.data || []).map(p => p.user_id)).size;
    const monthlyUsers = new Set((monthlyRes.data || []).map(p => p.user_id)).size;
    const totalWatch = (progressRes.data || []).reduce((s, p) => s + (p.watch_time_seconds || 0), 0);
    const avgSession = monthlyUsers > 0 ? Math.round(totalWatch / monthlyUsers / 60) : 0;

    setEngagementStats({
      avgSessionMin: avgSession,
      weeklyActiveUsers: weeklyUsers,
      monthlyActiveUsers: monthlyUsers,
      avgCompletionRate: 0,
    });
  };

  const getHeatColor = (count: number, max: number) => {
    if (count === 0) return 'bg-muted';
    const intensity = count / Math.max(max, 1);
    if (intensity > 0.75) return 'bg-emerald-500';
    if (intensity > 0.5) return 'bg-emerald-400';
    if (intensity > 0.25) return 'bg-emerald-300';
    return 'bg-emerald-200';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <span className="ml-3">Loading engagement data...</span>
      </div>
    );
  }

  const maxHeat = Math.max(...heatmap.map(d => d.count), 1);
  const maxRevenue = Math.max(...revenue.map(r => Math.max(r.actual, r.projected)), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-accent" />
            Engagement Analytics
          </h2>
          <p className="text-muted-foreground">Deep insights into student engagement and revenue</p>
        </div>
        <Button onClick={fetchAll} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Weekly Active', value: engagementStats.weeklyActiveUsers, icon: Users, color: 'text-blue-500' },
          { label: 'Monthly Active', value: engagementStats.monthlyActiveUsers, icon: Calendar, color: 'text-purple-500' },
          { label: 'Avg Session', value: `${engagementStats.avgSessionMin}m`, icon: Flame, color: 'text-orange-500' },
          { label: 'Courses w/ Dropoff', value: dropoffs.filter(d => d.dropoffRate > 50).length, icon: AlertTriangle, color: 'text-red-500' },
        ].map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <m.icon className={`h-4 w-4 ${m.color}`} />
                  {m.label}
                </div>
                <p className="text-3xl font-bold mt-2">{m.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="heatmap" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="heatmap" className="gap-1.5"><Target className="h-4 w-4" />Heatmap</TabsTrigger>
          <TabsTrigger value="dropoff" className="gap-1.5"><TrendingDown className="h-4 w-4" />Dropout</TabsTrigger>
          <TabsTrigger value="revenue" className="gap-1.5"><DollarSign className="h-4 w-4" />Revenue</TabsTrigger>
        </TabsList>

        {/* Engagement Heatmap */}
        <TabsContent value="heatmap">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-accent" />
                Student Engagement Heatmap
              </CardTitle>
              <CardDescription>Activity across all students over the last 12 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="flex gap-1 min-w-[500px]">
                  {Array.from({ length: 12 }, (_, weekIdx) => (
                    <div key={weekIdx} className="flex flex-col gap-1">
                      {Array.from({ length: 7 }, (_, dayIdx) => {
                        const cell = heatmap.find(d => d.weekIndex === weekIdx && d.dayOfWeek === dayIdx);
                        return (
                          <div
                            key={dayIdx}
                            className={`w-5 h-5 rounded-sm ${getHeatColor(cell?.count || 0, maxHeat)} transition-colors`}
                            title={cell ? `${cell.date}: ${cell.count} activities` : ''}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <span>Less</span>
                  <div className="w-3 h-3 rounded-sm bg-muted" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-200" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-300" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-400" />
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" />
                  <span>More</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Course Dropout */}
        <TabsContent value="dropoff">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                Course Dropout Analysis
              </CardTitle>
              <CardDescription>Courses ranked by student dropout rate</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {dropoffs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No enrollment data yet</p>
                ) : (
                  <div className="space-y-4">
                    {dropoffs.map((course, i) => (
                      <motion.div
                        key={course.courseId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="p-4 border rounded-xl space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate flex-1">{course.courseTitle}</span>
                          <Badge variant={course.dropoffRate > 70 ? 'destructive' : course.dropoffRate > 40 ? 'secondary' : 'default'} className="text-xs ml-2">
                            {course.dropoffRate}% dropout
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{course.enrolled} enrolled</span>
                          <span>{course.completed} completed</span>
                          <span>Avg progress: {course.avgProgress}%</span>
                        </div>
                        <Progress value={100 - course.dropoffRate} className="h-1.5" />
                      </motion.div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Revenue Forecast */}
        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Revenue Forecast
              </CardTitle>
              <CardDescription>Past revenue with 3-month projection</CardDescription>
            </CardHeader>
            <CardContent>
              {revenue.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No payment data yet</p>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-end justify-between gap-2 h-48">
                    {revenue.map((r, i) => {
                      const isProjected = r.projected > 0 && r.actual === 0;
                      const value = r.actual || r.projected;
                      const height = (value / maxRevenue) * 100;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs font-medium">
                            ₹{value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                          </span>
                          <div
                            className={`w-full rounded-t transition-all ${isProjected ? 'bg-accent/30 border-2 border-dashed border-accent/50' : 'bg-accent'}`}
                            style={{ height: `${Math.max(height, 3)}%` }}
                          />
                          <span className="text-[10px] text-muted-foreground">{r.month}</span>
                          {isProjected && <Badge variant="outline" className="text-[8px] px-1 py-0">est</Badge>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground justify-center">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-accent" /> Actual</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded border-2 border-dashed border-accent/50 bg-accent/30" /> Projected</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
