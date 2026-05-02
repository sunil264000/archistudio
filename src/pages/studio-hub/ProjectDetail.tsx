import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { SEOHead } from '@/components/seo/SEOHead';
import { useStudioProject, useProjectProposals, formatBudget, calculatePayout } from '@/hooks/useStudioHub';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, Calendar, Users, Loader2, Eye, ShieldCheck, CheckCircle2,
  Lock, Download, Image as ImageIcon, FileText, Sparkles, Clock, Wallet, GraduationCap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const proposalSchema = z.object({
  bid_amount: z.number().positive('Bid must be greater than 0'),
  delivery_days: z.number().int().positive('Delivery must be at least 1 day').max(365),
  cover_message: z.string().trim().min(30, 'Cover note must be at least 30 characters').max(2000),
});

const ease = [0.22, 1, 0.36, 1] as const;

// Split the long enriched description into structured sections by the
// "— SECTION —" markers we wrote in the migration.
function splitDescription(raw: string) {
  const parts = raw.split(/\n\n— ([A-Z' \/&]+) —\n/);
  // parts: [intro, heading1, body1, heading2, body2, ...]
  const intro = parts.shift()?.trim() || '';
  const sections: { heading: string; body: string }[] = [];
  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i] && parts[i + 1]) {
      sections.push({ heading: parts[i].trim(), body: parts[i + 1].trim() });
    }
  }
  return { intro, sections };
}

