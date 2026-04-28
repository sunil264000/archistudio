// Hooks for Studio Hub milestones, versioned deliverables, chat receipts & typing
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type MilestoneStatus =
  | 'pending' | 'in_progress' | 'submitted' | 'approved' | 'released' | 'rejected' | 'cancelled';

export interface Milestone {
  id: string;
  contract_id: string;
  sequence: number;
  title: string;
  description: string | null;
  amount: number;
  due_date: string | null;
  status: MilestoneStatus;
  released_amount: number;
  payout_reference: string | null;
  released_at: string | null;
  released_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface VersionedDeliverable {
  id: string;
  contract_id: string;
  milestone_id: string | null;
  worker_id: string;
  version: number;
  title: string;
  notes: string | null;
  file_urls: string[];
  status: 'pending_review' | 'approved' | 'rejected' | 'revision_requested' | 'released_to_client';
  admin_notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- Milestones ----------
export function useMilestones(contractId?: string) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!contractId) { setMilestones([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from('marketplace_milestones')
      .select('*')
      .eq('contract_id', contractId)
      .order('sequence', { ascending: true });
    setMilestones((data || []) as Milestone[]);
    setLoading(false);
  }, [contractId]);

  useEffect(() => { void refetch(); }, [refetch]);

  // Realtime
  useEffect(() => {
    if (!contractId) return;
    const ch = supabase
      .channel(`milestones-${contractId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'marketplace_milestones', filter: `contract_id=eq.${contractId}` },
        () => { void refetch(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [contractId, refetch]);

  return { milestones, loading, refetch };
}

// ---------- Versioned deliverables ----------
export function useVersionedDeliverables(contractId?: string) {
  const [items, setItems] = useState<VersionedDeliverable[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    if (!contractId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await (supabase as any)
      .from('marketplace_deliverables')
      .select('*')
      .eq('contract_id', contractId)
      .order('version', { ascending: false });
    setItems((data || []) as VersionedDeliverable[]);
    setLoading(false);
  }, [contractId]);

  useEffect(() => { void refetch(); }, [refetch]);

  useEffect(() => {
    if (!contractId) return;
    const ch = supabase
      .channel(`deliverables-${contractId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'marketplace_deliverables', filter: `contract_id=eq.${contractId}` },
        () => { void refetch(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [contractId, refetch]);

  return { items, loading, refetch };
}

// ---------- Read receipts (unread badge for chat) ----------
export function useUnreadCount(contractId?: string, userId?: string | null) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!contractId || !userId) return;
    const { data: rec } = await (supabase as any)
      .from('marketplace_message_reads')
      .select('last_read_at')
      .eq('contract_id', contractId).eq('user_id', userId).maybeSingle();

    const since = rec?.last_read_at || '1970-01-01';
    const { count: c } = await (supabase as any)
      .from('marketplace_messages')
      .select('id', { count: 'exact', head: true })
      .eq('contract_id', contractId)
      .neq('sender_id', userId)
      .gt('created_at', since);
    setCount(c || 0);
  }, [contractId, userId]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!contractId) return;
    const ch = supabase
      .channel(`unread-${contractId}-${userId || 'a'}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'marketplace_messages', filter: `contract_id=eq.${contractId}` },
        () => { void refresh(); })
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [contractId, userId, refresh]);

  const markRead = useCallback(async () => {
    if (!contractId || !userId) return;
    await (supabase as any).from('marketplace_message_reads').upsert(
      { contract_id: contractId, user_id: userId, last_read_at: new Date().toISOString() },
      { onConflict: 'contract_id,user_id' }
    );
    setCount(0);
  }, [contractId, userId]);

  return { count, markRead, refresh };
}

// ---------- Typing indicator ----------
export function useTypingIndicator(contractId?: string, userId?: string | null) {
  const [othersTyping, setOthersTyping] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subscribe to others typing
  useEffect(() => {
    if (!contractId || !userId) return;
    let mounted = true;
    const refresh = async () => {
      const cutoff = new Date(Date.now() - 8000).toISOString();
      const { data } = await (supabase as any)
        .from('marketplace_typing_indicators')
        .select('user_id, is_typing, updated_at')
        .eq('contract_id', contractId)
        .neq('user_id', userId)
        .eq('is_typing', true)
        .gte('updated_at', cutoff);
      if (mounted) setOthersTyping((data || []).map((d: any) => d.user_id));
    };
    void refresh();

    const ch = supabase
      .channel(`typing-${contractId}-${userId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'marketplace_typing_indicators', filter: `contract_id=eq.${contractId}` },
        () => { void refresh(); })
      .subscribe();
    const interval = setInterval(refresh, 4000);
    return () => { mounted = false; void supabase.removeChannel(ch); clearInterval(interval); };
  }, [contractId, userId]);

  const setTyping = useCallback((typing: boolean) => {
    if (!contractId || !userId) return;
    void (supabase as any).from('marketplace_typing_indicators').upsert(
      { contract_id: contractId, user_id: userId, is_typing: typing, updated_at: new Date().toISOString() },
      { onConflict: 'contract_id,user_id' }
    );
  }, [contractId, userId]);

  const ping = useCallback(() => {
    setTyping(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setTyping(false), 4000);
  }, [setTyping]);

  return { othersTyping, ping, setTyping };
}
