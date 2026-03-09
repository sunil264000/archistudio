import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, Lock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string | null;
  icon: string;
  category: string;
  points: number;
}

interface UserAchievement {
  achievement_id: string;
  earned_at: string;
}

export function AchievementGrid({ userId }: { userId: string }) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [allRes, earnedRes] = await Promise.all([
        supabase.from('achievements').select('*').order('category'),
        supabase.from('user_achievements').select('achievement_id, earned_at').eq('user_id', userId),
      ]);

      if (allRes.data) setAchievements(allRes.data as Achievement[]);
      if (earnedRes.data) {
        setEarned(new Map(earnedRes.data.map(e => [e.achievement_id, e.earned_at])));
      }
      setLoading(false);
    };
    fetch();
  }, [userId]);

  if (loading) return null;

  const earnedCount = earned.size;
  const totalCount = achievements.length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Award className="h-4 w-4 text-accent" /> Achievements
        </h3>
        <Badge variant="outline" className="text-xs">
          {earnedCount}/{totalCount} unlocked
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {achievements.map(achievement => {
          const isEarned = earned.has(achievement.id);
          const earnedAt = earned.get(achievement.id);

          return (
            <Card
              key={achievement.id}
              className={`transition-all ${
                isEarned
                  ? 'bg-accent/5 border-accent/20'
                  : 'bg-muted/20 border-border/50 opacity-50'
              }`}
            >
              <CardContent className="p-3 text-center">
                <div className={`mx-auto mb-2 h-10 w-10 rounded-full flex items-center justify-center ${
                  isEarned ? 'bg-accent/10' : 'bg-muted/30'
                }`}>
                  {isEarned ? (
                    <Award className="h-5 w-5 text-accent" />
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs font-semibold text-foreground leading-tight">{achievement.title}</p>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{achievement.description}</p>
                {isEarned && earnedAt && (
                  <p className="text-[10px] text-accent mt-1.5">
                    {formatDistanceToNow(new Date(earnedAt), { addSuffix: true })}
                  </p>
                )}
                <Badge variant="outline" className="text-[9px] mt-2">+{achievement.points} pts</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
