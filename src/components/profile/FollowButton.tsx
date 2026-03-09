import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FollowButtonProps {
  targetUserId: string;
  className?: string;
}

export function FollowButton({ targetUserId, className }: FollowButtonProps) {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user || user.id === targetUserId) { setLoading(false); return; }
    
    supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle()
      .then(({ data }) => {
        setIsFollowing(!!data);
        setLoading(false);
      });
  }, [user, targetUserId]);

  if (!user || user.id === targetUserId || loading) return null;

  const handleToggle = async () => {
    setActionLoading(true);
    if (isFollowing) {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
      if (!error) { setIsFollowing(false); toast.success('Unfollowed'); }
    } else {
      const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: user.id, following_id: targetUserId });
      if (!error) { setIsFollowing(true); toast.success('Following!'); }
    }
    setActionLoading(false);
  };

  return (
    <Button
      variant={isFollowing ? 'outline' : 'default'}
      size="sm"
      onClick={handleToggle}
      disabled={actionLoading}
      className={className}
    >
      {actionLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : isFollowing ? (
        <><UserCheck className="h-3.5 w-3.5 mr-1.5" /> Following</>
      ) : (
        <><UserPlus className="h-3.5 w-3.5 mr-1.5" /> Follow</>
      )}
    </Button>
  );
}
