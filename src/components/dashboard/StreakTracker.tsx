import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Calendar, Trophy, Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todayActive: boolean;
  weekActivity: boolean[]; // last 7 days
}

export function StreakTracker() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData>({
    currentStreak: 0,
    longestStreak: 0,
    todayActive: false,
    weekActivity: [false, false, false, false, false, false, false],
  });

  const calcStreak = useCallback(async () => {
    if (!user) return;
    
    // Get activity_history for last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await (supabase as any)
      .from('activity_history')
      .select('started_at')
      .eq('user_id', user.id)
      .gte('started_at', thirtyDaysAgo)
      .order('started_at', { ascending: false });

    if (!data || data.length === 0) return;

    // Get unique active dates
    const activeDates = new Set(
      data.map((a: any) => new Date(a.started_at).toISOString().split('T')[0])
    );

    // Calculate current streak
    let current = 0;
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (activeDates.has(dateStr)) {
        current++;
      } else if (i === 0) {
        // Today not active yet, check from yesterday
        continue;
      } else {
        break;
      }
    }

    // Week activity (last 7 days)
    const weekActivity = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return activeDates.has(d.toISOString().split('T')[0]);
    });

    const todayStr = today.toISOString().split('T')[0];

    setStreak({
      currentStreak: current,
      longestStreak: Math.max(current, 0), // simplified
      todayActive: activeDates.has(todayStr),
      weekActivity,
    });
  }, [user]);

  useEffect(() => { calcStreak(); }, [calcStreak]);

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
            {streak.currentStreak >= 7 ? 'Week warrior! 🔥' : 
             streak.currentStreak >= 5 ? 'Incredible consistency!' :
             'Great momentum!'}
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