const isImage = (url: string) => /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url) || /unsplash\.com|images\./i.test(url);
const fileName = (url: string) => {
  try { return decodeURIComponent(new URL(url).pathname.split('/').pop() || 'file'); } catch { return 'file'; }
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { project, loading } = useStudioProject(id);
  const { proposals, refetch: refetchProposals } = useProjectProposals(id);

  const [proposalOpen, setProposalOpen] = useState(false);
  const [bid, setBid] = useState('');
  const [days, setDays] = useState('');
  const [message, setMessage] = useState('');
  const [isBoosted, setIsBoosted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hiring, setHiring] = useState<string | null>(null);

  // Privileged attachments fetched via RPC (only visible to client/awarded worker/admin)
  const [unlockedFiles, setUnlockedFiles] = useState<string[] | null>(null);
  const [filesLoading, setFilesLoading] = useState(false);

  // Track view count — one increment per session per project
  useEffect(() => {
    if (!id) return;
    const key = `sh_viewed_${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    
    const incrementView = async () => {
      try {
        await (supabase as any).rpc('increment_view_count', { job_id: id });
      } catch (e) {
        console.warn('View count increment failed', e);
      }
    };
    incrementView();
  }, [id]);

  useEffect(() => {
    if (!id || !user) { setUnlockedFiles(null); return; }
    
    const fetchAttachments = async () => {
      setFilesLoading(true);
      try {
        const { data, error } = await (supabase as any).rpc('get_project_attachments', { p_job_id: id });
        if (error) throw error;
        setUnlockedFiles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn('Failed to fetch attachments', err);
        setUnlockedFiles([]);
      } finally {
        setFilesLoading(false);
      }
    };
    fetchAttachments();
  }, [id, user]);

  const isOwner = user?.id === project?.client_id;
  const myProposal = proposals.find((p) => p.worker_id === user?.id);
  const payout = bid ? calculatePayout(parseFloat(bid) || 0) : null;
  const hasFiles = (project?.attachments?.length || 0) > 0;
  const filesUnlocked = (unlockedFiles?.length || 0) > 0;

  const submitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { navigate(`/auth?redirect=/studio-hub/projects/${id}`); return; }
    if (!project) return;

    const parsed = proposalSchema.safeParse({
      bid_amount: parseFloat(bid) || 0,
      delivery_days: parseInt(days, 10) || 0,
      cover_message: message,
    });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }

    setSubmitting(true);
    const { error } = await (supabase as any).from('job_proposals').insert({
      job_id: project.id, 
      worker_id: user.id, 
      is_featured: isBoosted,
      ...parsed.data,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') toast.error('You already submitted a proposal');
      else toast.error(error.message);
      return;
    }
    toast.success(isBoosted ? 'Proposal boosted & submitted!' : 'Proposal submitted!');
    setProposalOpen(false);
    setBid(''); setDays(''); setMessage(''); setIsBoosted(false);
    refetchProposals();
  };

  const hireMember = async (proposalId: string) => {
    if (!project || !user) return;
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;
    setHiring(proposalId);
    const payoutCalc = calculatePayout(proposal.bid_amount);
    const { data, error } = await (supabase as any).from('marketplace_contracts').insert({
      job_id: project.id,
      proposal_id: proposalId,
      client_id: user.id,
      worker_id: proposal.worker_id,
      agreed_amount: proposal.bid_amount,
      platform_fee_percent: payoutCalc.feePercent,
      platform_fee_amount: payoutCalc.fee,
      worker_payout: payoutCalc.payout,
      delivery_days: proposal.delivery_days,
      due_date: new Date(Date.now() + proposal.delivery_days * 86400000).toISOString().slice(0, 10),
      status: 'awaiting_payment',
    }).select('id').single();
    if (!error) {
      await (supabase as any).from('job_proposals').update({ status: 'accepted' }).eq('id', proposalId);
      await (supabase as any).from('marketplace_jobs').update({ status: 'in_progress', awarded_proposal_id: proposalId }).eq('id', project.id);
    }
    setHiring(null);
    if (error) { toast.error(error.message); return; }
    toast.success('Contract created! Project files unlocked for the awarded member.');
    navigate(`/studio-hub/contracts/${data.id}`);
  };

  if (loading) {
    return (
      <StudioHubLayout>
        <div className="container-wide py-16 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </StudioHubLayout>
    );
  }

  if (!project) {
    return (
      <StudioHubLayout>
        <div className="container-wide py-16 text-center">
          <h1 className="font-display text-2xl font-semibold mb-3">Project not found</h1>
          <Link to="/studio-hub/projects"><Button variant="outline" className="rounded-full">Browse projects</Button></Link>
        </div>
      </StudioHubLayout>
    );
  }

  const { intro, sections } = splitDescription(project.description || '');

  return (
    <StudioHubLayout>
      <SEOHead title={`${project.title} — Studio Hub`} description={(project.description || '').slice(0, 160)} />

      {/* Ambient background — replaces the very flat solid */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/0.08),transparent_70%)] blur-3xl" />
        <div className="absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,hsl(var(--blueprint)/0.06),transparent_70%)] blur-3xl" />
        <div className="absolute inset-0 dot-grid opacity-[0.18]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
      </div>

      <div className="relative container-wide py-10 md:py-14 max-w-6xl mx-auto px-4">
        <Link to="/studio-hub/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> All projects
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 lg:gap-10">
          {/* ===================== MAIN ===================== */}
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}>
            {/* Header card */}
            <div className="rounded-3xl border border-border/40 bg-gradient-to-br from-card/60 via-card/30 to-transparent backdrop-blur-sm p-6 md:p-8 mb-8">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider font-normal border-border/60">{project.category}</Badge>
                {project.status === 'open' ? (
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/15 text-[10px] uppercase tracking-wider font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                    Accepting proposals
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="capitalize text-[10px]">{project.status.replace('_', ' ')}</Badge>
                )}
              </div>

              <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight mb-3 leading-[1.1]">
                {project.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                Posted {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}
                {project.deadline && <> · Due {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
              </p>

              {/* Quick meta row */}
              <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-border/40">
                <Metric icon={Wallet} label="Budget" value={formatBudget(project)} />
                <Metric icon={Users} label="Proposals" value={String(project.proposals_count)} />
                <Metric icon={Eye} label="Views" value={String(project.views_count)} />
              </div>
            </div>

            {/* Description block — blurred for non-authenticated viewers */}
            <div className="relative">
              <div
                aria-hidden={!user}
                className={
                  !user
                    ? 'pointer-events-none select-none blur-md saturate-50 opacity-70 transition-all duration-500'
                    : 'transition-all duration-500'
                }
              >
                {/* Intro / brief */}
                {intro && (
                  <Section title="Project brief" icon={Sparkles}>
                    <p className="whitespace-pre-wrap text-foreground/85 leading-relaxed">{intro}</p>
                  </Section>
                )}

                {/* Structured sections from enriched description */}
                {sections.map((s, i) => (
                  <Section key={i} title={s.heading} icon={
                    s.heading.includes('SCOPE') ? Sparkles
                    : s.heading.includes('DELIVERABLES') ? CheckCircle2
                    : s.heading.includes('SHARE') ? FileText
                    : s.heading.includes('EXPECT') ? Clock
                    : Sparkles
                  }>
                    <div className="whitespace-pre-wrap text-foreground/85 leading-relaxed text-sm">{s.body}</div>
                  </Section>
                ))}

                {/* Skills */}
                {project.skills_required.length > 0 && (
                  <Section title="Skills required">
                    <div className="flex flex-wrap gap-1.5">
                      {project.skills_required.map((s) => (
                        <Badge key={s} variant="secondary" className="rounded-full font-normal text-xs">{s}</Badge>
                      ))}
                    </div>
                  </Section>
                )}
              </div>

              {/* Sign-in gate overlay */}
              {!user && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background/90 pointer-events-none" />
                  <div className="relative max-w-sm w-[90%] mx-auto rounded-2xl border border-border/60 bg-card/80 backdrop-blur-xl p-6 md:p-7 text-center shadow-[0_30px_80px_-30px_hsl(var(--accent)/0.4)]">
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-2xl bg-accent/10 mb-4">
                      <Lock className="h-5 w-5 text-accent" />
                    </div>
                    <h3 className="font-display text-lg md:text-xl font-semibold tracking-tight mb-1.5">
                      Sign in to view full project
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                      The complete brief, deliverables, scope and references are visible to verified Studio Members only.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Link to={`/auth?redirect=/studio-hub/projects/${id}`} className="flex-1">
                        <Button className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 h-10 font-medium">
                          Sign in
                        </Button>
                      </Link>
                      <Link to={`/auth?mode=signup&redirect=/studio-hub/projects/${id}`} className="flex-1">
                        <Button variant="outline" className="w-full rounded-full h-10 font-medium border-border/60">
                          Create account
                        </Button>
                      </Link>
                    </div>
                    <p className="text-[11px] text-muted-foreground/70 mt-4">Free · 30 seconds</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ============== Project files ============== */}
            {hasFiles && (
              <Section title="Project files" icon={ImageIcon}
                meta={
                  filesUnlocked
                    ? <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-medium">Unlocked</span>
                    : <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">Locked</span>
                }
              >
                {filesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking access…
                  </div>
                ) : filesUnlocked ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(unlockedFiles || []).map((url, i) => (
                      <a
                        key={i} href={url} target="_blank" rel="noreferrer"
                        className="group relative block rounded-xl overflow-hidden border border-border/40 bg-muted/30 aspect-[4/3] hover:border-accent/60 transition-all"
                      >
                        {isImage(url) ? (
                          <img src={url} alt={`Reference ${i + 1}`} loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center"><FileText className="h-8 w-8 text-muted-foreground" /></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="truncate">{fileName(url)}</span>
                          <Download className="h-3 w-3 shrink-0 ml-1.5" />
                        </div>
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-6 text-center">
                    <Lock className="h-6 w-6 text-muted-foreground/60 mx-auto mb-3" />
                    <p className="text-sm font-medium mb-1">{project.attachments.length} reference file{project.attachments.length === 1 ? '' : 's'} attached</p>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                      Project files (drawings, photos, references) unlock automatically once the client accepts your proposal and the contract begins.
                    </p>
                  </div>
                )}
              </Section>
            )}

            {/* ============ Proposals (owner only) ============ */}
            {isOwner && (
              <Section title={`Proposals (${proposals.length})`} icon={Users}>
                {proposals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No proposals yet — they'll appear here as Studio Members respond.</p>
                ) : (
                  <div className="space-y-3">
                    {[...proposals].sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0)).map((p) => (
                      <div key={p.id} className={`border rounded-xl p-5 transition-all ${
                        p.is_featured 
                        ? 'border-accent/40 bg-accent/[0.03] shadow-[0_4px_20px_-10px_hsl(var(--accent)/0.15)] ring-1 ring-accent/20' 
                        : 'border-border/40 bg-card/40 hover:bg-card/60'
                      }`}>
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <Link to={`/studio-hub/members/${p.worker_id}`} className="text-sm font-medium hover:underline underline-offset-4">View member →</Link>
                            {p.is_featured && (
                              <Badge className="bg-accent/90 text-accent-foreground border-0 text-[9px] px-1.5 py-0 rounded-full">
                                <Sparkles className="h-2.5 w-2.5 mr-1" /> Featured
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm"><span className="font-display font-semibold">₹{Number(p.bid_amount).toLocaleString('en-IN')}</span> · {p.delivery_days}d</span>
                            <Badge variant="outline" className="capitalize text-xs">{p.status}</Badge>
                          </div>
                        </div>
                        <p className="text-sm whitespace-pre-wrap text-muted-foreground leading-relaxed mb-4">{p.cover_message}</p>
                        {p.status === 'pending' && (
                          <Button size="sm" onClick={() => hireMember(p.id)} disabled={hiring === p.id}
                            className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                            {hiring === p.id && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                            <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                            Hire & create contract
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            )}

            {/* ============ Community Proposals (Public FOMO) ============ */}
            {!isOwner && (
              <div className="relative mt-8">
                <Section title="Community Proposals" icon={Users} meta={<Badge variant="secondary" className="rounded-full">{proposals.length} bidding</Badge>}>
                  <div className={!user ? "blur-md pointer-events-none select-none opacity-50" : ""}>
                    {proposals.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Be the first one to send a proposal for this project!</p>
                    ) : (
                      <div className="space-y-4">
                        {(user ? proposals : proposals.slice(0, 2)).map((p, i) => (
                          <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border/30 bg-muted/10">
                            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center font-display font-bold text-accent text-xs">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                <div className="text-xs font-semibold">₹{user ? p.bid_amount.toLocaleString() : 'X,XXX'}</div>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 italic">
                                "{user ? p.cover_message : 'This proposal content is hidden to protect member privacy...'}"
                              </p>
                            </div>
                          </div>
                        ))}
                        {!user && proposals.length > 2 && (
                          <p className="text-center text-[10px] text-muted-foreground mt-2">+{proposals.length - 2} more proposals hidden</p>
                        )}
                      </div>
                    )}
                  </div>

                  {!user && (
                    <div className="absolute inset-0 flex items-center justify-center pt-8">
                      <div className="text-center p-6 rounded-2xl bg-card/60 backdrop-blur-md border border-border/40 shadow-xl max-w-xs">
                        <p className="text-sm font-semibold mb-3">Login to see bids & messages</p>
                        <Link to={`/auth?redirect=/studio-hub/projects/${id}`}>
                          <Button size="sm" className="rounded-full w-full">Sign in</Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </Section>
              </div>
            )}
          </motion.div>

          {/* ===================== SIDEBAR ===================== */}
          <motion.aside
            initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease }}
            className="space-y-4"
          >
            <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card/70 via-card/40 to-card/20 backdrop-blur-md p-6 sticky top-32 shadow-[0_20px_60px_-30px_hsl(var(--accent)/0.25)]">
              <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-2">Budget</p>
              <p className="font-display text-3xl font-semibold mb-1">{formatBudget(project)}</p>
              <p className="text-xs text-muted-foreground capitalize mb-5">{project.budget_type} price</p>

              <div className="space-y-2.5 text-sm border-t border-border/40 pt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {project.proposals_count} proposal{project.proposals_count === 1 ? '' : 's'}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  {project.views_count} views
                </div>
                {project.deadline && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Due {new Date(project.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                )}
                {hasFiles && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {filesUnlocked ? <Download className="h-3.5 w-3.5 text-emerald-500" /> : <Lock className="h-3.5 w-3.5" />}
                    {project.attachments.length} project file{project.attachments.length === 1 ? '' : 's'}
                    {filesUnlocked && <span className="text-emerald-500 text-[10px] uppercase tracking-wider ml-1">unlocked</span>}
                  </div>
                )}
              </div>

              <div className="border-t border-border/40 my-5" />

              {isOwner ? (
                <p className="text-xs text-muted-foreground text-center">This is your project. Review proposals on the left.</p>
              ) : myProposal ? (
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2 rounded-full">Proposal sent</Badge>
                  <p className="text-xs text-muted-foreground">₹{Number(myProposal.bid_amount).toLocaleString('en-IN')} · {myProposal.delivery_days}d</p>
                </div>
              ) : project.status !== 'open' ? (
                <p className="text-xs text-muted-foreground text-center">No longer accepting proposals.</p>
              ) : (
                <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90 h-11 font-medium">
                      Send a proposal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader><DialogTitle>Send your proposal</DialogTitle></DialogHeader>
                    <form onSubmit={submitProposal} className="space-y-4">
                      <div>
                        <Label htmlFor="bid">Your bid (₹)</Label>
                        <Input id="bid" type="number" min="1" step="any" value={bid} onChange={(e) => setBid(e.target.value)} placeholder="3000" className="mt-1.5 rounded-xl" />
                        {payout && payout.fee > 0 && (
                          <p className="text-xs text-muted-foreground mt-1.5">You receive ₹{payout.payout.toLocaleString('en-IN')} after the {payout.feePercent}% platform fee.</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="days">Delivery (days)</Label>
                        <Input id="days" type="number" min="1" max="365" value={days} onChange={(e) => setDays(e.target.value)} placeholder="5" className="mt-1.5 rounded-xl" />
                      </div>
                      <div>
                        <Label htmlFor="cover">Cover note</Label>
                        <Textarea id="cover" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Why you fit, your approach, similar past work…" rows={5} maxLength={2000} className="mt-1.5 rounded-xl" />
                        <p className="text-xs text-muted-foreground mt-1">{message.length}/2000</p>
                      </div>

                      <div 
                        onClick={() => setIsBoosted(!isBoosted)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                          isBoosted 
                          ? 'bg-accent/10 border-accent/40 shadow-[0_0_20px_rgba(var(--accent-rgb),0.1)]' 
                          : 'bg-muted/30 border-border/40 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${isBoosted ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'}`}>
                            <Sparkles className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Boost Proposal</p>
                            <p className="text-[10px] text-muted-foreground">Keep your bid at the top for ₹99</p>
                          </div>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isBoosted ? 'bg-accent border-accent' : 'border-border'
                        }`}>
                          {isBoosted && <CheckCircle2 className="h-3 w-3 text-accent-foreground" />}
                        </div>
                      </div>

                      <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setProposalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={submitting} className="bg-foreground text-background hover:bg-foreground/90 rounded-full">
                          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Send
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}

              <div className="border-t border-border/40 mt-5 pt-4 flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                <p>Payments are held by Archistudio escrow and only released after our team reviews the deliverable.</p>
              </div>
            </div>

            {/* Become a Member CTA */}
            <div className="rounded-2xl border border-accent/20 bg-accent/5 p-6 space-y-4">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-accent" />
              </div>
              <div>
                <h4 className="font-display font-semibold text-sm mb-1">Want to work on this?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Join our elite circle of future architects. Get access to real projects, build your portfolio, and earn while you learn.
                </p>
              </div>
              <Link to="/studio-hub/become-member" className="block">
                <Button variant="outline" className="w-full rounded-full border-accent/30 hover:bg-accent/10 text-accent text-xs h-9">
                  Become a Member
                </Button>
              </Link>
            </div>
          </motion.aside>
        </div>
      </div>
    </StudioHubLayout>
  );
}

// ====================== Subcomponents ======================
function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground/70 mb-1">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="font-display text-sm md:text-base font-semibold truncate">{value}</div>
    </div>
  );
}

function Section({
  title, icon: Icon, meta, children,
}: { title: string; icon?: any; meta?: React.ReactNode; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-30px' }}
      transition={{ duration: 0.5, ease }}
      className="mb-8 rounded-2xl border border-border/40 bg-card/30 backdrop-blur-sm p-6 md:p-7"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-accent" />}
          <h2 className="font-display text-base md:text-lg font-semibold tracking-tight">{title}</h2>
        </div>
        {meta}
      </div>
      {children}
    </motion.section>
  );
}
