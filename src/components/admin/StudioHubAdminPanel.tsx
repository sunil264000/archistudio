import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Eye, FileCheck2, Send, Wallet, ShieldAlert, RefreshCcw, Briefcase, Users } from 'lucide-react';
import { toast } from 'sonner';
import { calculatePayout, statusLabel } from '@/hooks/useStudioHub';
import { formatDistanceToNow } from 'date-fns';

interface Contract {
  id: string;
  job_id: string;
  client_id: string;
  worker_id: string;
  agreed_amount: number;
  worker_payout: number;
  platform_fee_amount: number;
  status: string;
  payment_status: string;
  submitted_at: string | null;
  admin_approved_at: string | null;
  released_to_client_at: string | null;
  payout_released_at: string | null;
  created_at: string;
}

interface Deliverable {
  id: string;
  contract_id: string;
  worker_id: string;
  client_id: string;
  version: number;
  title: string;
  description: string | null;
  file_urls: string[];
  status: string;
  admin_notes: string | null;
  created_at: string;
}

export function StudioHubAdminPanel() {
  const [tab, setTab] = useState('review');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Contract | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [adminNote, setAdminNote] = useState('');
  const [acting, setActing] = useState(false);
  const [stats, setStats] = useState({ awaiting: 0, active: 0, escrow: 0, members: 0, projects: 0 });

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('marketplace_contracts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    const list = (data || []) as Contract[];
    setContracts(list);

    const escrow = list
      .filter((c) => c.payment_status === 'held_in_escrow')
      .reduce((s, c) => s + Number(c.agreed_amount || 0), 0);

    const [{ count: members }, { count: projects }] = await Promise.all([
      (supabase as any).from('worker_profiles').select('*', { count: 'exact', head: true }),
      (supabase as any).from('marketplace_jobs').select('*', { count: 'exact', head: true }),
    ]);

    setStats({
      awaiting: list.filter((c) => c.status === 'awaiting_admin_review').length,
      active: list.filter((c) => ['active', 'submitted'].includes(c.status)).length,
      escrow,
      members: members || 0,
      projects: projects || 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => { void refetch(); }, [refetch]);

  const openContract = async (c: Contract) => {
    setSelected(c);
    setAdminNote('');
    const { data } = await (supabase as any)
      .from('studio_hub_deliverables')
      .select('*')
      .eq('contract_id', c.id)
      .order('created_at', { ascending: false });
    setDeliverables((data || []) as Deliverable[]);
  };

  const releaseToClient = async () => {
    if (!selected) return;
    setActing(true);
    const now = new Date().toISOString();
    // Approve latest pending deliverable + release files
    const latest = deliverables[0];
    if (latest) {
      await (supabase as any).from('studio_hub_deliverables').update({
        status: 'released_to_client',
        admin_notes: adminNote || null,
        reviewed_at: now,
        released_at: now,
      }).eq('id', latest.id);
    }
    // Mark contract as delivered (files visible to client)
    const { error } = await (supabase as any).from('marketplace_contracts').update({
      status: 'delivered',
      admin_approved_at: now,
      released_to_client_at: now,
    }).eq('id', selected.id);
    if (error) { toast.error(error.message); setActing(false); return; }
    toast.success('Files released to client');
    setActing(false);
    void refetch();
    setSelected(null);
  };

  const releasePayout = async () => {
    if (!selected) return;
    setActing(true);
    const now = new Date().toISOString();
    const { fee, payout } = calculatePayout(Number(selected.agreed_amount));
    const { error } = await (supabase as any).from('marketplace_contracts').update({
      status: 'completed',
      payment_status: 'released',
      payout_released_at: now,
      worker_payout: payout,
      platform_fee_amount: fee,
    }).eq('id', selected.id);
    if (error) { toast.error(error.message); setActing(false); return; }
    await (supabase as any).from('studio_hub_payouts').insert({
      contract_id: selected.id,
      worker_id: selected.worker_id,
      amount: payout,
      platform_fee: fee,
      status: 'paid',
      paid_at: now,
      notes: adminNote || null,
    });
    toast.success(`Payout of ₹${payout.toLocaleString()} marked released`);
    setActing(false);
    void refetch();
    setSelected(null);
  };

  const rejectDelivery = async () => {
    if (!selected) return;
    if (!adminNote.trim()) { toast.error('Add a note explaining the rejection'); return; }
    setActing(true);
    const now = new Date().toISOString();
    const latest = deliverables[0];
    if (latest) {
      await (supabase as any).from('studio_hub_deliverables').update({
        status: 'rejected',
        admin_notes: adminNote,
        reviewed_at: now,
      }).eq('id', latest.id);
    }
    await (supabase as any).from('marketplace_contracts').update({
      status: 'revision_requested',
    }).eq('id', selected.id);
    toast.success('Sent back to member for revision');
    setActing(false);
    void refetch();
    setSelected(null);
  };

  const filtered = (filter: string) => {
    if (filter === 'review') return contracts.filter((c) => c.status === 'awaiting_admin_review' || c.status === 'submitted');
    if (filter === 'payouts') return contracts.filter((c) => c.status === 'delivered' && c.payment_status !== 'released');
    if (filter === 'all') return contracts;
    return contracts;
  };

  const Stat = ({ icon: Icon, label, value, color }: any) => (
    <Card className="border-border/40">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="text-lg font-semibold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-semibold">Studio Hub</h2>
          <p className="text-sm text-muted-foreground">Escrow, deliverables and payouts for the freelance side.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCcw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat icon={ShieldAlert} label="To review" value={stats.awaiting} color="bg-amber-500/15 text-amber-500" />
        <Stat icon={FileCheck2} label="Active" value={stats.active} color="bg-blue-500/15 text-blue-500" />
        <Stat icon={Wallet} label="In escrow" value={`₹${stats.escrow.toLocaleString()}`} color="bg-emerald-500/15 text-emerald-500" />
        <Stat icon={Users} label="Members" value={stats.members} color="bg-violet-500/15 text-violet-500" />
        <Stat icon={Briefcase} label="Projects" value={stats.projects} color="bg-pink-500/15 text-pink-500" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="review">To review {stats.awaiting > 0 && <Badge variant="destructive" className="ml-2">{stats.awaiting}</Badge>}</TabsTrigger>
          <TabsTrigger value="payouts">Payouts pending</TabsTrigger>
          <TabsTrigger value="all">All contracts</TabsTrigger>
        </TabsList>

        {(['review', 'payouts', 'all'] as const).map((key) => (
          <TabsContent key={key} value={key}>
            <Card className="border-border/40">
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-12 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
                ) : filtered(key).length === 0 ? (
                  <div className="p-12 text-center text-sm text-muted-foreground">Nothing here. Quiet day in the studio.</div>
                ) : (
                  <ScrollArea className="max-h-[600px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-card/95 backdrop-blur border-b border-border/40">
                        <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
                          <th className="px-4 py-3">Contract</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Payment</th>
                          <th className="px-4 py-3">Created</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered(key).map((c) => (
                          <tr key={c.id} className="border-b border-border/20 hover:bg-muted/30">
                            <td className="px-4 py-3 font-mono text-[11px]">{c.id.slice(0, 8)}…</td>
                            <td className="px-4 py-3">₹{Number(c.agreed_amount).toLocaleString()}</td>
                            <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{statusLabel(c.status as any) || c.status}</Badge></td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{c.payment_status}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</td>
                            <td className="px-4 py-3 text-right">
                              <Button size="sm" variant="ghost" onClick={() => openContract(c)}>
                                <Eye className="h-3.5 w-3.5 mr-1.5" /> Open
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Contract review dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contract review</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/40 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Agreed amount</p>
                  <p className="text-lg font-semibold">₹{Number(selected.agreed_amount).toLocaleString()}</p>
                </div>
                <div className="rounded-lg border border-border/40 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Member payout (after 15%)</p>
                  <p className="text-lg font-semibold">₹{calculatePayout(Number(selected.agreed_amount)).payout.toLocaleString()}</p>
                </div>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Latest deliverable</p>
                {deliverables.length === 0 ? (
                  <p className="text-muted-foreground text-xs">No deliverable submitted yet.</p>
                ) : (
                  <div className="rounded-lg border border-border/40 p-3 space-y-2">
                    <p className="font-medium">v{deliverables[0].version} · {deliverables[0].title}</p>
                    {deliverables[0].description && <p className="text-xs text-muted-foreground">{deliverables[0].description}</p>}
                    <div className="space-y-1">
                      {deliverables[0].file_urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block text-xs text-accent underline truncate">
                          File {i + 1}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Admin note (optional)</p>
                <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Notes for the member or internal log…" rows={3} />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={rejectDelivery} disabled={acting}>
              Request revision
            </Button>
            <Button variant="secondary" onClick={releaseToClient} disabled={acting}>
              <Send className="h-4 w-4 mr-1.5" /> Release files to client
            </Button>
            <Button onClick={releasePayout} disabled={acting} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <Wallet className="h-4 w-4 mr-1.5" /> Release payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
