import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users } from 'lucide-react';

export function FollowStats({ userId }: { userId: string }) {
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    Promise.all([
      supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('follower_id', userId),
    ]).then(([followersRes, followingRes]) => {
      setFollowers(followersRes.count || 0);
      setFollowing(followingRes.count || 0);
    });
  }, [userId]);

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="flex items-center gap-1.5">
        <Users className="h-3.5 w-3.5 text-muted-foreground" />
        <strong className="text-foreground">{followers}</strong>
        <span className="text-muted-foreground">followers</span>
      </span>
      <span>
        <strong className="text-foreground">{following}</strong>
        <span className="text-muted-foreground ml-1">following</span>
      </span>
    </div>
  );
}
