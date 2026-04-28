// In-contract messaging panel with realtime updates
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, MessagesSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface Msg {
  id: string;
  contract_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}

export function ContractChat({ contractId }: { contractId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('marketplace_messages')
      .select('id, contract_id, sender_id, body, created_at')
      .eq('contract_id', contractId)
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages((data || []) as Msg[]);
    setLoading(false);
  }, [contractId]);

  useEffect(() => { void load(); }, [load]);

  // Realtime subscription
  useEffect(() => {
    if (!contractId) return;
    const ch = supabase
      .channel(`contract-msgs-${contractId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'marketplace_messages', filter: `contract_id=eq.${contractId}` },
        (payload) => {
          const m = payload.new as Msg;
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        }
      )
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [contractId]);

  // Autoscroll on new messages
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
    });
  }, [messages.length]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !body.trim()) return;
    setSending(true);
    const { error } = await (supabase as any).from('marketplace_messages').insert({
      contract_id: contractId, sender_id: user.id, body: body.trim(),
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setBody('');
  };

  return (
    <div className="border border-border/40 rounded-2xl bg-background overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/40 bg-muted/20">
        <MessagesSquare className="h-4 w-4 text-accent" />
        <p className="text-sm font-medium">Conversation</p>
        <span className="ml-auto text-[10px] text-muted-foreground tracking-wider uppercase">Realtime</span>
      </div>
      <div ref={scrollerRef} className="flex-1 max-h-[420px] overflow-y-auto px-5 py-4 space-y-3 scroll-smooth">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-10">No messages yet — say hello and align on the brief.</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${mine ? 'bg-foreground text-background rounded-br-md' : 'bg-muted/60 rounded-bl-md'}`}>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`text-[10px] mt-1 ${mine ? 'text-background/60' : 'text-muted-foreground'}`}>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
      <form onSubmit={send} className="border-t border-border/40 p-3 flex items-end gap-2 bg-muted/10">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message…"
          rows={1}
          maxLength={2000}
          className="resize-none min-h-[40px] max-h-32 rounded-xl border-border/60 bg-background"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e as any); } }}
        />
        <Button type="submit" size="icon" disabled={sending || !body.trim()} className="rounded-xl bg-foreground text-background hover:bg-foreground/90 shrink-0">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}
