import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileImage, MessageSquare, Paintbrush, Award, Users, Zap } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface FeedItem {
  id: string;
  user_id: string;
  action: string;
  target_type: string | null;
  target_title: string | null;
  metadata: any;
  created_at: string;
}

const ACTION_ICONS: Record<string, any> = {
  'enrolled in a course': BookOpen,
  'uploaded a design sheet': FileImage,
  'wrote a sheet critique': MessageSquare,
  'answered a forum question': MessageSquare,
  'published their portfolio': Paintbrush,
  'submitted a challenge entry': Award,
  'completed a course': Award,
};

export function ActivityFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      const { data } = await supabase
        .from('activity_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      setItems((data as FeedItem[]) || []);
      setLoading(false);
    };
    fetchFeed();

    // Subscribe to realtime
    const channel = supabase
      .channel('activity-feed-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_feed' }, (payload) => {
        setItems(prev => [payload.new as FeedItem, ...prev].slice(0, 50));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Zap className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">No activity yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[400px]">
      <div className="space-y-1 p-1">
        {items.map((item) => {
          const Icon = ACTION_ICONS[item.action] || Zap;
          const actorName = item.metadata?.actor_name || 'Someone';
          const points = item.metadata?.points;

          return (
            <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
              <div className="h-7 w-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Icon className="h-3.5 w-3.5 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug">
                  <span className="font-medium text-foreground">{actorName}</span>{' '}
                  <span className="text-muted-foreground">{item.action}</span>
                </p>
                {item.target_title && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">"{item.target_title}"</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                  {points > 0 && (
                    <Badge variant="outline" className="text-[9px] h-4 px-1">+{points} pts</Badge>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
