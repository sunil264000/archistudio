import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { useMemberProfile } from '@/hooks/useStudioHub';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Star, MapPin, Calendar, Pencil, ArrowLeft, Loader2, Briefcase, Award, Instagram, Linkedin, Link as LinkIcon, FileText, GraduationCap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { PortfolioWorks } from '@/components/studio-hub/PortfolioWorks';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function MemberProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { profile, loading } = useMemberProfile(userId);
  const [reviews, setReviews] = useState<any[]>([]);
  const [givenReviews, setGivenReviews] = useState<any[]>([]);
  const isMe = user?.id === userId;

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [received, given] = await Promise.all([
        (supabase as any)
          .from('marketplace_reviews')
          .select('*')
          .eq('reviewee_id', userId)
          .eq('direction', 'client_to_worker')
          .order('created_at', { ascending: false })
          .limit(10),
        (supabase as any)
          .from('marketplace_reviews')
          .select('*')
          .eq('reviewer_id', userId)
          .eq('direction', 'worker_to_client')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);
      setReviews(received.data || []);
      setGivenReviews(given.data || []);
    })();
  }, [userId]);

  if (loading) {
    return (
      <StudioHubLayout>
        <div className="container-wide py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      </StudioHubLayout>
    );
  }

  if (!profile) {
    return (
      <StudioHubLayout>
        <div className="container-wide py-16 text-center">
          <h1 className="font-display text-2xl font-semibold mb-3">Member not found</h1>
          <Link to="/studio-hub/members"><Button variant="outline" className="rounded-full">Browse members</Button></Link>
        </div>
      </StudioHubLayout>
    );
  }

  return (
    <StudioHubLayout>
      <SEOHead title={`${profile.display_name || 'Studio Member'} — Studio Hub`} description={profile.headline || 'Studio Hub member profile'} url={`https://archistudio.shop/studio-hub/members/${profile.user_id}`} />

      {/* Cinematic Hero Cover */}
      <div className="relative h-64 md:h-80 overflow-hidden bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_120%_at_50%_-20%,hsl(var(--accent)/0.15),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background" />
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="container-wide h-full relative flex items-end pb-8">
          <Link to="/studio-hub/members" className="absolute top-8 left-4 md:left-0 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground/60 hover:text-accent transition-colors bg-background/40 backdrop-blur-md px-4 py-2 rounded-full border border-border/20">
            <ArrowLeft className="h-3 w-3" /> Back to Talent
          </Link>
        </div>
      </div>

      <div className="container-wide max-w-5xl mx-auto px-4 -mt-32 relative z-20 pb-24">
        {/* Profile Header Card */}
        <div className="bg-card/40 backdrop-blur-3xl border border-border/40 rounded-[40px] p-8 md:p-12 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.1)] overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 pointer-events-none transition-transform group-hover:rotate-6 duration-700">
            <GraduationCap className="h-64 w-64" />
          </div>
          
          <div className="flex flex-col md:flex-row gap-10 items-start relative z-10">
            <div className="relative shrink-0">
              <div className="absolute -inset-2 bg-gradient-to-br from-accent to-blueprint rounded-[38px] blur-xl opacity-20 animate-pulse" />
              <UserAvatar 
                src={profile.avatar_url} 
                name={profile.display_name} 
                gender={(profile as any).gender} 
                size="xl" 
                className="h-32 w-32 md:h-44 md:w-44 rounded-[36px] border-8 border-background shadow-2xl relative z-10"
              />
              <div className="absolute -bottom-2 -right-2 z-20">
                <VerifiedBadge size="lg" isPro={profile.subscription_tier === 'pro'} className="shadow-xl" />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
                <div className="space-y-2">
                  <h1 className="font-display text-4xl md:text-6xl font-black tracking-tighter leading-none">
                    {profile.display_name || 'Studio Member'}
                  </h1>
                  <p className="text-xl md:text-2xl text-muted-foreground/80 font-medium tracking-tight leading-relaxed max-w-xl italic">
                    "{profile.headline || 'Architectural Visionary'}"
                  </p>
                </div>
                
                <div className="flex gap-3">
                  {isMe ? (
                    <Link to="/studio-hub/become-member">
                      <Button size="lg" className="rounded-full px-8 bg-foreground text-background font-bold hover:scale-105 transition-transform">
                        <Pencil className="h-4 w-4 mr-2" /> Edit Profile
                      </Button>
                    </Link>
                  ) : (
                    <Button size="lg" className="rounded-full px-10 bg-accent text-accent-foreground font-black shadow-xl shadow-accent/20 hover:scale-105 transition-transform group">
                      Hire {profile.display_name?.split(' ')[0]}
                      <Briefcase className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-4 text-sm font-bold text-muted-foreground/70 mb-8">
                {profile.location && (
                  <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/40 border border-border/20">
                    <MapPin className="h-4 w-4 text-accent" /> {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/40 border border-border/20 uppercase tracking-widest text-[10px]">
                  <Award className="h-4 w-4 text-amber-400" /> {profile.experience_level}
                </span>
                <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/40 border border-border/20 uppercase tracking-widest text-[10px]">
                  <Calendar className="h-4 w-4 text-muted-foreground/40" /> Active {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
                </span>
              </div>

              {/* Trust Matrix */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-[32px] bg-muted/30 border border-border/20">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">Expert Rating</p>
                  <div className="flex items-center justify-center md:justify-start gap-1.5">
                    <span className="text-2xl font-black tracking-tighter">{Number(profile.average_rating || 0).toFixed(1)}</span>
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">Projects Completed</p>
                  <p className="text-2xl font-black tracking-tighter">{profile.total_jobs_completed || '0'}</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">Platform Reviews</p>
                  <p className="text-2xl font-black tracking-tighter">{profile.total_reviews || '0'}</p>
                </div>
                {profile.hourly_rate && (
                  <div className="text-center md:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-1">Starting Hourly</p>
                    <p className="text-2xl font-black tracking-tighter text-accent">₹{Number(profile.hourly_rate).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* About & Socials */}
        {(profile.bio || (profile as any).instagram_url || (profile as any).linkedin_url || (profile as any).google_drive_link || (profile as any).portfolio_pdf_url) && (
          <section className="mb-6 bg-background border border-border/40 rounded-2xl p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-2">
                {profile.bio && (
                  <>
                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">About</p>
                    <p className="whitespace-pre-wrap text-foreground/85 leading-relaxed">{profile.bio}</p>
                  </>
                )}
              </div>
              
              <div className="md:col-span-1 space-y-6">
                {((profile as any).instagram_url || (profile as any).linkedin_url || (profile as any).google_drive_link) && (
                  <div>
                    <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Links</p>
                    <div className="space-y-3">
                      {(profile as any).instagram_url && (
                        <a href={(profile as any).instagram_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-foreground/80 hover:text-accent transition-colors">
                          <Instagram className="h-4 w-4" /> Instagram
                        </a>
                      )}
                      {(profile as any).linkedin_url && (
                        <a href={(profile as any).linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-foreground/80 hover:text-accent transition-colors">
                          <Linkedin className="h-4 w-4" /> LinkedIn
                        </a>
                      )}
                      {(profile as any).google_drive_link && (
                        <a href={(profile as any).google_drive_link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-foreground/80 hover:text-accent transition-colors">
                          <LinkIcon className="h-4 w-4" /> Google Drive Portfolio
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* PDF Portfolio Viewer */}
        {(profile as any).portfolio_pdf_url && (
          <section className="mb-6 bg-background border border-border/40 rounded-2xl p-6 md:p-8 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase flex items-center gap-2">
                <FileText className="h-4 w-4" /> Master Portfolio
              </p>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.open((profile as any).portfolio_pdf_url, '_blank')}>
                Open Fullscreen
              </Button>
            </div>
            <div className="w-full h-[600px] rounded-xl overflow-hidden border border-border/40 bg-muted/20">
              <iframe 
                src={`${(profile as any).portfolio_pdf_url}#view=FitH`} 
                title="PDF Portfolio"
                className="w-full h-full border-0"
              />
            </div>
          </section>
        )}

        {/* Skills & Tools */}
        {(profile.skills.length > 0 || (profile as any).tools?.length > 0) && (
          <section className="mb-6 bg-card/40 backdrop-blur-xl border border-border/40 rounded-[32px] p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {profile.skills.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-6">Expertise & Specialization</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((s) => (
                      <Badge key={s} variant="secondary" className="rounded-full font-bold px-4 py-1.5 bg-accent/5 text-foreground border-accent/10 hover:bg-accent/10 transition-colors">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {(profile as any).tools?.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-6">Software Proficiency</p>
                  <div className="flex flex-wrap gap-2">
                    {(profile as any).tools.map((t) => (
                      <Badge key={t} variant="outline" className="rounded-full font-black bg-blueprint/5 text-blueprint border-blueprint/20 px-4 py-1.5 hover:bg-blueprint hover:text-white transition-all">
                        {t}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Portfolio works */}
        <section className="mb-6 bg-background border border-border/40 rounded-2xl p-6 md:p-8">
          <PortfolioWorks workerProfileId={profile.id} userId={profile.user_id} editable={isMe} />
        </section>

        {/* Reviews */}
        <section className="mb-12 bg-background border border-border/40 rounded-2xl p-6 md:p-8">
          <Tabs defaultValue="received">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase">Reviews</p>
              <TabsList className="rounded-full bg-muted/40 p-0.5 h-auto">
                <TabsTrigger value="received" className="rounded-full text-xs px-3 py-1">Received ({reviews.length})</TabsTrigger>
                <TabsTrigger value="given" className="rounded-full text-xs px-3 py-1">Given ({givenReviews.length})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="received">
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews received yet.</p>
              ) : (
                <div className="divide-y divide-border/40 -my-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="py-4">
                      <div className="flex items-center gap-2 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-2">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                      </div>
                      {r.comment && <p className="text-sm text-foreground/85 leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="given">
              {givenReviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews given yet.</p>
              ) : (
                <div className="divide-y divide-border/40 -my-4">
                  {givenReviews.map((r) => (
                    <div key={r.id} className="py-4">
                      <div className="flex items-center gap-2 mb-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-3.5 w-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} />
                        ))}
                        <Badge variant="outline" className="text-[10px] rounded-full">Given to client</Badge>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}</span>
                      </div>
                      {r.comment && <p className="text-sm text-foreground/85 leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </StudioHubLayout>
  );
}
