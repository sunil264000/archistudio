import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Annotation {
  id: string;
  x_percent: number;
  y_percent: number;
  message: string;
  user_id: string;
  is_resolved: boolean;
  created_at: string;
  parent_id: string | null;
  author_name?: string;
}

export function useSheetAnnotations(sheetId: string | undefined) {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnotations = useCallback(async () => {
    if (!sheetId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('sheet_annotations' as any)
      .select('*')
      .eq('sheet_id', sheetId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch annotations:', error);
      setLoading(false);
      return;
    }

    if (data && data.length > 0) {
      const userIds = [...new Set((data as any[]).map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const nameMap = new Map((profiles || []).map(p => [p.user_id, p.full_name]));

      setAnnotations((data as any[]).map(a => ({
        ...a,
        author_name: nameMap.get(a.user_id) || 'Anonymous',
      })));
    } else {
      setAnnotations([]);
    }
    setLoading(false);
  }, [sheetId]);

  useEffect(() => {
    fetchAnnotations();

    if (!sheetId) return;

    // Realtime subscription
    const channel = supabase
      .channel(`annotations-${sheetId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sheet_annotations',
        filter: `sheet_id=eq.${sheetId}`,
      }, () => {
        fetchAnnotations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sheetId, fetchAnnotations]);

  return { annotations, loading, refetch: fetchAnnotations };
}
