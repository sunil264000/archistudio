import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, Trash2, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    setMessages((data as ContactMessage[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchMessages(); }, []);

  const markAsRead = async (id: string) => {
    await supabase.from('contact_messages').update({ is_read: true }).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m));
    toast.success('Marked as read');
  };

  const deleteMessage = async (id: string) => {
    await supabase.from('contact_messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    toast.success('Message deleted');
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-accent" />
          Contact Messages
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">{unreadCount} new</Badge>
          )}
        </CardTitle>
        <CardDescription>{messages.length} total messages</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No messages yet.</p>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <div 
                key={msg.id} 
                className={`p-4 border rounded-xl space-y-2 transition-colors ${
                  !msg.is_read ? 'bg-accent/5 border-accent/30' : 'hover:bg-muted/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{msg.name}</span>
                      {!msg.is_read && <Badge variant="default" className="text-xs">New</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{msg.email} {msg.phone && `• ${msg.phone}`}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(msg.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="font-medium text-sm">{msg.subject}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{msg.message}</p>
                <div className="flex gap-2 pt-1">
                  {!msg.is_read && (
                    <Button size="sm" variant="outline" onClick={() => markAsRead(msg.id)} className="gap-1">
                      <Check className="h-3 w-3" /> Mark Read
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-destructive gap-1" onClick={() => deleteMessage(msg.id)}>
                    <Trash2 className="h-3 w-3" /> Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
