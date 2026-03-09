import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Crown, Medal, User } from 'lucide-react';
import { motion } from 'framer-motion';

interface PodiumEntry {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  points: number;
  level: number;
}

const LEVEL_TITLES: Record<number, string> = {
  1: 'Apprentice', 2: 'Student', 3: 'Student Designer',
  4: 'Junior Designer', 5: 'Design Associate', 6: 'Designer',
  7: 'Senior Designer', 8: 'Lead Designer', 9: 'Principal',
  10: 'Master Architect',
};

export function LeaderboardPodium({ top3 }: { top3: PodiumEntry[] }) {
  if (top3.length < 3) return null;

  const podiumOrder = [top3[1], top3[0], top3[2]]; // silver, gold, bronze
  const heights = ['h-28', 'h-36', 'h-24'];
  const colors = [
    'from-gray-400/20 to-gray-400/5 border-gray-400/30',
    'from-amber-400/20 to-amber-400/5 border-amber-400/30',
    'from-amber-700/20 to-amber-700/5 border-amber-700/30',
  ];
  const icons = [
    <Medal key="s" className="h-6 w-6 text-gray-400" />,
    <Crown key="g" className="h-7 w-7 text-amber-400" />,
    <Medal key="b" className="h-6 w-6 text-amber-700" />,
  ];
  const ranks = ['2nd', '1st', '3rd'];

  return (
    <div className="flex items-end justify-center gap-3 mb-8">
      {podiumOrder.map((entry, i) => (
        <motion.div
          key={entry.user_id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.15 }}
          className="flex-1 max-w-[160px]"
        >
          <Link to={`/profile/${entry.user_id}`} className="block">
            <Card className={`bg-gradient-to-b border ${colors[i]} hover:scale-105 transition-transform`}>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">{icons[i]}</div>
                <div className="h-12 w-12 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-2 overflow-hidden">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm font-bold text-foreground truncate">{entry.full_name || 'Student'}</p>
                <p className="text-[10px] text-muted-foreground">{LEVEL_TITLES[entry.level] || 'Apprentice'}</p>
                <p className="text-lg font-bold text-primary mt-1">{entry.points}</p>
                <p className="text-[10px] text-muted-foreground">points</p>
              </CardContent>
            </Card>
            <div className={`${heights[i]} bg-gradient-to-b ${colors[i]} rounded-b-xl border border-t-0 flex items-center justify-center`}>
              <span className="text-2xl font-bold text-foreground/20">{ranks[i]}</span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
