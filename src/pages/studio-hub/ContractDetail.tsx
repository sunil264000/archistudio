import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { StudioHubLayout } from '@/components/studio-hub/StudioHubLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { SEOHead } from '@/components/seo/SEOHead';
import { useContract, useContractDeliverables, statusLabel, calculatePayout } from '@/hooks/useStudioHub';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, ShieldCheck, Loader2, Upload, FileText, CheckCircle2, Clock, Wallet } from 'lucide-react';

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { contract, loading, refetch } = useContract(id);
  const { deliverables, refetch: refetchDeliverables } = useContractDeliverables(id);
  const [submitting, setSubmitting] = useState(false);
  const [marking, setMarking] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);

  if (loading) return <StudioHubLayout><div className="container-wide py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div></StudioHubLayout>;
  if (!contract || !user) return <StudioHubLayout><div className="container-wide py-16 text-center"><p>Contract not found.</p></div></StudioHubLayout>;

  const isClient = user.id === contract.client_id;
  const isMember = user.id === contract.worker_id;

  const markPaid = async () => {
    if (!isClient && !isAdmin) return;
    setMarking(true);
    await (supabase as any).from('marketplace_contracts').update({
      status: 'active', payment_status: 'held_in_escrow', payment_reference: `MANUAL-${Date.now()}`,
    }).eq('id', contract.id);
    setMarking(false);
    toast.success('Payment marked as held in escrow.');
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
          <Badge variant="outline" className="rounded-full">{contract.payment_status.replace('_', ' ')}</Badge>
        </div>

        {/* Money */}
        <div className="grid grid-cols-3 gap-px bg-border/30 rounded-2xl overflow-hidden mb-8">
          <div className="bg-background p-5"><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Agreed</p><p className="font-display text-xl font-semibold">₹{Number(contract.agreed_amount).toLocaleString()}</p></div>
          <div className="bg-background p-5"><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Platform fee</p><p className="font-display text-xl font-semibold">₹{Number(contract.platform_fee_amount).toLocaleString()}</p></div>
          <div className="bg-background p-5"><p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Member payout</p><p className="font-display text-xl font-semibold">₹{Number(contract.worker_payout).toLocaleString()}</p></div>
        </div>

        {/* Awaiting payment */}
        {contract.status === 'awaiting_payment' && isClient && (
          <div className="border border-border/40 rounded-2xl p-6 mb-6 bg-muted/20">
            <div className="flex items-start gap-3">
              <Wallet className="h-5 w-5 text-accent shrink-0 mt-1" />
              <div className="flex-1">
                <p className="font-medium mb-1.5">Fund this contract to start</p>
                <p className="text-sm text-muted-foreground mb-4">Pay ₹{Number(contract.agreed_amount).toLocaleString()} to Archistudio. Funds are held until the work is delivered and reviewed.</p>
                <Button onClick={markPaid} disabled={marking} className="rounded-full bg-foreground text-background hover:bg-foreground/90">
                  {marking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  I've paid — mark as held
                </Button>
                <p className="text-[11px] text-muted-foreground mt-3">Coming soon: one-click Cashfree checkout. For now, our team confirms each payment manually.</p>
              </div>
            </div>
          </div>
        )}

        {/* Member submit */}
        {isMember && ['active', 'revision_requested'].includes(contract.status) && (
          <form onSubmit={submitDeliverable} className="border border-border/40 rounded-2xl p-6 mb-6">
            <p className="font-medium mb-4">Submit deliverable</p>
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

        {/* Deliverables */}
        <div className="mb-8">
          <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Deliverables</p>
          {deliverables.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6">No deliverables yet.</p>
          ) : (
            <div className="space-y-3">
              {deliverables.map((d) => (
                <div key={d.id} className="border border-border/40 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-medium">v{d.version} · {d.title}</p>
                      {d.description && <p className="text-sm text-muted-foreground mt-1">{d.description}</p>}
                    </div>
                    <Badge variant={d.status === 'released_to_client' ? 'default' : 'outline'} className="rounded-full text-[10px] capitalize">{d.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 mt-3">
                    {d.file_urls.map((f) => (
                      <div key={f} className="flex items-center gap-2"><FileText className="h-3 w-3" />{f.split('/').pop()}</div>
                    ))}
                  </div>
                  {d.admin_notes && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/40 italic">Studio note: {d.admin_notes}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-border/40 rounded-2xl p-5 bg-muted/20 text-xs text-muted-foreground flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-accent shrink-0 mt-0.5" />
          <p>Studio-protected escrow: Archistudio reviews every deliverable before releasing files to the client and the payout to the member.</p>
        </div>
      </div>
    </StudioHubLayout>
  );
}
