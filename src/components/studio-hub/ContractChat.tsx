// In-contract messaging panel with realtime updates
import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, Loader2, MessagesSquare, CheckCheck, Paperclip, FileText, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useTypingIndicator, useUnreadCount } from '@/hooks/useStudioHubMilestones';

interface Msg {
  id: string;
  contract_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  attachments?: string[];
  read_at?: string | null;
}

export function ContractChat({ contractId }: { contractId: string }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { othersTyping, ping, setTyping } = useTypingIndicator(contractId, user?.id);
  const { count: unread, markRead } = useUnreadCount(contractId, user?.id);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('marketplace_messages')
      .select('id, contract_id, sender_id, body, created_at, attachments, read_at')
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

  // Autoscroll on new messages + mark read
  useEffect(() => {
    requestAnimationFrame(() => {
      scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
    });
    if (messages.length > 0) void markRead();
  }, [messages.length, markRead]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!body.trim() && !files?.length)) return;
    setSending(true);

    let uploadedUrls: string[] = [];
    if (files && files.length > 0) {
      setUploading(true);
      for (const file of Array.from(files)) {
        const path = `chat/${contractId}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('studio-hub-deliverables').upload(path, file);
        if (uploadError) { toast.error(uploadError.message); setSending(false); setUploading(false); return; }
        
        const { data: { publicUrl } } = supabase.storage.from('studio-hub-deliverables').getPublicUrl(path);
        uploadedUrls.push(publicUrl);
      }
      setUploading(false);
    }

    const { error } = await (supabase as any).from('marketplace_messages').insert({
      contract_id: contractId, sender_id: user.id, body: body.trim(), attachments: uploadedUrls
    });
    setSending(false);
    if (error) { toast.error(error.message); return; }
    
    setBody('');
    setFiles(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setTyping(false);
    void markRead();
  };

  return (
    <div className="border border-border/40 rounded-2xl bg-background overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 px-4 md:px-5 py-3 md:py-3.5 border-b border-border/40 bg-muted/20">
        <MessagesSquare className="h-4 w-4 text-accent" />
        <p className="text-sm font-medium">Conversation</p>
        {unread > 0 && (
          <Badge variant="default" className="rounded-full h-5 min-w-5 px-1.5 text-[10px] bg-rose-500 text-white">{unread}</Badge>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground tracking-wider uppercase hidden sm:inline">Realtime</span>
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
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                  
                  {m.attachments && m.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {m.attachments.map((url, idx) => {
                        const isImg = url.match(/\.(jpeg|jpg|gif|png)$/i);
                        return isImg ? (
                          <a key={idx} href={url} target="_blank" rel="noreferrer" className="block mt-2">
                            <img src={url} alt="attachment" className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-border/20" />
                          </a>
                        ) : (
                          <a key={idx} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-xs hover:underline mt-1 bg-background/20 p-2 rounded-lg">
                            <FileText className="h-3 w-3" /> Attachment {idx + 1}
                          </a>
                        );
                      })}
                    </div>
                  )}

                  <div className={`text-[10px] mt-1 flex items-center gap-1 ${mine ? 'text-background/60' : 'text-muted-foreground'}`}>
                    <span>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}</span>
                    {mine && <CheckCheck className={`h-3 w-3 ml-1 ${m.read_at ? 'text-blue-400' : 'opacity-60'}`} />}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      {othersTyping.length > 0 && (
        <div className="px-5 pb-1.5 text-[11px] text-muted-foreground italic flex items-center gap-1.5">
          <span className="inline-flex gap-0.5">
            <span className="h-1 w-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="h-1 w-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="h-1 w-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
          typing…
        </div>
      )}
      {messages.length > 0 && messages[messages.length - 1].sender_id === user?.id && (
        <div className="px-5 pb-1 text-[10px] text-muted-foreground/60 text-right flex items-center justify-end gap-1">
          <CheckCheck className="h-3 w-3" /> Sent
        </div>
      )}
      <form onSubmit={send} className="border-t border-border/40 p-2.5 md:p-3 bg-muted/10">
        {files && files.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {Array.from(files).map((file, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-[100px]">{file.name}</span>
                <Button type="button" variant="ghost" size="icon" className="h-4 w-4 ml-1 rounded-full p-0" onClick={() => setFiles(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2">
          <Button type="button" size="icon" variant="outline" className="rounded-xl h-11 w-11 shrink-0 bg-background" onClick={() => fileInputRef.current?.click()}>
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" multiple onChange={(e) => setFiles(e.target.files)} />
          
          <Textarea
            value={body}
            onChange={(e) => { setBody(e.target.value); ping(); }}
            placeholder="Type a message…"
            rows={1}
            maxLength={2000}
            className="resize-none min-h-[44px] max-h-32 rounded-xl border-border/60 bg-background text-base md:text-sm flex-1"
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(e as any); } }}
          />
          <Button type="submit" size="icon" disabled={sending || uploading || (!body.trim() && !files?.length)} className="rounded-xl h-11 w-11 bg-foreground text-background hover:bg-foreground/90 shrink-0">
            {(sending || uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}
