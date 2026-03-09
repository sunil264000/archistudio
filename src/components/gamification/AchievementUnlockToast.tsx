import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Award, Zap, BookOpen, MessageSquare, Flame } from 'lucide-react';

const ACHIEVEMENT_ICONS: Record<string, any> = {
  course: BookOpen,
  forum: MessageSquare,
  streak: Flame,
  social: Star,
  default: Trophy,
};

interface UnlockedAchievement {
  title: string;
  description: string | null;
  icon: string | null;
  category: string;
  points: number;
}

export function AchievementUnlockToast() {
  const { user } = useAuth();
  const [shown, setShown] = useState<string[]>([]);
  const [current, setCurrent] = useState<UnlockedAchievement | null>(null);

  const checkAchievements = useCallback(async () => {
    if (!user) return;

    const { data: userAchievements } = await (supabase as any)
      .from('user_achievements')
      .select('achievement_id, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!userAchievements?.length) return;

    const latest = userAchievements[0];
    if (shown.includes(latest.achievement_id)) return;

    // Check if earned in last 30 seconds
    const earnedAt = new Date(latest.created_at);
    if (Date.now() - earnedAt.getTime() > 30000) return;

    const { data: achievement } = await (supabase as any)
      .from('achievements')
      .select('title, description, icon, category, points')
      .eq('id', latest.achievement_id)
      .single();

    if (achievement) {
      setShown(prev => [...prev, latest.achievement_id]);
      setCurrent(achievement);
      setTimeout(() => setCurrent(null), 5000);
    }
  }, [user, shown]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkAchievements, 10000);
    return () => clearInterval(interval);
  }, [user, checkAchievements]);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.9 }}
          transition={{ type: 'spring', damping: 15 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-accent/20 to-primary/20 border border-amber-500/30 backdrop-blur-sm shadow-2xl">
            <motion.div
              initial={{ rotate: -30, scale: 0 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="h-12 w-12 rounded-xl bg-amber-500/20 flex items-center justify-center"
            >
              {current.icon ? (
                <span className="text-2xl">{current.icon}</span>
              ) : (
                <Trophy className="h-6 w-6 text-amber-500" />
              )}
            </motion.div>
            <div>
              <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Achievement Unlocked!</p>
              <p className="text-sm font-bold text-foreground">{current.title}</p>
              {current.description && (
                <p className="text-[11px] text-muted-foreground">{current.description}</p>
              )}
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="text-right ml-2"
            >
              <p className="text-lg font-bold text-amber-400">+{current.points}</p>
              <p className="text-[9px] text-muted-foreground">points</p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
