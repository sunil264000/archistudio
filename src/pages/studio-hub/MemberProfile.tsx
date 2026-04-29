import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { useMemberProfile } from '@/hooks/useStudioHub';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Star, MapPin, Calendar, Pencil, ArrowLeft, Loader2, Briefcase, Award, Instagram, Linkedin, Link as LinkIcon, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
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

      {/* Cover band */}
      <div className="relative h-44 bg-gradient-to-br from-muted via-background to-muted/50 border-b border-border/30">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,hsl(var(--accent)/0.06),transparent)]" />
      </div>

      <div className="container-wide max-w-4xl mx-auto px-4">
        <Link to="/studio-hub/members" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground -mt-10 mb-3 relative z-10">
          <ArrowLeft className="h-3.5 w-3.5" /> All members
        </Link>

        {/* Header card */}
        <div className="-mt-8 relative bg-background border border-border/40 rounded-2xl p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 md:items-start">
            <div className="h-28 w-28 rounded-full bg-muted/60 overflow-hidden border-4 border-background -mt-16 md:mt-0 shadow-md shrink-0">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt={profile.display_name || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-display text-muted-foreground bg-muted">
                  {(profile.display_name || '?').slice(0, 1)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">{profile.display_name || 'Studio Member'}</h1>
                  <p className="text-muted-foreground mt-1">{profile.headline}</p>
                </div>
                {isMe ? (
                  <Link to="/studio-hub/become-member">
                    <Button variant="outline" size="sm" className="rounded-full"><Pencil className="h-3 w-3 mr-1.5" />Edit profile</Button>
                  </Link>
                ) : (
                  <Badge variant="outline" className="rounded-full capitalize">{profile.availability}</Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground mt-3">
                {profile.location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>}
                <span className="inline-flex items-center gap-1.5 capitalize"><Award className="h-3.5 w-3.5" />{profile.experience_level}</span>
                <span className="inline-flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Joined {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}</span>
              </div>

              <div className="flex flex-wrap items-center gap-6 mt-5 pt-5 border-t border-border/40">
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="font-display text-xl font-semibold flex items-center gap-1.5">
                    {Number(profile.average_rating || 0).toFixed(1)}
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Projects done</p>
                  <p className="font-display text-xl font-semibold">{profile.total_jobs_completed}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                  <p className="font-display text-xl font-semibold">{profile.total_reviews}</p>
                </div>
                {profile.hourly_rate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Hourly</p>
                    <p className="font-display text-xl font-semibold">₹{Number(profile.hourly_rate).toLocaleString()}</p>
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

        {/* Skills */}
        {profile.skills.length > 0 && (
          <section className="mb-6 bg-background border border-border/40 rounded-2xl p-6 md:p-8">
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {profile.skills.map((s) => <Badge key={s} variant="secondary" className="rounded-full font-normal">{s}</Badge>)}
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
