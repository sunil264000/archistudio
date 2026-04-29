// Realtime platform-wide stats. Subscribes to inserts/deletes so values
// auto-update without manual refreshes.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface LiveStats {
  students: number;
  courses: number;
  critiques: number;
  certificates: number;
  studioMembers: number;
  projects: number;
  loading: boolean;
}

const initial: LiveStats = {
  students: 0,
  courses: 0,
  critiques: 0,
  certificates: 0,
  studioMembers: 0,
  projects: 0,
  loading: true,
};

async function fetchAll(): Promise<Omit<LiveStats, 'loading'>> {
  const [students, courses, critiques, certificates, members, projects] = await Promise.all([
    supabase.from('profiles').select('user_id', { count: 'exact', head: true }),
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('forum_answers').select('id', { count: 'exact', head: true }),
    supabase.from('certificates').select('id', { count: 'exact', head: true }),
    (supabase as any).from('worker_profiles').select('id', { count: 'exact', head: true }),
    (supabase as any).from('marketplace_jobs').select('id', { count: 'exact', head: true }),
  ]);
  return {
    students: students.count || 0,
    courses: courses.count || 0,
    critiques: critiques.count || 0,
    certificates: certificates.count || 0,
    studioMembers: (members as any).count || 0,
    projects: (projects as any).count || 0,
  };
}

export function useLiveStats(): LiveStats {
  const [stats, setStats] = useState<LiveStats>(initial);

  useEffect(() => {
    let mounted = true;
    let debounce: ReturnType<typeof setTimeout> | null = null;

    const refresh = async () => {
      const s = await fetchAll();
      if (mounted) setStats({ ...s, loading: false });
    };

    const scheduleRefresh = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(refresh, 800);
    };

    void refresh();

    const tables = ['profiles', 'courses', 'forum_answers', 'certificates', 'worker_profiles', 'marketplace_jobs'];
    const channel = supabase.channel('live-stats');
    tables.forEach((t) => {
      channel.on(
        'postgres_changes' as any,
        { event: '*', schema: 'public', table: t },
        scheduleRefresh
      );
    });
    channel.subscribe();

    // Safety net: refresh every 60s in case realtime is throttled
    const interval = setInterval(refresh, 60_000);

    return () => {
      mounted = false;
      if (debounce) clearTimeout(debounce);
      clearInterval(interval);
      void supabase.removeChannel(channel);
    };
  }, []);

  return stats;
}
