// Admin: Cashfree webhook + escrow reconciliation dashboard
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldAlert, ShieldCheck, RefreshCw, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';

interface WebhookEvent {
  id: string;
  event_type: string;
  order_id: string | null;
  signature_valid: boolean;
  processed: boolean;
  processing_error: string | null;
  contract_id: string | null;
  received_at: string;
  raw_payload: any;
}

export function CashfreeWebhookDashboard() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data: ev }, { data: ct }] = await Promise.all([
      (supabase as any).from('cashfree_webhook_events').select('*').order('received_at', { ascending: false }).limit(100),
      (supabase as any).from('marketplace_contracts')
        .select('id, agreed_amount, escrow_total_funded, escrow_total_released, payment_status, status, payment_reference')
        .neq('payment_status', 'pending').order('created_at', { ascending: false }).limit(50),
    ]);
    setEvents((ev || []) as WebhookEvent[]);
    setContracts(ct || []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => {
    const total = events.length;
    const invalid = events.filter(e => !e.signature_valid).length;
    const failed = events.filter(e => !e.processed).length;
    const mismatched = contracts.filter(c => Number(c.escrow_total_funded) > 0 && Number(c.escrow_total_funded) < Number(c.agreed_amount)).length;
    return { total, invalid, failed, mismatched };
  }, [events, contracts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Escrow & webhook health</h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time view of Cashfree webhook deliveries and escrow reconciliation.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading} className="rounded-full">
          {loading ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5 mr-2" />} Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Webhook events (100)" value={stats.total} />
        <Stat label="Invalid signatures" value={stats.invalid} tone={stats.invalid ? 'danger' : 'ok'} />
        <Stat label="Failed processing" value={stats.failed} tone={stats.failed ? 'warn' : 'ok'} />
        <Stat label="Underfunded contracts" value={stats.mismatched} tone={stats.mismatched ? 'warn' : 'ok'} />
      </div>

      <section>
        <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Recent webhook events</p>
        <div className="border border-border/40 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/20 border-b border-border/40">
            <div className="col-span-3">Event</div>
            <div className="col-span-3">Order</div>
            <div className="col-span-2">Signature</div>
            <div className="col-span-2">Processed</div>
            <div className="col-span-2 text-right">Received</div>
          </div>
          {events.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No webhook events yet.</p>
          ) : (
            events.map((e) => (
              <div key={e.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs border-b border-border/30 last:border-b-0 items-center">
                <div className="col-span-3 truncate font-mono">{e.event_type}</div>
                <div className="col-span-3 truncate font-mono text-muted-foreground">{e.order_id || '—'}</div>
                <div className="col-span-2">
                  {e.signature_valid
                    ? <Badge variant="outline" className="rounded-full text-[10px] border-emerald-500/30 text-emerald-600"><ShieldCheck className="h-2.5 w-2.5 mr-1" /> valid</Badge>
                    : <Badge variant="outline" className="rounded-full text-[10px] border-rose-500/30 text-rose-500"><ShieldAlert className="h-2.5 w-2.5 mr-1" /> invalid</Badge>}
                </div>
                <div className="col-span-2">
                  {e.processed
                    ? <Badge variant="outline" className="rounded-full text-[10px]">ok</Badge>
                    : <Badge variant="outline" className="rounded-full text-[10px] text-amber-600 border-amber-500/30" title={e.processing_error || ''}>
                        <AlertTriangle className="h-2.5 w-2.5 mr-1" /> {e.processing_error ? 'error' : 'pending'}
                      </Badge>}
                </div>
                <div className="col-span-2 text-right text-muted-foreground">{formatDistanceToNow(new Date(e.received_at), { addSuffix: true })}</div>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <p className="text-[11px] tracking-[0.18em] text-muted-foreground/70 uppercase mb-3">Escrow reconciliation</p>
        <div className="border border-border/40 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/20 border-b border-border/40">
            <div className="col-span-3">Contract</div>
            <div className="col-span-2 text-right">Agreed</div>
            <div className="col-span-2 text-right">Funded</div>
            <div className="col-span-2 text-right">Released</div>
            <div className="col-span-3 text-right">State</div>
          </div>
          {contracts.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">No funded contracts yet.</p>
          ) : (
            contracts.map((c) => {
              const ok = Number(c.escrow_total_funded) >= Number(c.agreed_amount);
              return (
                <div key={c.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs border-b border-border/30 last:border-b-0 items-center">
                  <div className="col-span-3 font-mono truncate">{c.id.slice(0,8)}</div>
                  <div className="col-span-2 text-right">₹{Number(c.agreed_amount).toLocaleString()}</div>
                  <div className="col-span-2 text-right">₹{Number(c.escrow_total_funded).toLocaleString()}</div>
                  <div className="col-span-2 text-right">₹{Number(c.escrow_total_released).toLocaleString()}</div>
                  <div className="col-span-3 text-right">
                    <Badge variant="outline" className={`rounded-full text-[10px] ${ok ? 'border-emerald-500/30 text-emerald-600' : 'border-amber-500/30 text-amber-600'}`}>
                      {ok ? 'reconciled' : 'underfunded'}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, tone = 'ok' }: { label: string; value: number; tone?: 'ok' | 'warn' | 'danger' }) {
  const color = tone === 'danger' ? 'text-rose-500' : tone === 'warn' ? 'text-amber-500' : 'text-foreground';
  return (
    <div className="border border-border/40 rounded-2xl p-4 bg-muted/10">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`font-display text-2xl font-semibold mt-1 ${color}`}>{value}</p>
    </div>
  );
}
