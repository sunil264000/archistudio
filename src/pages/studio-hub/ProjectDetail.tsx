import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { z } from 'zod';
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
import { ArrowLeft, Calendar, Users, Loader2, Eye, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const proposalSchema = z.object({
  bid_amount: z.number().positive('Bid must be greater than 0'),
  delivery_days: z.number().int().positive('Delivery must be at least 1 day').max(365),
  cover_message: z.string().trim().min(30, 'Cover note must be at least 30 characters').max(2000),
});

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
  const [submitting, setSubmitting] = useState(false);
  const [hiring, setHiring] = useState<string | null>(null);

  // Track view count — one increment per session per project
  useEffect(() => {
    if (!id) return;
    const key = `sh_viewed_${id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    (supabase as any).rpc('increment_view_count', { job_id: id }).catch(() => {
      // fallback: direct update if RPC doesn't exist
      (supabase as any).from('marketplace_jobs').update({ views_count: (project?.views_count || 0) + 1 }).eq('id', id);
    });
  }, [id]);

  const isOwner = user?.id === project?.client_id;
  const myProposal = proposals.find((p) => p.worker_id === user?.id);
  const payout = bid ? calculatePayout(parseFloat(bid) || 0) : null;

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
      job_id: project.id, worker_id: user.id, ...parsed.data,
    });
    setSubmitting(false);
    if (error) {
      if (error.code === '23505') toast.error('You already submitted a proposal');
      else toast.error(error.message);
      return;
    }
    toast.success('Proposal submitted!');
    setProposalOpen(false);
    setBid(''); setDays(''); setMessage('');
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
    toast.success('Contract created! Complete the payment to start.');
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

  return (
    <StudioHubLayout>
      <SEOHead title={`${project.title} — Studio Hub`} description={project.description.slice(0, 160)} />
      <div className="container-wide py-10 md:py-14 max-w-5xl mx-auto px-4">
        <Link to="/studio-hub/projects" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> All projects
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div>
            <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-wider font-normal border-border/60">{project.category}</Badge>
            <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight mb-3">{project.title}</h1>
            <p className="text-xs text-muted-foreground mb-8">Posted {formatDistanceToNow(new Date(project.created_at), { addSuffix: true })}</p>

            <div className="prose prose-sm max-w-none dark:prose-invert mb-10">
              <p className="whitespace-pre-wrap text-foreground/85 leading-relaxed">{project.description}</p>
            </div>

            {project.skills_required.length > 0 && (
              <div className="mb-10">
                <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.skills_required.map((s) => (
                    <Badge key={s} variant="secondary" className="rounded-full font-normal">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Proposals (visible to owner) */}
            {isOwner && (
              <div className="border-t border-border/40 pt-8">
                <h2 className="font-display text-xl font-semibold mb-5">Proposals ({proposals.length})</h2>
                {proposals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No proposals yet — they'll appear here as Studio Members respond.</p>
                ) : (
                  <div className="space-y-3">
                    {proposals.map((p) => (
                      <div key={p.id} className="border border-border/40 rounded-xl p-5 bg-background hover:bg-muted/30 transition-colors">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                          <Link to={`/studio-hub/members/${p.worker_id}`} className="text-sm font-medium hover:underline underline-offset-4">View member →</Link>
                          <div className="flex items-center gap-3">
                            <span className="text-sm"><span className="font-display font-semibold">₹{Number(p.bid_amount).toLocaleString()}</span> · {p.delivery_days}d</span>
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
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="border border-border/40 rounded-2xl p-6 bg-background sticky top-32">
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
                    Due {new Date(project.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="border-t border-border/40 my-5" />

              {isOwner ? (
                <p className="text-xs text-muted-foreground text-center">This is your project. Review proposals on the left.</p>
              ) : myProposal ? (
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2 rounded-full">Proposal sent</Badge>
                  <p className="text-xs text-muted-foreground">₹{Number(myProposal.bid_amount).toLocaleString()} · {myProposal.delivery_days}d</p>
                </div>
              ) : project.status !== 'open' ? (
                <p className="text-xs text-muted-foreground text-center">No longer accepting proposals.</p>
              ) : (
                <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full rounded-full bg-foreground text-background hover:bg-foreground/90">
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
                          <p className="text-xs text-muted-foreground mt-1.5">You receive ₹{payout.payout.toLocaleString()} after the {payout.feePercent}% platform fee.</p>
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
                <p>Payments are held by Archistudio and only released after our team reviews the deliverable.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudioHubLayout>
  );
}
