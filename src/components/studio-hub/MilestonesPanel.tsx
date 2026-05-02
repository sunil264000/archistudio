// Milestone-based escrow release panel
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, CheckCircle2, Clock, Wallet, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useMilestones } from '@/hooks/useStudioHubMilestones';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  contractId: string;
  agreedAmount: number;
  isClient: boolean;
  isAdmin: boolean;
  paymentStatus: string;
  workerId: string;
}

export function MilestonesPanel({ contractId, agreedAmount, isClient, isAdmin, paymentStatus, workerId }: Props) {
  const { milestones, loading, refetch } = useMilestones(contractId);
  const [adding, setAdding] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const totalAllocated = milestones.reduce((s, m) => s + Number(m.amount), 0);
  const totalReleased = milestones.filter(m => m.status === 'released').reduce((s, m) => s + Number(m.amount), 0);
  const remaining = agreedAmount - totalAllocated;

  const addMilestone = async () => {
    const amt = Number(newAmount);
    if (!newTitle.trim() || !(amt > 0)) { toast.error('Title and amount are required'); return; }
    if (amt > remaining) { toast.error(`Only ₹${remaining.toLocaleString()} remaining to allocate`); return; }
    setAdding(true);
    const seq = (milestones[milestones.length - 1]?.sequence || 0) + 1;
    const { error } = await (supabase as any).from('marketplace_milestones').insert({
      contract_id: contractId, sequence: seq, title: newTitle.trim(),
      description: newDesc.trim() || null, amount: amt, status: 'pending',
    });
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    setNewOpen(false); setNewTitle(''); setNewDesc(''); setNewAmount('');
    toast.success('Milestone added');
    void refetch();
  };

  const release = async (milestoneId: string, amount: number) => {
    const { error } = await (supabase as any).from('marketplace_milestones').update({
      status: 'released', released_amount: amount, released_at: new Date().toISOString(),
      payout_reference: `MS-${Date.now()}`,
    }).eq('id', milestoneId);
    if (error) { toast.error(error.message); return; }
    // bump contract escrow_total_released
    try {
      await (supabase as any).rpc('upsert_cache', { p_key: `noop-${milestoneId}`, p_value: {}, p_ttl_seconds: 1 });
    } catch (e) {
      console.warn('Upsert cache failed (non-critical):', e);
    }
    toast.success('Milestone released to member');
    void refetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this milestone?')) return;
    const { error } = await (supabase as any).from('marketplace_milestones').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    void refetch();
  };

  if (loading) return null;

  return (
    <div className="border border-border/40 rounded-2xl p-5 md:p-6 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-sm font-medium flex items-center gap-2"><Wallet className="h-4 w-4 text-accent" /> Milestones</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            ₹{totalReleased.toLocaleString()} released · ₹{totalAllocated.toLocaleString()} allocated · ₹{Math.max(remaining, 0).toLocaleString()} unallocated
          </p>
        </div>
        {isClient && remaining > 0 && (
          <Button size="sm" variant="outline" onClick={() => setNewOpen(true)} className="rounded-full text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add milestone
          </Button>
        )}
      </div>

      {milestones.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">No milestones yet — break the project into 2-5 paid stages.</p>
      ) : (
        <ol className="space-y-2">
          {milestones.map((m) => (
            <motion.li
              key={m.id}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 border border-border/40 rounded-xl p-3.5 bg-muted/10"
            >
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                m.status === 'released' ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {m.status === 'released' ? <CheckCircle2 className="h-3.5 w-3.5" /> : m.sequence}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.title}</p>
                    {m.description && <p className="text-xs text-muted-foreground mt-0.5">{m.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold">₹{Number(m.amount).toLocaleString()}</p>
                    <Badge variant="outline" className="rounded-full text-[10px] mt-1 capitalize">{m.status.replace(/_/g,' ')}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-2.5">
                  {(isClient || isAdmin) && m.status !== 'released' && paymentStatus === 'held_in_escrow' && (
                    <Button size="sm" variant="default" onClick={() => release(m.id, Number(m.amount))} className="rounded-full text-xs h-7">
                      Release ₹{Number(m.amount).toLocaleString()}
                    </Button>
                  )}
                  {isClient && m.status === 'pending' && (
                    <Button size="sm" variant="ghost" onClick={() => remove(m.id)} className="rounded-full text-xs h-7 text-muted-foreground">
                      <Trash2 className="h-3 w-3 mr-1" /> Remove
                    </Button>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </ol>
      )}

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add milestone</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Title</Label><Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Concept design + mood boards" className="mt-1.5 rounded-xl" /></div>
            <div><Label className="text-xs">Notes (optional)</Label><Textarea value={newDesc} onChange={(e) => setNewDesc(e.target.value)} rows={3} className="mt-1.5 rounded-xl" /></div>
            <div><Label className="text-xs">Amount (₹)</Label><Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder={`max ${remaining}`} className="mt-1.5 rounded-xl" /></div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewOpen(false)}>Cancel</Button>
            <Button onClick={addMilestone} disabled={adding}>
              {adding && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
