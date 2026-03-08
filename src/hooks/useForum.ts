import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export type ForumCategory = 'concept' | 'sheets' | 'software' | 'thesis' | 'site-analysis' | 'portfolio' | 'general';

export const FORUM_CATEGORIES: { value: ForumCategory; label: string; color: string }[] = [
  { value: 'concept', label: 'Concept Development', color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  { value: 'sheets', label: 'Sheet Presentation', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  { value: 'software', label: 'Software Help', color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  { value: 'thesis', label: 'Thesis Discussion', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
  { value: 'site-analysis', label: 'Site Analysis', color: 'bg-rose-500/15 text-rose-400 border-rose-500/20' },
  { value: 'portfolio', label: 'Portfolio Help', color: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20' },
  { value: 'general', label: 'General', color: 'bg-muted text-muted-foreground border-border' },
];

export interface ForumTopic {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: ForumCategory;
  tags: string[];
  upvote_count: number;
  view_count: number;
  answer_count: number;
  is_resolved: boolean;
  is_pinned: boolean;
  best_answer_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

export interface ForumAnswer {
  id: string;
  topic_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  upvote_count: number;
  is_best_answer: boolean;
  created_at: string;
  updated_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null } | null;
}

export function useForumTopics(category?: ForumCategory) {
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    let query = (supabase as any)
      .from('forum_topics')
      .select('*, profiles:user_id(full_name, avatar_url)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(50);

    if (category) query = query.eq('category', category);

    const { data, error } = await query;
    if (error) console.error('Error fetching topics:', error);
    setTopics(data || []);
    setLoading(false);
  }, [category]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  return { topics, loading, refetch: fetchTopics };
}

export function useForumTopic(topicId: string | undefined) {
  const { user } = useAuth();
  const [topic, setTopic] = useState<ForumTopic | null>(null);
  const [answers, setAnswers] = useState<ForumAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());

  const fetchTopic = useCallback(async () => {
    if (!topicId) return;
    setLoading(true);

    const [topicRes, answersRes] = await Promise.all([
      (supabase as any).from('forum_topics')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('id', topicId).single(),
      (supabase as any).from('forum_answers')
        .select('*, profiles:user_id(full_name, avatar_url)')
        .eq('topic_id', topicId)
        .order('is_best_answer', { ascending: false })
        .order('upvote_count', { ascending: false })
        .order('created_at', { ascending: true }),
    ]);

    if (topicRes.data) {
      setTopic(topicRes.data);
      // Increment view count
      (supabase as any).from('forum_topics')
        .update({ view_count: (topicRes.data.view_count || 0) + 1 })
        .eq('id', topicId).then(() => {});
    }
    setAnswers(answersRes.data || []);

    if (user) {
      const { data: votes } = await (supabase as any).from('forum_votes')
        .select('target_id').eq('user_id', user.id);
      setUserVotes(new Set((votes || []).map((v: any) => v.target_id)));
    }

    setLoading(false);
  }, [topicId, user]);

  useEffect(() => { fetchTopic(); }, [fetchTopic]);

  const createAnswer = async (content: string, parentId?: string) => {
    if (!user || !topicId) return;
    const { error } = await (supabase as any).from('forum_answers').insert({
      topic_id: topicId, user_id: user.id, content, parent_id: parentId || null,
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    // Update answer count
    await (supabase as any).from('forum_topics')
      .update({ answer_count: (topic?.answer_count || 0) + 1 })
      .eq('id', topicId);
    toast({ title: 'Answer posted!' });
    fetchTopic();
  };

  const vote = async (targetId: string, targetType: 'topic' | 'answer') => {
    if (!user) { toast({ title: 'Please sign in to vote' }); return; }
    if (userVotes.has(targetId)) {
      // Remove vote
      await (supabase as any).from('forum_votes')
        .delete().eq('user_id', user.id).eq('target_id', targetId);
      const table = targetType === 'topic' ? 'forum_topics' : 'forum_answers';
      const current = targetType === 'topic' ? topic?.upvote_count || 0 : answers.find(a => a.id === targetId)?.upvote_count || 0;
      await (supabase as any).from(table).update({ upvote_count: Math.max(0, current - 1) }).eq('id', targetId);
    } else {
      // Add vote
      await (supabase as any).from('forum_votes').insert({
        user_id: user.id, target_id: targetId, target_type: targetType,
      });
      const table = targetType === 'topic' ? 'forum_topics' : 'forum_answers';
      const current = targetType === 'topic' ? topic?.upvote_count || 0 : answers.find(a => a.id === targetId)?.upvote_count || 0;
      await (supabase as any).from(table).update({ upvote_count: current + 1 }).eq('id', targetId);
    }
    fetchTopic();
  };

  const markBestAnswer = async (answerId: string) => {
    if (!user || !topic || topic.user_id !== user.id) return;
    // Clear previous best
    if (topic.best_answer_id) {
      await (supabase as any).from('forum_answers').update({ is_best_answer: false }).eq('id', topic.best_answer_id);
    }
    await (supabase as any).from('forum_answers').update({ is_best_answer: true }).eq('id', answerId);
    await (supabase as any).from('forum_topics').update({ best_answer_id: answerId, is_resolved: true }).eq('id', topicId);
    toast({ title: 'Best answer marked!' });
    fetchTopic();
  };

  return { topic, answers, loading, createAnswer, vote, markBestAnswer, userVotes };
}

export function useCreateTopic() {
  const { user } = useAuth();

  const createTopic = async (data: { title: string; content: string; category: ForumCategory; tags: string[] }) => {
    if (!user) { toast({ title: 'Please sign in' }); return null; }
    const { data: result, error } = await (supabase as any).from('forum_topics').insert({
      user_id: user.id, ...data,
    }).select().single();
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return null; }
    toast({ title: 'Topic created!' });
    return result;
  };

  return { createTopic };
}
