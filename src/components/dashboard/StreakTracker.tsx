import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Star, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayActive: boolean;
  weekActivity: boolean[];
}

export function StreakTracker() {
  const { user, session } = useAuth();
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    todayActive: false,
    weekActivity: [false, false, false, false, false, false, false],
  });

  const fetchStreak = useCallback(async () => {
    if (!user) return;

    try {
      // Try backend streak data first
      const { data: streakData } = await (supabase as any)
        .from('user_streaks')
        .select('current_streak, longest_streak, last_active_date')
        .eq('user_id', user.id)
        .single();

      // Get activity for week heatmap
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: activities } = await supabase
        .from('activity_history')
        .select('started_at')
        .eq('user_id', user.id)
        .gte('started_at', sevenDaysAgo);

      const activeDates = new Set(
        (activities || []).map((a: any) => new Date(a.started_at).toISOString().split('T')[0])
      );

      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const weekActivity = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        return activeDates.has(d.toISOString().split('T')[0]);
      });

      setStreak({
        currentStreak: streakData?.current_streak || 0,
        longestStreak: streakData?.longest_streak || 0,
        todayActive: activeDates.has(todayStr),
        weekActivity,
      });

      // Track this page view as activity & update streak via backend
      if (session?.access_token) {
        supabase.functions.invoke('update-streak', {
          body: { activity_type: 'dashboard_visit', page_url: '/dashboard' },
        }).catch(() => {}); // fire-and-forget
      }
    } catch (err) {
      console.error('Streak fetch error:', err);
    }
  }, [user, session]);

  useEffect(() => { fetchStreak(); }, [fetchStreak]);

  if (!user) return null;

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <Card className="bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className={`h-5 w-5 ${streak.currentStreak > 0 ? 'text-orange-500' : 'text-muted-foreground/30'}`} />
            <span className="text-sm font-semibold text-foreground">
              {streak.currentStreak > 0 ? `${streak.currentStreak} day streak!` : 'Start a streak'}
            </span>
          </div>
          {streak.todayActive && (
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] gap-1">
              <Star className="h-2.5 w-2.5" /> Active today
            </Badge>
          )}
        </div>

        {/* Longest streak */}
        {streak.longestStreak > 0 && (
          <p className="text-[10px] text-muted-foreground mb-2 text-center">
            🏆 Longest: {streak.longestStreak} days
          </p>
        )}

        {/* Week heatmap */}
        <div className="flex items-center gap-1.5 justify-center">
          {streak.weekActivity.map((active, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors ${
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted/30 text-muted-foreground/30'
                }`}
              >
                {active ? '✓' : '·'}
              </motion.div>
              <span className="text-[9px] text-muted-foreground">{dayLabels[i]}</span>
            </div>
          ))}
        </div>

        {streak.currentStreak >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 flex items-center justify-center gap-1.5 text-[10px] text-accent"
          >
            <Trophy className="h-3 w-3" />
            {streak.currentStreak >= 30 ? '💎 Month Master!' :
             streak.currentStreak >= 7 ? 'Week warrior! 🔥' : 
             streak.currentStreak >= 5 ? 'Incredible consistency!' :
             'Great momentum!'}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
