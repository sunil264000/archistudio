import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { FollowButton } from '@/components/profile/FollowButton';
import { FollowStats } from '@/components/profile/FollowStats';
import { AchievementGrid } from '@/components/profile/AchievementGrid';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Award, BookOpen, MessageSquare, Star, ExternalLink,
  Loader2, User, GraduationCap, Flame, Shield, MapPin, Building2
} from 'lucide-react';

export default function PublicProfile() {
  const { username } = useParams<{ username: string }>();
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [forumStats, setForumStats] = useState({ topics: 0, answers: 0, bestAnswers: 0 });
  const [sheetStats, setSheetStats] = useState({ sheets: 0, critiques: 0 });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;

    const fetchProfile = async () => {
      // Resolve username to user_id
      const { data: usernameData } = await supabase
        .from('usernames')
        .select('user_id')
        .eq('username', username.toLowerCase())
        .maybeSingle();

      if (!usernameData) { setNotFound(true); setLoading(false); return; }

      const uid = usernameData.user_id;
      setUserId(uid);

      const [profileRes, certsRes, portfolioRes, topicsRes, answersRes, sheetsRes, critiquesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', uid).single(),
        supabase.from('certificates').select('*, courses:course_id(title, slug)').eq('user_id', uid),
        supabase.from('portfolios').select('*').eq('user_id', uid).eq('is_public', true).maybeSingle(),
        supabase.from('forum_topics').select('id', { count: 'exact' }).eq('user_id', uid),
        supabase.from('forum_answers').select('id, is_best_answer').eq('user_id', uid),
        supabase.from('sheet_reviews').select('id', { count: 'exact' }).eq('user_id', uid),
        supabase.from('sheet_critiques').select('id', { count: 'exact' }).eq('user_id', uid),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (certsRes.data) setCertificates(certsRes.data);
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

      setLoading(false);
    };

    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  if (notFound || !profile || !userId) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <User className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-muted-foreground">Profile not found</p>
          <Link to="/" className="text-sm text-accent hover:underline">Go home</Link>
        </div>
        <Footer />
      </>
    );
  }

  const reputationScore = (certificates.length * 100) + (forumStats.bestAnswers * 50) + (forumStats.answers * 10) + (sheetStats.critiques * 5);

  return (
    <>
      <SEOHead
        title={`${profile.full_name || username} — Archistudio`}
        description={profile.bio || `${profile.full_name}'s architecture profile on Archistudio`}
      />
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-gradient-to-b from-accent/5 via-accent/2 to-background border-b border-border/30">
          <div className="container-wide py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-accent/10 flex items-center justify-center text-3xl font-bold shadow-lg overflow-hidden">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-accent">{profile.full_name?.charAt(0)?.toUpperCase() || '?'}</span>
                )}
              </div>
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{profile.full_name}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">@{username}</p>

                {(profile.bio || profile.college || profile.city) && (
                  <div className="mt-3 space-y-1">
                    {profile.bio && <p className="text-sm text-muted-foreground max-w-lg">{profile.bio}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {profile.college && (
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{profile.college}</span>
                      )}
                      {profile.city && (
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{profile.city}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-4 justify-center sm:justify-start">
                  <FollowButton targetUserId={userId} />
                  <Badge variant="outline" className="gap-1.5 text-xs border-accent/30 text-accent">
                    <Flame className="h-3 w-3" /> {reputationScore} Rep
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

                <div className="mt-4">
                  <FollowStats userId={userId} />
                </div>

                {profile.skills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {profile.skills.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                )}
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
              <TabsTrigger value="contributions">Contributions</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Courses', value: certificates.length, icon: GraduationCap },
                  { label: 'Forum Answers', value: forumStats.answers, icon: MessageSquare },
                  { label: 'Best Answers', value: forumStats.bestAnswers, icon: Star },
                  { label: 'Sheet Critiques', value: sheetStats.critiques, icon: BookOpen },
                ].map(stat => (
                  <Card key={stat.label} className="bg-card/50">
                    <CardContent className="p-4 text-center">
                      <stat.icon className="h-5 w-5 mx-auto text-accent/60 mb-2" />
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Completed Courses */}
              {certificates.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Completed Courses</h3>
                  <div className="grid gap-2">
                    {certificates.map((cert: any) => (
                      <Link key={cert.id} to={`/course/${cert.courses?.slug}`} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <GraduationCap className="h-4 w-4 text-accent shrink-0" />
                        <span className="text-sm font-medium text-foreground">{cert.courses?.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="achievements">
              <AchievementGrid userId={userId} />
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
                            <p className="text-sm font-semibold text-foreground">{cert.courses?.title}</p>
                            <p className="text-xs text-muted-foreground mt-1">#{cert.certificate_number}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(cert.issued_at).toLocaleDateString('en-IN')}
                            </p>
                          </div>
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
                    <h4 className="text-sm font-semibold text-foreground mb-2">Forum</h4>
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <p>{forumStats.topics} topics · {forumStats.answers} answers · {forumStats.bestAnswers} best</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold text-foreground mb-2">Sheets</h4>
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <p>{sheetStats.sheets} uploaded · {sheetStats.critiques} critiques</p>
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
