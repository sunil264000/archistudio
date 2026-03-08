import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PointData {
  points: number;
  level: number;
}

interface BadgeData {
  id: string;
  badge_key: string;
  badge_name: string;
  badge_description: string | null;
  badge_icon: string;
  earned_at: string;
}

const LEVEL_THRESHOLDS = [0, 50, 150, 350, 700, 1200, 2000, 3200, 5000, 8000, 12000];

const BADGE_DEFINITIONS: Record<string, { name: string; description: string; icon: string; check: (stats: any) => boolean }> = {
  first_course: { name: 'First Steps', description: 'Completed your first course', icon: '🎓', check: s => s.courses >= 1 },
  five_courses: { name: 'Knowledge Seeker', description: 'Completed 5 courses', icon: '📚', check: s => s.courses >= 5 },
  sheet_critic: { name: 'Sheet Critic', description: 'Gave 10 sheet critiques', icon: '📐', check: s => s.critiques >= 10 },
  concept_thinker: { name: 'Concept Thinker', description: 'Started 5 forum topics', icon: '💡', check: s => s.topics >= 5 },
  software_master: { name: 'Software Master', description: 'Completed 3 software courses', icon: '🖥️', check: s => s.courses >= 3 },
  helpful: { name: 'Helpful Hand', description: 'Gave 25 forum answers', icon: '🤝', check: s => s.answers >= 25 },
  best_answer: { name: 'Expert Voice', description: 'Got 5 best answers', icon: '⭐', check: s => s.bestAnswers >= 5 },
  portfolio_builder: { name: 'Portfolio Builder', description: 'Created a public portfolio', icon: '🏗️', check: s => s.hasPortfolio },
  community_star: { name: 'Community Star', description: 'Reached 500 reputation', icon: '🌟', check: s => s.totalPoints >= 500 },
};

export function useGamification() {
  const { user } = useAuth();
  const [points, setPoints] = useState<PointData | null>(null);
  const [badges, setBadges] = useState<BadgeData[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const fetchPoints = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_points')
      .select('points, level')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setPoints(data as PointData);
    else {
      await supabase.from('user_points').insert({ user_id: user.id, points: 0, level: 1 });
      setPoints({ points: 0, level: 1 });
    }
  }, [user]);

  const fetchBadges = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id)
      .order('earned_at', { ascending: false });
    setBadges((data || []) as BadgeData[]);
  }, [user]);

  const fetchLeaderboard = useCallback(async () => {
    const { data } = await supabase
      .from('user_points')
      .select('user_id, points, level')
      .order('points', { ascending: false })
      .limit(20);
    
    if (data && data.length > 0) {
      const userIds = data.map((d: any) => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);
      
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
      setLeaderboard(data.map((d: any) => ({
        ...d,
        ...(profileMap.get(d.user_id) || {}),
      })));
    }
  }, []);

  const addPoints = useCallback(async (amount: number, reason: string) => {
    if (!user) return;
    
    await supabase.from('point_transactions').insert({
      user_id: user.id,
      points: amount,
      reason,
    });

    const newTotal = (points?.points || 0) + amount;
    const newLevel = LEVEL_THRESHOLDS.findIndex((t, i) => i === LEVEL_THRESHOLDS.length - 1 || newTotal < LEVEL_THRESHOLDS[i + 1]);

    await supabase.from('user_points').upsert({
      user_id: user.id,
      points: newTotal,
      level: Math.max(1, newLevel),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });

    setPoints({ points: newTotal, level: Math.max(1, newLevel) });
  }, [user, points]);

  const checkAndAwardBadges = useCallback(async () => {
    if (!user) return;

    const earnedKeys = new Set(badges.map(b => b.badge_key));

    const [certsRes, topicsRes, answersRes, critiquesRes, portfolioRes] = await Promise.all([
      supabase.from('certificates').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('forum_topics').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('forum_answers').select('id, is_best_answer').eq('user_id', user.id),
      supabase.from('sheet_critiques').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('portfolios').select('id').eq('user_id', user.id).eq('is_public', true).maybeSingle(),
    ]);

    const stats = {
      courses: certsRes.count || 0,
      topics: topicsRes.count || 0,
      answers: (answersRes.data || []).length,
      bestAnswers: (answersRes.data || []).filter((a: any) => a.is_best_answer).length,
      critiques: critiquesRes.count || 0,
      hasPortfolio: !!portfolioRes.data,
      totalPoints: points?.points || 0,
    };

    for (const [key, def] of Object.entries(BADGE_DEFINITIONS)) {
      if (!earnedKeys.has(key) && def.check(stats)) {
        await supabase.from('user_badges').insert({
          user_id: user.id,
          badge_key: key,
          badge_name: def.name,
          badge_description: def.description,
          badge_icon: def.icon,
        });
      }
    }

    await fetchBadges();
  }, [user, badges, points, fetchBadges]);

  useEffect(() => {
    fetchPoints();
    fetchBadges();
  }, [fetchPoints, fetchBadges]);

  return {
    points,
    badges,
    leaderboard,
    addPoints,
    checkAndAwardBadges,
    fetchLeaderboard,
    fetchPoints,
    fetchBadges,
  };
}
