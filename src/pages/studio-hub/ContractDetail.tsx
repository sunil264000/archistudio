import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { SEOHead } from '@/components/seo/SEOHead';
import { useContract, useContractDeliverables, statusLabel } from '@/hooks/useStudioHub';
import { useStudioHubEscrow } from '@/hooks/useStudioHubEscrow';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, ShieldCheck, Loader2, Upload, FileText, CheckCircle2, Clock, Wallet, AlertCircle, MessageSquare } from 'lucide-react';
import { ReviewForm } from '@/components/studio-hub/ReviewForm';
import { ContractChat } from '@/components/studio-hub/ContractChat';
import { MilestonesPanel } from '@/components/studio-hub/MilestonesPanel';
import { motion, AnimatePresence } from 'framer-motion';

// Contract status timeline steps
const CONTRACT_STEPS = [
  { key: 'awaiting_payment', label: 'Awaiting Payment' },
  { key: 'active', label: 'In Progress' },
  { key: 'awaiting_admin_review', label: 'Under Review' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'completed', label: 'Completed' },
];

function getStepIndex(status: string): number {
  if (status === 'revision_requested') return 1; // back to in progress
  const idx = CONTRACT_STEPS.findIndex(s => s.key === status);
  return idx >= 0 ? idx : 0;
}

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { contract, loading, refetch } = useContract(id);
  const { deliverables, refetch: refetchDeliverables } = useContractDeliverables(id);
  const { fundContract, verifyEscrow, funding } = useStudioHubEscrow();

  const [submitting, setSubmitting] = useState(false);
  const [marking, setMarking] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  // Pay dialog state
  const [payOpen, setPayOpen] = useState(false);
  const [payName, setPayName] = useState('');
  const [payEmail, setPayEmail] = useState('');
  const [payPhone, setPayPhone] = useState('');

  // Auto-fill prefill values when profile loads
  useEffect(() => {
    if (user) {
      setPayName(profile?.full_name || user.email?.split('@')[0] || '');
      setPayEmail(user.email || '');
    }
  }, [user, profile]);

  // Verify on return from Cashfree
  useEffect(() => {
    const orderId = searchParams.get('escrow_order');
    if (!orderId || !id) return;
    (async () => {
      const status = await verifyEscrow(orderId, id);
      if (status === 'funded') {
        toast.success('Payment received — funds held in escrow.');
        refetch();
      } else if (status === 'failed') {
        toast.error('Payment did not go through.');
      }
      searchParams.delete('escrow_order');
      setSearchParams(searchParams, { replace: true });
    })();
  }, [searchParams, id, verifyEscrow, refetch, setSearchParams]);

  if (loading) return <StudioHubLayout><div className="container-wide py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></StudioHubLayout>;
  if (!contract || !user) return <StudioHubLayout><div className="container-wide py-16 text-center"><p>Contract not found.</p></div></StudioHubLayout>;

  const isClient = user.id === contract.client_id;
  const isMember = user.id === contract.worker_id;
  const currentStep = getStepIndex(contract.status);

  const startEscrowPayment = async () => {
    if (!payName.trim() || !payEmail.trim() || !payPhone.trim()) {
      toast.error('Fill in all details');
      return;
    }
    await fundContract({
      contractId: contract.id,
      customerName: payName,
      customerEmail: payEmail,
      customerPhone: payPhone,
    });
  };

  const markPaidManual = async () => {
    if (!isAdmin) return;
    setMarking(true);
    await (supabase as any).from('marketplace_contracts').update({
      status: 'active', payment_status: 'held_in_escrow', payment_reference: `MANUAL-${Date.now()}`,
    }).eq('id', contract.id);
    setMarking(false);
    toast.success('Marked as held in escrow.');
    refetch();
  };

  const markCompleted = async () => {
    if (!isClient) return;
    setMarking(true);
    await (supabase as any).from('marketplace_contracts').update({
      status: 'completed', completed_at: new Date().toISOString(),
    }).eq('id', contract.id);
    setMarking(false);
    toast.success('Contract marked as completed.');
    refetch();
  };

  const submitDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMember || !files || files.length === 0) { toast.error('Add at least one file'); return; }
    if (!title.trim()) { toast.error('Add a title'); return; }
    setSubmitting(true);
    const urls: string[] = [];
    for (const file of Array.from(files)) {
      const path = `${user.id}/${contract.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('studio-hub-deliverables').upload(path, file);
      if (error) { toast.error(error.message); setSubmitting(false); return; }
      urls.push(path);
    }
    const nextVersion = (deliverables[0]?.version || 0) + 1;
    await (supabase as any).from('studio_hub_deliverables').insert({
      contract_id: contract.id, worker_id: user.id, client_id: contract.client_id,
      version: nextVersion, title, description, file_urls: urls,
    });
    await (supabase as any).from('marketplace_contracts').update({
      status: 'awaiting_admin_review', submitted_at: new Date().toISOString(),
    }).eq('id', contract.id);
    setSubmitting(false);
    setTitle(''); setDescription(''); setFiles(null);
    toast.success('Submitted for studio review!');
    refetch(); refetchDeliverables();
  };

  const showChat = ['active', 'submitted', 'awaiting_admin_review', 'delivered', 'revision_requested', 'completed'].includes(contract.status);

  return (
    <StudioHubLayout>
      <SEOHead title={`Contract — Studio Hub`} description="Studio Hub contract details, deliverables, and payment status." />
      <div className="container-wide py-10 md:py-14 max-w-4xl mx-auto px-4">
        <Link to="/studio-hub/me" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-3.5 w-3.5" /> My Studio
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-2">Contract #{contract.id.slice(0, 8)}</p>
            <h1 className="font-display text-2xl md:text-3xl font-semibold tracking-tight">{statusLabel(contract.status)}</h1>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="rounded-full">{contract.payment_status.replace(/_/g, ' ')}</Badge>
            {contract.status === 'revision_requested' && (
              <Badge variant="outline" className="rounded-full text-amber-500 border-amber-500/30 bg-amber-500/5">Revision requested</Badge>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="mb-8 border border-border/40 rounded-2xl p-5 bg-muted/10">
          <div className="flex items-center justify-between">
            {CONTRACT_STEPS.map((step, i) => (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    i <= currentStep
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {i < currentStep ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                  </div>
                  <p className={`text-[10px] mt-1.5 text-center max-w-[70px] ${i <= currentStep ? 'text-foreground font-medium' : 'text-muted-foreground/60'}`}>
                    {step.label}
                  </p>
                </div>
                {i < CONTRACT_STEPS.length - 1 && (
                  <div className={`flex-1 h-px mx-2 ${i < currentStep ? 'bg-accent' : 'bg-border/40'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Money */}
        <div className="grid grid-cols-3 gap-px bg-border/30 rounded-2xl overflow-hidden mb-8">
          <div className="bg-background p-5"><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Agreed</p><p className="font-display text-xl font-semibold">₹{Number(contract.agreed_amount).toLocaleString()}</p></div>
          <div className="bg-background p-5"><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Platform fee</p><p className="font-display text-xl font-semibold">₹{Number(contract.platform_fee_amount).toLocaleString()}</p></div>
          <div className="bg-background p-5"><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Member payout</p><p className="font-display text-xl font-semibold text-accent">₹{Number(contract.worker_payout).toLocaleString()}</p></div>
        </div>

        {/* Milestone-based escrow releases */}
        {contract.payment_status === 'held_in_escrow' && (
          <MilestonesPanel
            contractId={contract.id}
            agreedAmount={Number(contract.agreed_amount)}
            isClient={isClient}
            isAdmin={isAdmin}
            paymentStatus={contract.payment_status}
            workerId={contract.worker_id}
          />
        )}

        {/* Awaiting payment — funded by client via Cashfree */}
        {contract.status === 'awaiting_payment' && isClient && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-border/40 rounded-2xl p-6 mb-6 bg-muted/20">
            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 text-accent shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-medium mb-1.5">Fund this contract to start work</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Pay ₹{Number(contract.agreed_amount).toLocaleString()} securely via Cashfree.
                  Funds are held by Archistudio and only released after our team reviews the deliverable.
                </p>
                <Button onClick={() => setPayOpen(true)} disabled={funding} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                  {funding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Pay & hold in escrow
                </Button>
                {isAdmin && (
                  <Button onClick={markPaidManual} disabled={marking} variant="ghost" size="sm" className="ml-2 rounded-full">
                    {marking && <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />}
                    Mark as paid (admin)
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Member submit */}
        {isMember && ['active', 'revision_requested'].includes(contract.status) && (
          <form onSubmit={submitDeliverable} className="border border-border/40 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Upload className="h-4 w-4 text-accent" />
              <p className="font-medium">Submit deliverable</p>
              {contract.status === 'revision_requested' && (
                <Badge variant="outline" className="rounded-full text-[10px] text-amber-500 border-amber-500/30">Revision requested — please resubmit</Badge>
              )}
            </div>
            <div className="space-y-3">
              <div><Label className="text-xs">Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Final renders v1" className="mt-1.5 rounded-xl" /></div>
              <div><Label className="text-xs">Notes (optional)</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1.5 rounded-xl" /></div>
              <div><Label className="text-xs">Files</Label><Input type="file" multiple onChange={(e) => setFiles(e.target.files)} className="mt-1.5 rounded-xl" /></div>
              <Button type="submit" disabled={submitting} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}<Upload className="h-3.5 w-3.5 mr-1.5" />Submit for studio review
              </Button>
            </div>
          </form>
        )}

        {/* Conversation between client & member (realtime) */}
        {showChat && (
          <div className="mb-8">
            <ContractChat contractId={contract.id} />
          </div>
        )}

        {/* Deliverables */}
        <div className="mb-8">
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Deliverables ({deliverables.length})</p>
          {deliverables.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border/40 rounded-xl">
              <FileText className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No deliverables yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {deliverables.map((d) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-border/40 rounded-xl p-5 hover:bg-muted/10 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <p className="font-medium">v{d.version} · {d.title}</p>
                        {d.description && <p className="text-sm text-muted-foreground mt-1">{d.description}</p>}
                      </div>
                      <Badge variant={d.status === 'released_to_client' ? 'default' : d.status === 'approved' ? 'default' : 'outline'} className="rounded-full text-[10px] capitalize">{d.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 mt-3">
                      {d.file_urls.map((f: string) => (
                        <div key={f} className="flex items-center gap-2"><FileText className="h-3 w-3" />{f.split('/').pop()}</div>
                      ))}
                    </div>
                    {d.admin_notes && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40 italic">Studio note: {d.admin_notes}</p>}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Client confirms delivery */}
        {isClient && contract.status === 'delivered' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="border border-border/40 rounded-2xl p-6 mb-6 bg-muted/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-medium mb-1.5">Files released to you</p>
                <p className="text-sm text-muted-foreground mb-4">If everything is right, mark the contract complete to release the payout to your Studio Member.</p>
                <Button onClick={markCompleted} disabled={marking} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                  {marking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Mark as completed
                </Button>
              </div>
            </div>
          </motion.div>
        )}


        {/* Reviews on completed contracts — both directions */}
        {contract.status === 'completed' && (isClient || isMember) && (
          <div className="mb-8 space-y-4">
            <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Leave a review</p>
            <ReviewForm
              contractId={contract.id}
              reviewerId={user.id}
              revieweeId={isClient ? contract.worker_id : contract.client_id}
              direction={isClient ? 'client_to_worker' : 'worker_to_client'}
            />
          </div>
        )}

        <div className="border border-border/40 rounded-2xl p-5 bg-muted/20 text-xs text-muted-foreground flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p>Studio-protected escrow: Archistudio reviews every deliverable before releasing files to the client and the payout to the member.</p>
        </div>
      </div>

      {/* Payment dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Fund contract</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">
            You'll be redirected to Cashfree to pay <span className="font-semibold text-foreground">₹{Number(contract.agreed_amount).toLocaleString()}</span>. Funds remain in escrow until delivery is approved.
          </p>
          <div className="space-y-3">
            <div><Label htmlFor="pn" className="text-xs">Full name</Label><Input id="pn" value={payName} onChange={(e) => setPayName(e.target.value)} className="mt-1.5 rounded-xl" /></div>
            <div><Label htmlFor="pe" className="text-xs">Email</Label><Input id="pe" type="email" value={payEmail} onChange={(e) => setPayEmail(e.target.value)} className="mt-1.5 rounded-xl" /></div>
            <div><Label htmlFor="pp" className="text-xs">Phone (with country code)</Label><Input id="pp" value={payPhone} onChange={(e) => setPayPhone(e.target.value)} placeholder="+919999999999" className="mt-1.5 rounded-xl" /></div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button onClick={startEscrowPayment} disabled={funding} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
              {funding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Continue to payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </StudioHubLayout>
  );
}
