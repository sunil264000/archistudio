import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SEOHead } from '@/components/seo/SEOHead';
import { FollowButton } from '@/components/profile/FollowButton';
import { FollowStats } from '@/components/profile/FollowStats';
import { AchievementGrid } from '@/components/profile/AchievementGrid';
import {
  Award, BookOpen, Trophy, MessageSquare, Star, ExternalLink,
  Loader2, User, GraduationCap, Flame, Shield
} from 'lucide-react';

interface ProfileData {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export default function StudentProfile() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [forumStats, setForumStats] = useState({ topics: 0, answers: 0, bestAnswers: 0 });
  const [sheetStats, setSheetStats] = useState({ sheets: 0, critiques: 0 });
  const [badges, setBadges] = useState<any[]>([]);
  const [points, setPoints] = useState<{ points: number; level: number } | null>(null);
  const [completedCourses, setCompletedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchAll = async () => {
      setLoading(true);
      const [profileRes, certsRes, portfolioRes, topicsRes, answersRes, sheetsRes, critiquesRes, badgesRes, pointsRes] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name, avatar_url, created_at').eq('user_id', userId).single(),
        supabase.from('certificates').select('*, courses:course_id(title, slug)').eq('user_id', userId),
        supabase.from('portfolios').select('*').eq('user_id', userId).eq('is_public', true).maybeSingle(),
        supabase.from('forum_topics').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('forum_answers').select('id, is_best_answer').eq('user_id', userId),
        supabase.from('sheet_reviews').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('sheet_critiques').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('user_badges').select('*').eq('user_id', userId).order('earned_at', { ascending: false }),
        supabase.from('user_points').select('points, level').eq('user_id', userId).maybeSingle(),
      ]);

      if (profileRes.data) setProfile(profileRes.data as ProfileData);
      if (certsRes.data) {
        setCertificates(certsRes.data);
        setCompletedCourses(certsRes.data.map((c: any) => c.courses).filter(Boolean));
      }
      if (portfolioRes.data) setPortfolio(portfolioRes.data);
      
      const bestAnswers = (answersRes.data || []).filter((a: any) => a.is_best_answer).length;
      setForumStats({
        topics: topicsRes.count || 0,
        answers: (answersRes.data || []).length,
        bestAnswers,
      });
      setSheetStats({
        sheets: sheetsRes.count || 0,
        critiques: critiquesRes.count || 0,
      });
      setBadges(badgesRes.data || []);
      setPoints(pointsRes.data as any);
      setLoading(false);
    };
    fetchAll();
  }, [userId]);

  const reputationScore = (points?.points || 0) + (forumStats.bestAnswers * 50) + (certificates.length * 100) + (forumStats.answers * 10) + (sheetStats.critiques * 5);

  const getLevelTitle = (level: number) => {
    if (level >= 10) return 'Master Architect';
    if (level >= 7) return 'Senior Designer';
    if (level >= 5) return 'Design Associate';
    if (level >= 3) return 'Student Designer';
    return 'Apprentice';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Profile not found</p>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title={`${profile.full_name} — Archistudio`} description={`${profile.full_name}'s architecture profile`} />
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-gradient-to-b from-primary/5 to-background border-b border-border/30">
          <div className="container-wide py-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="h-24 w-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold shadow-lg">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  profile.full_name?.charAt(0)?.toUpperCase() || <User className="h-10 w-10" />
                )}
              </div>
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl font-bold text-foreground">{profile.full_name}</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {getLevelTitle(points?.level || 1)} · Joined {new Date(profile.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
                
                <div className="flex flex-wrap items-center gap-3 mt-4 justify-center sm:justify-start">
                  <FollowButton targetUserId={userId!} />
                  <Badge variant="outline" className="gap-1.5 text-xs border-accent/30 text-accent">
                    <Flame className="h-3 w-3" /> {reputationScore} Rep
                  </Badge>
                  <Badge variant="outline" className="gap-1.5 text-xs">
                    <Shield className="h-3 w-3" /> Level {points?.level || 1}
                  </Badge>
                  <Badge variant="outline" className="gap-1.5 text-xs">
                    <GraduationCap className="h-3 w-3" /> {certificates.length} Courses
                  </Badge>
                  {portfolio && (
                    <Link to={`/portfolio/${portfolio.slug}`}>
                      <Badge variant="outline" className="gap-1.5 text-xs hover:bg-accent/5 cursor-pointer">
                        <ExternalLink className="h-3 w-3" /> Portfolio
                      </Badge>
                    </Link>
                  )}
                </div>
                <div className="mt-3">
                  <FollowStats userId={userId!} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="container-wide py-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
              <TabsTrigger value="badges">Badges</TabsTrigger>
              <TabsTrigger value="contributions">Contributions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Courses Completed', value: certificates.length, icon: GraduationCap },
                  { label: 'Forum Answers', value: forumStats.answers, icon: MessageSquare },
                  { label: 'Best Answers', value: forumStats.bestAnswers, icon: Star },
                  { label: 'Sheet Critiques', value: sheetStats.critiques, icon: BookOpen },
                ].map(stat => (
                  <Card key={stat.label} className="bg-card/50">
                    <CardContent className="p-4 text-center">
                      <stat.icon className="h-5 w-5 mx-auto text-primary/60 mb-2" />
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Recent Badges */}
              {badges.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Recent Badges</h3>
                  <div className="flex flex-wrap gap-2">
                    {badges.slice(0, 6).map(badge => (
                      <Badge key={badge.id} variant="secondary" className="gap-1.5 py-1.5 px-3">
                        <span>{badge.badge_icon}</span>
                        {badge.badge_name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Courses */}
              {completedCourses.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Completed Courses</h3>
                  <div className="grid gap-2">
                    {completedCourses.map((course: any, i: number) => (
                      <Link key={i} to={`/course/${course.slug}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <GraduationCap className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm font-medium text-foreground">{course.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="achievements">
              <AchievementGrid userId={userId!} />
            </TabsContent>

            <TabsContent value="certificates" className="space-y-4">
              {certificates.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No certificates yet</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {certificates.map(cert => (
                    <Card key={cert.id} className="bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Award className="h-8 w-8 text-amber-500 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{(cert as any).courses?.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Certificate #{cert.certificate_number}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Issued {new Date(cert.issued_at).toLocaleDateString('en-IN')}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="badges" className="space-y-4">
              {badges.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">No badges earned yet</p>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map(badge => (
                    <Card key={badge.id} className="bg-card/50">
                      <CardContent className="p-4 flex items-center gap-3">
                        <span className="text-3xl">{badge.badge_icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{badge.badge_name}</p>
                          <p className="text-xs text-muted-foreground">{badge.badge_description}</p>
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Earned {new Date(badge.earned_at).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="contributions" className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Forum Activity</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>{forumStats.topics} topics created</p>
                      <p>{forumStats.answers} answers given</p>
                      <p>{forumStats.bestAnswers} best answers</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Sheet Reviews</h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p>{sheetStats.sheets} sheets uploaded</p>
                      <p>{sheetStats.critiques} critiques given</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </>
  );
}
