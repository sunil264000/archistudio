import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Trophy, ArrowBigUp, Calendar, Upload, Loader2, Image as ImageIcon, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Competition {
  id: string; title: string; description: string; brief: string | null;
  prize_description: string | null; cover_image_url: string | null;
  start_date: string; end_date: string; submission_count: number; is_active: boolean;
}

interface Submission {
  id: string; competition_id: string; user_id: string; title: string;
  description: string | null; image_url: string; vote_count: number; created_at: string;
  profiles?: { full_name: string | null } | null;
}

export default function Competitions() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [subTitle, setSubTitle] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);

  const fetchComps = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('competitions')
      .select('*').eq('is_active', true).order('end_date', { ascending: false });
    setCompetitions(data || []);
    if (data?.length) setSelectedComp(data[0]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchComps(); }, [fetchComps]);

  useEffect(() => {
    if (!selectedComp) return;
    const fetchSubs = async () => {
      const { data } = await (supabase as any).from('competition_submissions')
        .select('*, profiles:user_id(full_name)')
        .eq('competition_id', selectedComp.id)
        .order('vote_count', { ascending: false });
      setSubmissions(data || []);
      if (user) {
        const { data: votes } = await (supabase as any).from('competition_votes')
          .select('submission_id').eq('user_id', user.id);
        setUserVotes(new Set((votes || []).map((v: any) => v.submission_id)));
      }
    };
    fetchSubs();
  }, [selectedComp, user]);

  const handleVote = async (subId: string) => {
    if (!user) { toast({ title: 'Sign in to vote' }); return; }
    if (userVotes.has(subId)) {
      await (supabase as any).from('competition_votes').delete().eq('user_id', user.id).eq('submission_id', subId);
      const current = submissions.find(s => s.id === subId)?.vote_count || 0;
      await (supabase as any).from('competition_submissions').update({ vote_count: Math.max(0, current - 1) }).eq('id', subId);
    } else {
      await (supabase as any).from('competition_votes').insert({ user_id: user.id, submission_id: subId });
      const current = submissions.find(s => s.id === subId)?.vote_count || 0;
      await (supabase as any).from('competition_submissions').update({ vote_count: current + 1 }).eq('id', subId);
    }
    // Refetch
    const { data } = await (supabase as any).from('competition_submissions')
      .select('*, profiles:user_id(full_name)')
      .eq('competition_id', selectedComp!.id).order('vote_count', { ascending: false });
    setSubmissions(data || []);
    const { data: votes } = await (supabase as any).from('competition_votes').select('submission_id').eq('user_id', user.id);
    setUserVotes(new Set((votes || []).map((v: any) => v.submission_id)));
  };

  const handleSubmit = async () => {
    if (!user || !selectedComp || !file || !subTitle.trim()) return;
    setSubmitting(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('competition-uploads').upload(path, file);
    if (uploadErr) { toast({ title: 'Upload failed', variant: 'destructive' }); setSubmitting(false); return; }
    const { data: { publicUrl } } = supabase.storage.from('competition-uploads').getPublicUrl(path);

    const { error } = await (supabase as any).from('competition_submissions').insert({
      competition_id: selectedComp.id, user_id: user.id,
      title: subTitle.trim(), description: subDesc.trim() || null, image_url: publicUrl,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') toast({ title: 'You already submitted!' });
      else toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Submission uploaded!' });
    setSubmitOpen(false); setSubTitle(''); setSubDesc(''); setFile(null);
    // Refetch submissions
    const { data: subs } = await (supabase as any).from('competition_submissions')
      .select('*, profiles:user_id(full_name)')
      .eq('competition_id', selectedComp.id).order('vote_count', { ascending: false });
    setSubmissions(subs || []);
  };

  const isExpired = selectedComp ? new Date(selectedComp.end_date) < new Date() : false;

  return (
    <>
      <SEOHead title="Competitions — Archistudio" description="Architecture design challenges with community voting" />
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Design Challenges</h1>
              <p className="text-muted-foreground mt-1">Compete, create, and get recognized</p>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : competitions.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No active challenges</p>
              <p className="text-sm">Check back soon for new design challenges!</p>
            </div>
          ) : (
            <>
              {/* Competition selector */}
              {competitions.length > 1 && (
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {competitions.map(c => (
                    <button key={c.id} onClick={() => setSelectedComp(c)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${selectedComp?.id === c.id ? 'bg-accent text-accent-foreground border-accent' : 'bg-muted/50 text-muted-foreground border-border hover:bg-muted'}`}
                    >{c.title}</button>
                  ))}
                </div>
              )}

              {selectedComp && (
                <>
                  {/* Challenge header */}
                  <Card className="mb-8">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {selectedComp.cover_image_url && (
                          <img src={selectedComp.cover_image_url} alt="" className="w-full md:w-64 h-40 object-cover rounded-xl" />
                        )}
                        <div className="flex-1">
                          <h2 className="text-2xl font-display font-bold text-foreground">{selectedComp.title}</h2>
                          <p className="text-muted-foreground mt-2">{selectedComp.description}</p>
                          {selectedComp.brief && <p className="text-sm text-foreground/80 mt-3 bg-muted/50 p-3 rounded-lg">{selectedComp.brief}</p>}
                          <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Ends {formatDistanceToNow(new Date(selectedComp.end_date), { addSuffix: true })}</span>
                            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {submissions.length} submissions</span>
                            {selectedComp.prize_description && <Badge variant="outline">{selectedComp.prize_description}</Badge>}
                            {isExpired && <Badge variant="secondary">Ended</Badge>}
                          </div>
                          {!isExpired && user && (
                            <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
                              <DialogTrigger asChild>
                                <Button variant="gradient" size="sm" className="mt-4 gap-1.5"><Upload className="h-3.5 w-3.5" /> Submit Entry</Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader><DialogTitle>Submit Your Design</DialogTitle></DialogHeader>
                                <div className="space-y-3 mt-2">
                                  <Input placeholder="Project title" value={subTitle} onChange={e => setSubTitle(e.target.value)} />
                                  <Textarea placeholder="Description (optional)" rows={3} value={subDesc} onChange={e => setSubDesc(e.target.value)} />
                                  <div>
                                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} className="gap-1.5 w-full">
                                      <ImageIcon className="h-3.5 w-3.5" /> {file ? file.name : 'Upload image'}
                                    </Button>
                                  </div>
                                  <Button onClick={handleSubmit} disabled={submitting || !subTitle.trim() || !file} className="w-full">
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Leaderboard / Submissions */}
                  <h3 className="font-semibold text-foreground mb-4">Submissions {submissions.length > 0 && `(${submissions.length})`}</h3>
                  {submissions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No submissions yet — be the first!</div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {submissions.map((sub, idx) => (
                        <Card key={sub.id}>
                          <div className="relative">
                            <img src={sub.image_url} alt={sub.title} className="w-full h-48 object-cover rounded-t-2xl" />
                            {idx < 3 && (
                              <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">#{idx + 1}</Badge>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-foreground line-clamp-1">{sub.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{sub.profiles?.full_name || 'Anonymous'}</p>
                            {sub.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{sub.description}</p>}
                            <div className="flex items-center justify-between mt-3">
                              <button
                                onClick={() => handleVote(sub.id)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${userVotes.has(sub.id) ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
                              >
                                <ArrowBigUp className="h-4 w-4" /> {sub.vote_count}
                              </button>
                              <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
