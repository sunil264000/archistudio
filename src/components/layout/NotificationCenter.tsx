import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Loader2, Info, MessageSquare, Zap, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function NotificationCenter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Realtime subscription
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    setNotifications(data || []);
    setUnreadCount((data || []).filter(n => !n.read).length);
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    fetchNotifications();
  };

  const deleteNotification = async (id: string) => {
    await supabase.from('notifications').delete().eq('id', id);
    fetchNotifications();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'bid': return <Zap className="h-4 w-4 text-accent" />;
      case 'forum': return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'internship': return <Briefcase className="h-4 w-4 text-emerald-500" />;
      default: return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full hover:bg-accent/10">
          <Bell className="h-4 w-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-background/95 backdrop-blur-xl border-accent/20 shadow-2xl" align="end">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <h4 className="text-xs font-display font-bold uppercase tracking-widest text-foreground">Notifications</h4>
          {unreadCount > 0 && (
            <Badge variant="outline" className="text-[9px] border-accent/20 text-accent">{unreadCount} New</Badge>
          )}
        </div>
        <ScrollArea className="h-[350px]">
          {loading ? (
            <div className="p-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-accent" /></div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">No notifications yet.</div>
          ) : (
            <div className="grid">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 border-b border-border/20 group hover:bg-accent/[0.03] transition-colors relative ${!n.is_read ? 'bg-accent/[0.02]' : ''}`}
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5">{getIcon(n.type)}</div>
                    <div className="flex-1 space-y-1">
                      <p className={`text-xs font-semibold ${!n.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground/80 line-clamp-2">{n.message}</p>
                      <p className="text-[9px] text-muted-foreground/40">{formatDistanceToNow(new Date(n.created_at))} ago</p>
                    </div>
                  </div>
                  <div className="absolute top-4 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                    {!n.is_read && (
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md" onClick={() => markAsRead(n.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:text-destructive" onClick={() => deleteNotification(n.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  {n.link && (
                    <div className="mt-2 pl-7">
                      <Button variant="outline" size="sm" className="h-6 text-[9px] rounded-lg border-accent/20" onClick={() => { markAsRead(n.id); navigate(n.link); }}>
                        View Details
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
