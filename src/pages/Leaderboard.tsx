import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { SEOHead } from '@/components/seo/SEOHead';
import { useGamification } from '@/hooks/useGamification';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Medal, Flame, Shield, Star, Crown, User } from 'lucide-react';

const LEVEL_TITLES: Record<number, string> = {
  1: 'Apprentice', 2: 'Student', 3: 'Student Designer',
  4: 'Junior Designer', 5: 'Design Associate', 6: 'Designer',
  7: 'Senior Designer', 8: 'Lead Designer', 9: 'Principal',
  10: 'Master Architect',
};

export default function Leaderboard() {
  const { user } = useAuth();
  const { points, badges, leaderboard, fetchLeaderboard } = useGamification();

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-amber-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{index + 1}</span>;
  };

  return (
    <>
      <SEOHead title="Leaderboard — Archistudio" description="See top architecture students and their achievements." />
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border/30">
          <div className="container-wide py-12 text-center">
            <Badge variant="outline" className="mb-4 gap-1.5">
              <Trophy className="h-3 w-3" /> Gamification
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Leaderboard</h1>
            <p className="text-muted-foreground mt-2">Earn points, unlock badges, and climb the ranks.</p>
          </div>
        </div>

        <div className="container-wide py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Leaderboard */}
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" /> Top Students
              </h2>
              {leaderboard.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No data yet. Start learning to earn points!</p>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, i) => (
                    <Card key={entry.user_id} className={`${entry.user_id === user?.id ? 'ring-2 ring-primary/30' : ''} bg-card/50`}>
                      <CardContent className="p-4 flex items-center gap-4">
                        <div className="w-8 flex justify-center">{getRankIcon(i)}</div>
                        <Link to={`/profile/${entry.user_id}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                            {entry.avatar_url ? (
                              <img src={entry.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                            ) : (
                              entry.full_name?.charAt(0)?.toUpperCase() || <User className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {entry.full_name || 'Student'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {LEVEL_TITLES[entry.level] || 'Apprentice'} · Level {entry.level}
                            </p>
                          </div>
                        </Link>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-foreground">{entry.points}</p>
                          <p className="text-[10px] text-muted-foreground">points</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Your Stats */}
            <div className="space-y-6">
              {user && points && (
                <Card className="bg-card/50">
                  <CardContent className="p-6 text-center">
                    <Shield className="h-10 w-10 mx-auto text-primary mb-3" />
                    <h3 className="text-lg font-bold text-foreground">Level {points.level}</h3>
                    <p className="text-sm text-muted-foreground">{LEVEL_TITLES[points.level] || 'Apprentice'}</p>
                    <p className="text-2xl font-bold text-primary mt-2">{points.points}</p>
                    <p className="text-xs text-muted-foreground">Total Points</p>
                  </CardContent>
                </Card>
              )}

              {/* Badges */}
              {badges.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" /> Your Badges
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {badges.map(badge => (
                      <Card key={badge.id} className="bg-card/50">
                        <CardContent className="p-3 text-center">
                          <span className="text-2xl">{badge.badge_icon}</span>
                          <p className="text-xs font-semibold text-foreground mt-1">{badge.badge_name}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* How to earn */}
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">How to Earn Points</h3>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {[
                      { action: 'Complete a course', pts: '+100' },
                      { action: 'Post a forum topic', pts: '+10' },
                      { action: 'Answer in forum', pts: '+5' },
                      { action: 'Get best answer', pts: '+50' },
                      { action: 'Upload sheet review', pts: '+15' },
                      { action: 'Give a critique', pts: '+5' },
                      { action: 'Submit competition entry', pts: '+20' },
                    ].map(item => (
                      <div key={item.action} className="flex justify-between">
                        <span>{item.action}</span>
                        <span className="font-semibold text-primary">{item.pts}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
