import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { z } from 'zod';
import { MarketplaceLayout } from '@/components/marketplace/MarketplaceLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { SEOHead } from '@/components/seo/SEOHead';
import { useMarketplaceJob, useJobProposals, formatBudget, calculatePayout } from '@/hooks/useMarketplace';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Calendar, Users, Briefcase, Loader2, Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const proposalSchema = z.object({
  bid_amount: z.number().positive('Bid must be greater than 0'),
  delivery_days: z.number().int().positive('Delivery must be at least 1 day').max(365),
  cover_message: z.string().trim().min(30, 'Cover letter must be at least 30 characters').max(2000),
});

export default function JobDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { job, loading } = useMarketplaceJob(id);
  const { proposals, refetch: refetchProposals } = useJobProposals(id);

  const [proposalOpen, setProposalOpen] = useState(false);
  const [bid, setBid] = useState('');
  const [days, setDays] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwner = user?.id === job?.client_id;
  const myProposal = proposals.find((p) => p.worker_id === user?.id);
  const payout = bid ? calculatePayout(parseFloat(bid) || 0) : null;

  const submitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate(`/auth?redirect=/marketplace/jobs/${id}`);
      return;
    }
    if (!job) return;

    const parsed = proposalSchema.safeParse({
      bid_amount: parseFloat(bid) || 0,
      delivery_days: parseInt(days, 10) || 0,
      cover_message: message,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    const { error } = await (supabase as any).from('job_proposals').insert({
      job_id: job.id,
      worker_id: user.id,
      ...parsed.data,
    });
    setSubmitting(false);

    if (error) {
      if (error.code === '23505') {
        toast.error('You already submitted a proposal for this job');
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success('Proposal submitted!');
    setProposalOpen(false);
    setBid(''); setDays(''); setMessage('');
    refetchProposals();
  };

  if (loading) {
    return (
      <MarketplaceLayout>
        <div className="container-wide py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </MarketplaceLayout>
    );
  }

  if (!job) {
    return (
      <MarketplaceLayout>
        <div className="container-wide py-12 text-center">
          <h1 className="text-2xl font-semibold mb-2">Job not found</h1>
          <Link to="/marketplace/jobs">
            <Button variant="outline" className="mt-3">Browse jobs</Button>
          </Link>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <SEOHead title={`${job.title} — Archi Studio Marketplace`} description={job.description.slice(0, 160)} />
      <div className="container-wide py-8 md:py-10 max-w-5xl mx-auto px-4">
        <Link to="/marketplace/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to jobs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          {/* Main */}
          <div className="space-y-5">
            <Card className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <Badge variant="outline" className="mb-2 text-xs">{job.category}</Badge>
                  <h1 className="font-display text-2xl md:text-3xl font-bold">{job.title}</h1>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
                  </p>
                </div>
                <Badge variant={job.status === 'open' ? 'default' : 'secondary'} className="capitalize">{job.status}</Badge>
              </div>

              <div className="prose prose-sm max-w-none dark:prose-invert mb-5">
                <p className="whitespace-pre-wrap text-foreground/90">{job.description}</p>
              </div>

              {job.skills_required.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2">Skills required</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills_required.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            {/* Proposals (visible to owner) */}
            {isOwner && (
              <Card className="p-6">
                <h2 className="font-semibold text-lg mb-3">Proposals received ({proposals.length})</h2>
                {proposals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No proposals yet.</p>
                ) : (
                  <div className="space-y-3">
                    {proposals.map((p) => (
                      <div key={p.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm">
                            <span className="font-semibold">₹{Number(p.bid_amount).toLocaleString()}</span>
                            <span className="text-muted-foreground"> · {p.delivery_days} days</span>
                          </div>
                          <Badge variant="outline" className="capitalize text-xs">{p.status}</Badge>
                        </div>
                        <p className="text-sm whitespace-pre-wrap text-muted-foreground">{p.cover_message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <Card className="p-5">
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Budget</div>
              <div className="text-2xl font-display font-bold text-accent mb-3">{formatBudget(job)}</div>
              <div className="text-xs text-muted-foreground capitalize mb-4">{job.budget_type} price</div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {job.proposals_count} proposal{job.proposals_count === 1 ? '' : 's'}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Eye className="h-3.5 w-3.5" />
                  {job.views_count} views
                </div>
                {job.deadline && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    Due {new Date(job.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="border-t border-border my-4" />

              {isOwner ? (
                <div className="text-xs text-muted-foreground text-center">
                  This is your job. Manage it from your dashboard.
                </div>
              ) : myProposal ? (
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">Proposal submitted</Badge>
                  <p className="text-xs text-muted-foreground">
                    You bid ₹{Number(myProposal.bid_amount).toLocaleString()} · {myProposal.delivery_days} days
                  </p>
                </div>
              ) : job.status !== 'open' ? (
                <div className="text-xs text-muted-foreground text-center">This job is no longer accepting proposals.</div>
              ) : (
                <Dialog open={proposalOpen} onOpenChange={setProposalOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                      <Briefcase className="h-4 w-4 mr-2" /> Submit proposal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Submit your proposal</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={submitProposal} className="space-y-4">
                      <div>
                        <Label htmlFor="bid">Your bid (₹) *</Label>
                        <Input id="bid" type="number" min="1" step="any" value={bid} onChange={(e) => setBid(e.target.value)} placeholder="e.g. 3000" className="mt-1.5" />
                        {payout && payout.fee > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            You receive: ₹{payout.payout.toLocaleString()} (after {payout.feePercent}% fee)
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="days">Delivery time (days) *</Label>
                        <Input id="days" type="number" min="1" max="365" value={days} onChange={(e) => setDays(e.target.value)} placeholder="e.g. 5" className="mt-1.5" />
                      </div>
                      <div>
                        <Label htmlFor="cover">Cover letter *</Label>
                        <Textarea id="cover" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Why you're a good fit, your approach, similar past work…" rows={5} maxLength={2000} className="mt-1.5" />
                        <p className="text-xs text-muted-foreground mt-1">{message.length}/2000</p>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setProposalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={submitting} className="bg-accent text-accent-foreground hover:bg-accent/90">
                          {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Submit
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </Card>
          </div>
        </div>
      </div>
    </MarketplaceLayout>
  );
}
