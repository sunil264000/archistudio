import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Zap, Upload, Heart, Trophy, Users, Loader2, Image as ImageIcon, AlertCircle, RefreshCw, Camera, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Challenge {
  id: string;
  title: string;
  brief: string;
  category: string;
  difficulty: string;
  active_date: string;
  submission_count: number;
  is_mock?: boolean;
}

interface Submission {
  id: string;
  challenge_id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  vote_count: number;
  created_at: string;
  author_name?: string;
  has_voted?: boolean;
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-500 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  hard: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const MOCK_CHALLENGES: Challenge[] = [
  {
    id: 'mock-1',
    title: 'Minimalist Residential Facade',
    brief: 'Design a 2-story minimalist facade using only two materials. Focus on window proportions and shadow play.',
    category: 'Exterior Design',
    difficulty: 'easy',
    active_date: 'Today',
    submission_count: 14,
    is_mock: true
  },
  {
    id: 'mock-2',
    title: 'Staircase Detail in Concrete',
    brief: 'Create a technical detail for a cantilevered concrete staircase. Show reinforcement and finishing.',
    category: 'Construction Detail',
    difficulty: 'hard',
    active_date: 'Yesterday',
    submission_count: 8,
    is_mock: true
  }
];

export default function DailyChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [caption, setCaption] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => { fetchChallenges(); }, []);

  // Realtime vote updates
  useEffect(() => {
    if (!selectedChallenge || selectedChallenge.is_mock) return;
    const channel = supabase
      .channel(`challenge-votes-${selectedChallenge.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'challenge_votes',
      }, () => {
        fetchSubmissions(selectedChallenge.id);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedChallenge?.id]);

  const fetchChallenges = async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await (supabase as any)
      .from('daily_challenges')
      .select('*')
      .eq('is_active', true)
      .order('active_date', { ascending: false })
      .limit(10);
    
    if (fetchError) {
      console.error('Failed to load challenges:', fetchError);
      setError('Failed to load challenges');
      toast.error('Failed to load challenges');
      setLoading(false);
      return;
    }

    const finalChallenges = (data && data.length > 0) ? data : MOCK_CHALLENGES;
    setChallenges(finalChallenges);
    
    if (finalChallenges.length > 0 && !selectedChallenge) {
      setSelectedChallenge(finalChallenges[0]);
      if (!finalChallenges[0].is_mock) {
        fetchSubmissions(finalChallenges[0].id);
      } else {
        setSubmissions([]); // Or mock submissions if needed
      }
    }
    setLoading(false);
  };

  const fetchSubmissions = async (challengeId: string) => {
    const { data, error: fetchError } = await (supabase as any)
      .from('challenge_submissions')
      .select('*')
      .eq('challenge_id', challengeId)
      .order('vote_count', { ascending: false });

    if (fetchError) {
      console.error('Failed to load submissions:', fetchError);
      toast.error('Failed to load submissions');
      return;
    }

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map((s: any) => s.user_id))] as string[];
      const { data: profiles } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));

      let votedSet = new Set<string>();
      if (user) {
        const subIds = data.map((s: any) => s.id);
        const { data: votes } = await (supabase as any)
          .from('challenge_votes')
          .select('submission_id')
          .eq('user_id', user.id)
          .in('submission_id', subIds);
        votedSet = new Set((votes || []).map((v: any) => v.submission_id));
      }

      setSubmissions(data.map((s: any) => ({
        ...s,
        author_name: nameMap.get(s.user_id) || 'Anonymous',
        has_voted: votedSet.has(s.id),
      })));
    } else {
      setSubmissions([]);
    }
  };

  const handleSubmit = async (file: File) => {
    if (!user || !selectedChallenge) return;
    setSubmitting(true);
    
    const ext = file.name.split('.').pop();
    const path = `challenges/${user.id}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from('competition-uploads').upload(path, file);
    if (uploadErr) { toast.error('Upload failed'); setSubmitting(false); return; }

    const { data: urlData } = supabase.storage.from('competition-uploads').getPublicUrl(path);
    
    const { error: insertErr } = await (supabase as any).from('challenge_submissions').insert({
      challenge_id: selectedChallenge.id,
      user_id: user.id,
      image_url: urlData.publicUrl,
      caption: caption || null,
    });

    if (insertErr) { toast.error('Failed to submit'); setSubmitting(false); return; }

    setCaption('');
    setUploadOpen(false);
    setSubmitting(false);
    toast.success('Sketch submitted!');
    fetchSubmissions(selectedChallenge.id);
  };

  const toggleVote = async (submission: Submission) => {
    if (!user) { toast.error('Sign in to vote'); return; }
    
    if (submission.has_voted) {
      await (supabase as any).from('challenge_votes').delete()
        .eq('submission_id', submission.id).eq('user_id', user.id);
      await (supabase as any).from('challenge_submissions').update({
        vote_count: Math.max(0, submission.vote_count - 1)
      }).eq('id', submission.id);
    } else {
      const { error } = await (supabase as any).from('challenge_votes').insert({
        submission_id: submission.id, user_id: user.id,
      });
      if (error) { toast.error('Failed to vote'); return; }
      await (supabase as any).from('challenge_submissions').update({
        vote_count: submission.vote_count + 1
      }).eq('id', submission.id);
    }
    fetchSubmissions(selectedChallenge!.id);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Daily Challenges — Archistudio" description="Daily micro design challenges for architecture students." />
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold flex items-center gap-3">
                <Zap className="h-8 w-8 text-accent" />
                Daily Challenges
              </h1>
              <p className="text-muted-foreground mt-1">Quick design tasks. Submit sketches. Community votes.</p>
            </div>
            {/* Cross-link: Add to portfolio */}
            {user && submissions.some(s => s.user_id === user.id) && (
              <Button variant="outline" size="sm" asChild className="gap-1.5">
                <a href="/portfolio/build"><LinkIcon className="h-3.5 w-3.5" /> Add to Portfolio</a>
              </Button>
            )}
          </div>

          {error ? (
            <div className="text-center py-20 space-y-3">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchChallenges} className="gap-1.5">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : loading ? (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
              </div>
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-32 rounded-xl" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[1, 2].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
                </div>
              </div>
            </div>
          ) : challenges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-lg font-medium text-foreground">No challenges yet</p>
                <p className="text-muted-foreground">Check back soon for daily design challenges!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Challenge list */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Challenges</h3>
                {challenges.map((c) => (
                  <Card
                    key={c.id}
                    className={`cursor-pointer transition-all hover:border-accent/30 ${selectedChallenge?.id === c.id ? 'border-accent bg-accent/5' : ''}`}
                    onClick={() => { setSelectedChallenge(c); fetchSubmissions(c.id); }}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className={DIFFICULTY_COLORS[c.difficulty] || ''}>
                          {c.difficulty}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" /> {c.submission_count}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-foreground">{c.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.active_date}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Selected challenge + submissions */}
              <div className="lg:col-span-2 space-y-4">
                {selectedChallenge && (
                  <>
                    <Card className="border-accent/20">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <CardTitle className="text-xl">{selectedChallenge.title}</CardTitle>
                          {user && (
                            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
                              <DialogTrigger asChild>
                                <Button size="sm" className="gap-1.5 bg-accent text-accent-foreground hover:bg-accent/90">
                                  <Upload className="h-4 w-4" /> Submit Sketch
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader><DialogTitle>Submit Your Sketch</DialogTitle></DialogHeader>
                                <div className="space-y-3">
                                  <Input
                                    placeholder="Caption (optional)"
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                  />
                                  {/* Camera capture for mobile */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <label className="cursor-pointer">
                                      <div className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border hover:border-accent/40 transition-colors">
                                        <Camera className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Camera</span>
                                      </div>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleSubmit(file);
                                        }}
                                        disabled={submitting}
                                      />
                                    </label>
                                    <label className="cursor-pointer">
                                      <div className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-border hover:border-accent/40 transition-colors">
                                        <Upload className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Gallery</span>
                                      </div>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleSubmit(file);
                                        }}
                                        disabled={submitting}
                                      />
                                    </label>
                                  </div>
                                  {submitting && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Uploading...</p>}
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{selectedChallenge.brief}</p>
                      </CardContent>
                    </Card>

                    {submissions.length === 0 ? (
                      <Card>
                        <CardContent className="py-8 text-center">
                          <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-muted-foreground">No submissions yet. Be the first!</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {submissions.map((sub, i) => (
                          <motion.div
                            key={sub.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                          >
                            <Card className="overflow-hidden">
                              <div className="aspect-square bg-muted">
                                <img src={sub.image_url} alt={sub.caption || 'Submission'} className="w-full h-full object-cover" loading="lazy" />
                              </div>
                              <CardContent className="p-3">
                                {sub.caption && <p className="text-sm text-foreground mb-1">{sub.caption}</p>}
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-muted-foreground">{sub.author_name}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleVote(sub)}
                                    className={`gap-1 ${sub.has_voted ? 'text-red-500' : 'text-muted-foreground'}`}
                                  >
                                    <Heart className={`h-4 w-4 ${sub.has_voted ? 'fill-current' : ''}`} />
                                    {sub.vote_count}
                                  </Button>
                                </div>
                                {i === 0 && (
                                  <Badge className="mt-1 bg-accent/10 text-accent border-accent/20">
                                    <Trophy className="h-3 w-3 mr-0.5" /> Top Sketch
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
