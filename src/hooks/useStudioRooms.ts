import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface StudioRoom {
  id: string;
  title: string;
  description: string | null;
  theme: string;
  cover_image_url: string | null;
  mentor_name: string | null;
  max_members: number;
  deadline: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

export interface RoomReview {
  id: string;
  room_id: string;
  user_id: string;
  content: string;
  review_type: string;
  image_url: string | null;
  parent_id: string | null;
  created_at: string;
  author_name?: string;
}

export function useStudioRooms() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<StudioRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('studio_rooms' as any)
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch rooms:', error);
      setLoading(false);
      return;
    }

    const roomsData = (data as any[]) || [];

    // Get member counts
    const roomIds = roomsData.map(r => r.id);
    if (roomIds.length > 0) {
      const { data: members } = await supabase
        .from('studio_room_members' as any)
        .select('room_id, user_id')
        .in('room_id', roomIds);

      const memberMap = new Map<string, { count: number; isMember: boolean }>();
      (members as any[] || []).forEach(m => {
        const entry = memberMap.get(m.room_id) || { count: 0, isMember: false };
        entry.count++;
        if (m.user_id === user?.id) entry.isMember = true;
        memberMap.set(m.room_id, entry);
      });

      setRooms(roomsData.map(r => ({
        ...r,
        member_count: memberMap.get(r.id)?.count || 0,
        is_member: memberMap.get(r.id)?.isMember || false,
      })));
    } else {
      setRooms([]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const createRoom = async (title: string, description: string, theme: string, mentorName?: string, deadline?: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from('studio_rooms' as any)
      .insert({
        title, description, theme,
        mentor_name: mentorName || null,
        deadline: deadline || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to create studio room');
      return null;
    }

    // Auto-join as creator
    await supabase.from('studio_room_members' as any).insert({
      room_id: (data as any).id,
      user_id: user.id,
      role: 'creator',
    });

    await fetchRooms();
    toast.success('Studio room created!');
    return data as any;
  };

  const joinRoom = async (roomId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from('studio_room_members' as any)
      .insert({ room_id: roomId, user_id: user.id, role: 'member' });

    if (error) {
      if (error.code === '23505') toast.info('You are already a member');
      else toast.error('Failed to join room');
      return;
    }
    toast.success('Joined studio room!');
    await fetchRooms();
  };

  const leaveRoom = async (roomId: string) => {
    if (!user) return;
    await supabase
      .from('studio_room_members' as any)
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id);
    toast.success('Left studio room');
    await fetchRooms();
  };

  return { rooms, loading, createRoom, joinRoom, leaveRoom, refetch: fetchRooms };
}

export function useRoomDetail(roomId: string | undefined) {
  const { user } = useAuth();
  const [room, setRoom] = useState<StudioRoom | null>(null);
  const [reviews, setReviews] = useState<RoomReview[]>([]);
  const [members, setMembers] = useState<{ user_id: string; role: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!roomId) return;
    setLoading(true);

    const [roomRes, reviewsRes, membersRes] = await Promise.all([
      supabase.from('studio_rooms' as any).select('*').eq('id', roomId).single(),
      supabase.from('studio_room_reviews' as any).select('*').eq('room_id', roomId).order('created_at', { ascending: true }),
      supabase.from('studio_room_members' as any).select('user_id, role').eq('room_id', roomId),
    ]);

    if (roomRes.data) setRoom(roomRes.data as any);

    const membersData = (membersRes.data as any[]) || [];
    const reviewsData = (reviewsRes.data as any[]) || [];
    const allUserIds = [...new Set([...membersData.map(m => m.user_id), ...reviewsData.map(r => r.user_id)])];

    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', allUserIds);
      const nameMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name || 'Anonymous']));

      setMembers(membersData.map(m => ({ ...m, name: nameMap.get(m.user_id) || 'Anonymous' })));
      setReviews(reviewsData.map(r => ({ ...r, author_name: nameMap.get(r.user_id) || 'Anonymous' })));
    } else {
      setMembers([]);
      setReviews([]);
    }
    setLoading(false);
  }, [roomId]);

  useEffect(() => {
    fetchDetail();
    if (!roomId) return;
    const channel = supabase
      .channel(`room-reviews-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'studio_room_reviews', filter: `room_id=eq.${roomId}` }, () => fetchDetail())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, fetchDetail]);

  const addReview = async (content: string, reviewType: string = 'discussion', parentId?: string) => {
    if (!user || !roomId) return;
    const { error } = await supabase.from('studio_room_reviews' as any).insert({
      room_id: roomId,
      user_id: user.id,
      content,
      review_type: reviewType,
      parent_id: parentId || null,
    });
    if (error) {
      toast.error('Failed to post');
      return;
    }
    await fetchDetail();
  };

  const isMember = members.some(m => m.user_id === user?.id);

  return { room, reviews, members, loading, isMember, addReview, refetch: fetchDetail };
}
