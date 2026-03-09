import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText, MessageSquare, Briefcase, Image, Trophy, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeedItem {
  id: string;
  user_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  target_title: string | null;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

const ACTION_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  uploaded_sheet: { icon: FileText, label: 'uploaded a sheet', color: 'text-blue-500' },
  gave_critique: { icon: MessageSquare, label: 'gave a critique', color: 'text-emerald-500' },
  published_portfolio: { icon: Briefcase, label: 'published portfolio', color: 'text-purple-500' },
  posted_topic: { icon: MessageSquare, label: 'asked a question', color: 'text-amber-500' },
  submitted_challenge: { icon: Image, label: 'submitted to challenge', color: 'text-pink-500' },
  won_challenge: { icon: Trophy, label: 'won a challenge', color: 'text-amber-500' },
  completed_course: { icon: Trophy, label: 'completed a course', color: 'text-accent' },
};

export function CommunityFeed({ limit = 20 }: { limit?: number }) {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeed = async () => {
      const { data: feedData } = await supabase
        .from('community_feed')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!feedData || feedData.length === 0) { setLoading(false); return; }

      // Fetch user profiles for feed items
      const userIds = [...new Set(feedData.map(f => f.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      setFeed(feedData.map(item => ({
        ...item,
        user_name: profileMap.get(item.user_id)?.full_name || 'Anonymous',
        user_avatar: profileMap.get(item.user_id)?.avatar_url || null,
      })));
      setLoading(false);
    };

    fetchFeed();

    // Subscribe to realtime
    const channel = supabase
      .channel('community-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'community_feed' }, async (payload) => {
        const newItem = payload.new as any;
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('user_id', newItem.user_id)
          .maybeSingle();

        setFeed(prev => [{
          ...newItem,
          user_name: profile?.full_name || 'Anonymous',
          user_avatar: profile?.avatar_url || null,
        }, ...prev].slice(0, limit));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [limit]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (feed.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No community activity yet. Be the first to contribute!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feed.map(item => {
        const config = ACTION_CONFIG[item.action] || ACTION_CONFIG.posted_topic;
        const Icon = config.icon;

        return (
          <Card key={item.id} className="bg-card/60 hover:bg-card/80 transition-colors">
            <CardContent className="p-4 flex items-start gap-3">
              <div className="shrink-0 h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold overflow-hidden">
                {item.user_avatar ? (
                  <img src={item.user_avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <Link to={`/profile/${item.user_id}`} className="font-semibold text-foreground hover:text-accent transition-colors">
                    {item.user_name}
                  </Link>
                  <span className="text-muted-foreground"> {config.label}</span>
                </p>
                {item.target_title && (
                  <p className="text-sm text-foreground/80 mt-0.5 truncate font-medium">
                    {item.target_title}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                </p>
              </div>
              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${config.color}`} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
