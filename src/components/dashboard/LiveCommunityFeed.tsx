import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, FileImage, MessageSquare, Paintbrush, Award, Zap, Users } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface FeedItem {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_title: string | null;
  metadata: any;
  created_at: string;
}

const ACTION_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  'enrolled': { icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  'uploaded': { icon: FileImage, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  'critiqued': { icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  'answered': { icon: MessageSquare, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  'completed': { icon: Award, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  'published': { icon: Paintbrush, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  'submitted': { icon: Award, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
};

function getConfig(action: string) {
  for (const [key, config] of Object.entries(ACTION_CONFIG)) {
    if (action.toLowerCase().includes(key)) return config;
  }
  return { icon: Zap, color: 'text-accent', bg: 'bg-accent/10' };
}

export function LiveCommunityFeed({ maxItems = 15 }: { maxItems?: number }) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      const { data } = await supabase
        .from('community_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(maxItems);
      setItems((data as FeedItem[]) || []);
      setLoading(false);
    };
    fetchFeed();

    // Realtime subscription
    const channel = supabase
      .channel('live-community-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_feed' }, (payload) => {
        setItems(prev => [payload.new as FeedItem, ...prev].slice(0, maxItems + 10));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [maxItems]);

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-2.5">
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Users className="h-6 w-6 mx-auto mb-1.5 opacity-40" />
        <p className="text-xs">No community activity yet</p>
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[320px]">
      <div className="space-y-0.5 p-1">
        <AnimatePresence mode="popLayout">
          {items.map((item) => {
            const config = getConfig(item.action);
            const Icon = config.icon;
            const actorName = item.metadata?.actor_name || 'Someone';

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                layout
                className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className={`h-6 w-6 rounded-full ${config.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className={`h-3 w-3 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-snug">
                    <span className="font-medium text-foreground">{actorName}</span>{' '}
                    <span className="text-muted-foreground">{item.action}</span>
                  </p>
                  {item.target_title && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      "{item.target_title}"
                    </p>
                  )}
                  <span className="text-[10px] text-muted-foreground/50">
                    {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ScrollArea>
  );
}
