import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SheetReview {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  sheet_url: string;
  thumbnail_url: string | null;
  status: string;
  is_featured: boolean;
  tags: string[];
  critique_count: number;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar?: string;
}

export interface SheetCritique {
  id: string;
  sheet_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  is_best_answer: boolean;
  upvote_count: number;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  has_upvoted?: boolean;
  replies?: SheetCritique[];
}

export function useSheetReviews() {
  const { user } = useAuth();
  const [sheets, setSheets] = useState<SheetReview[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSheets = useCallback(async (filter?: { featured?: boolean; tag?: string }) => {
    setLoading(true);
    let query = supabase
      .from('sheet_reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter?.featured) query = query.eq('is_featured', true);
    if (filter?.tag) query = query.contains('tags', [filter.tag]);

    const { data, error } = await query;
    if (error) { toast.error('Failed to load sheets'); setLoading(false); return; }

    // Fetch author profiles
    const userIds = [...new Set((data || []).map(s => s.user_id))];
    let profiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      if (profileData) {
        profileData.forEach(p => { profiles[p.user_id] = p; });
      }
    }

    setSheets((data || []).map(s => ({
      ...s,
      tags: s.tags || [],
      author_name: profiles[s.user_id]?.full_name || 'Anonymous',
      author_avatar: profiles[s.user_id]?.avatar_url || undefined,
    })));
    setLoading(false);
  }, []);

  const uploadSheet = async (file: File, title: string, description: string, tags: string[]) => {
    if (!user) { toast.error('Please sign in to upload'); return null; }

    const ext = file.name.split('.').pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('sheet-uploads')
      .upload(path, file, { contentType: file.type });

    if (uploadError) { toast.error('Upload failed'); return null; }

    const { data: urlData } = supabase.storage.from('sheet-uploads').getPublicUrl(path);

    const { data, error } = await supabase
      .from('sheet_reviews')
      .insert({
        user_id: user.id,
        title,
        description: description || null,
        sheet_url: urlData.publicUrl,
        thumbnail_url: urlData.publicUrl,
        tags,
      })
      .select()
      .single();

    if (error) { toast.error('Failed to create sheet review'); return null; }
    toast.success('Sheet uploaded! Request critiques from the community.');
    return data;
  };

  const deleteSheet = async (id: string) => {
    const { error } = await supabase.from('sheet_reviews').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    setSheets(prev => prev.filter(s => s.id !== id));
    toast.success('Sheet deleted');
  };

  const toggleFeatured = async (id: string, featured: boolean) => {
    const { error } = await supabase.from('sheet_reviews').update({ is_featured: featured }).eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    setSheets(prev => prev.map(s => s.id === id ? { ...s, is_featured: featured } : s));
  };

  useEffect(() => { fetchSheets(); }, [fetchSheets]);

  return { sheets, loading, fetchSheets, uploadSheet, deleteSheet, toggleFeatured };
}

export function useSheetDetail(sheetId: string | undefined) {
  const { user } = useAuth();
  const [sheet, setSheet] = useState<SheetReview | null>(null);
  const [critiques, setCritiques] = useState<SheetCritique[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!sheetId) return;
    setLoading(true);

    const { data: sheetData, error } = await supabase
      .from('sheet_reviews')
      .select('*')
      .eq('id', sheetId)
      .single();

    if (error || !sheetData) { setLoading(false); return; }

    // Author profile
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('user_id', sheetData.user_id)
      .single();

    setSheet({
      ...sheetData,
      tags: sheetData.tags || [],
      author_name: authorProfile?.full_name || 'Anonymous',
      author_avatar: authorProfile?.avatar_url || undefined,
    });

    // Fetch critiques
    const { data: critiqueData } = await supabase
      .from('sheet_critiques')
      .select('*')
      .eq('sheet_id', sheetId)
      .order('created_at', { ascending: true });

    const critiqueUserIds = [...new Set((critiqueData || []).map(c => c.user_id))];
    let profiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
    if (critiqueUserIds.length > 0) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', critiqueUserIds);
      if (pData) pData.forEach(p => { profiles[p.user_id] = p; });
    }

    // Fetch user's upvotes
    let userUpvotes = new Set<string>();
    if (user) {
      const { data: upvoteData } = await supabase
        .from('sheet_critique_upvotes')
        .select('critique_id')
        .eq('user_id', user.id);
      if (upvoteData) upvoteData.forEach(u => userUpvotes.add(u.critique_id));
    }

    const enriched = (critiqueData || []).map(c => ({
      ...c,
      author_name: profiles[c.user_id]?.full_name || 'Anonymous',
      author_avatar: profiles[c.user_id]?.avatar_url || undefined,
      has_upvoted: userUpvotes.has(c.id),
    }));

    // Thread: separate top-level and replies
    const topLevel = enriched.filter(c => !c.parent_id);
    const replies = enriched.filter(c => c.parent_id);
    const threaded = topLevel.map(c => ({
      ...c,
      replies: replies.filter(r => r.parent_id === c.id),
    }));

    setCritiques(threaded);
    setLoading(false);
  }, [sheetId, user]);

  const addCritique = async (content: string, parentId?: string) => {
    if (!user || !sheetId) { toast.error('Please sign in'); return; }

    const { error } = await supabase.from('sheet_critiques').insert({
      sheet_id: sheetId,
      user_id: user.id,
      content,
      parent_id: parentId || null,
    });

    if (error) { toast.error('Failed to post critique'); return; }

    // Update count
    await supabase.from('sheet_reviews')
      .update({ critique_count: (sheet?.critique_count || 0) + 1 })
      .eq('id', sheetId);

    toast.success('Critique posted!');
    fetchDetail();
  };

  const toggleUpvote = async (critiqueId: string, hasUpvoted: boolean) => {
    if (!user) { toast.error('Please sign in to upvote'); return; }

    if (hasUpvoted) {
      await supabase.from('sheet_critique_upvotes')
        .delete()
        .eq('critique_id', critiqueId)
        .eq('user_id', user.id);

      await supabase.from('sheet_critiques')
        .update({ upvote_count: Math.max(0, (critiques.flatMap(c => [c, ...(c.replies || [])]).find(c => c.id === critiqueId)?.upvote_count || 1) - 1) })
        .eq('id', critiqueId);
    } else {
      await supabase.from('sheet_critique_upvotes')
        .insert({ critique_id: critiqueId, user_id: user.id });

      await supabase.from('sheet_critiques')
        .update({ upvote_count: (critiques.flatMap(c => [c, ...(c.replies || [])]).find(c => c.id === critiqueId)?.upvote_count || 0) + 1 })
        .eq('id', critiqueId);
    }

    fetchDetail();
  };

  const markBestAnswer = async (critiqueId: string) => {
    if (!user || !sheet || sheet.user_id !== user.id) {
      toast.error('Only the sheet owner can mark best answer');
      return;
    }

    // Unmark all existing best answers for this sheet
    await supabase.from('sheet_critiques')
      .update({ is_best_answer: false })
      .eq('sheet_id', sheetId!)
      .eq('is_best_answer', true);

    // Mark new best answer
    await supabase.from('sheet_critiques')
      .update({ is_best_answer: true })
      .eq('id', critiqueId);

    // Close the sheet
    await supabase.from('sheet_reviews')
      .update({ status: 'resolved' })
      .eq('id', sheetId!);

    toast.success('Best critique marked!');
    fetchDetail();
  };

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  return { sheet, critiques, loading, addCritique, toggleUpvote, markBestAnswer, refetch: fetchDetail };
}
