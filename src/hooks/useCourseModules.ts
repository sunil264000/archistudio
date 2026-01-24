import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Module {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  order_index: number;
  is_free_preview: boolean;
}

export function useCourseModules(courseSlug: string | undefined) {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalLessons, setTotalLessons] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);

  useEffect(() => {
    if (!courseSlug) {
      setLoading(false);
      return;
    }

    const fetchModules = async () => {
      setLoading(true);
      
      try {
        // First get the course ID from slug
        const { data: course, error: courseError } = await supabase
          .from('courses')
          .select('id')
          .eq('slug', courseSlug)
          .single();

        if (courseError || !course) {
          console.log('Course not found:', courseSlug);
          setModules([]);
          setLoading(false);
          return;
        }

        // Fetch modules for this course
        const { data: modulesData, error: modulesError } = await supabase
          .from('modules')
          .select('id, title, description, order_index')
          .eq('course_id', course.id)
          .order('order_index');

        if (modulesError || !modulesData || modulesData.length === 0) {
          console.log('No modules found for course:', courseSlug);
          setModules([]);
          setLoading(false);
          return;
        }

        // Fetch all lessons for these modules
        const moduleIds = modulesData.map(m => m.id);
        const { data: lessonsData, error: lessonsError } = await supabase
          .from('lessons')
          .select('id, title, description, video_url, duration_minutes, order_index, is_free_preview, module_id')
          .in('module_id', moduleIds)
          .order('order_index');

        if (lessonsError) {
          console.error('Error fetching lessons:', lessonsError);
        }

        // Map lessons to modules
        const modulesWithLessons: Module[] = modulesData.map(mod => ({
          ...mod,
          order_index: mod.order_index ?? 0,
          lessons: (lessonsData || [])
            .filter(l => l.module_id === mod.id)
            .map(l => ({
              id: l.id,
              title: l.title,
              description: l.description,
              video_url: l.video_url,
              duration_minutes: l.duration_minutes,
              order_index: l.order_index ?? 0,
              is_free_preview: l.is_free_preview ?? false,
            }))
            .sort((a, b) => a.order_index - b.order_index),
        }));

        // Calculate totals
        const allLessons = lessonsData || [];
        setTotalLessons(allLessons.length);
        setTotalDuration(allLessons.reduce((sum, l) => sum + (l.duration_minutes || 0), 0));
        
        setModules(modulesWithLessons);
      } catch (error) {
        console.error('Error in fetchModules:', error);
        setModules([]);
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [courseSlug]);

  return { modules, loading, totalLessons, totalDuration };
}
