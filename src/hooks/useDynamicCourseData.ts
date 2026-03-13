import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface DynamicCourseData {
  slug: string;
  thumbnail_url: string | null;
  is_highlighted: boolean;
  is_featured: boolean;
  price_inr: number | null;
  updated_at?: string | null;
}

/**
 * Hook to fetch dynamic course data (thumbnails, prices, etc.) from the database
 * and merge with static course data
 */
export function useDynamicCourseData() {
  const [dynamicData, setDynamicData] = useState<Record<string, DynamicCourseData>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        // Add cache-busting header to always fetch fresh data
        const { data, error } = await supabase
          .from('courses')
          .select('slug, thumbnail_url, is_highlighted, is_featured, price_inr, updated_at')
          .eq('is_published', true)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const dataMap: Record<string, DynamicCourseData> = {};
        (data || []).forEach(course => {
          dataMap[course.slug] = course;
        });

        setDynamicData(dataMap);
      } catch (error) {
        console.error('Error fetching dynamic course data:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch immediately on mount
    fetchDynamicData();

    // Subscribe to realtime updates for course changes
    const channel = supabase
      .channel('courses-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'courses',
        },
        () => {
          fetchDynamicData();
        }
      )
      .subscribe();

    // Refetch on window focus to prevent stale cache data
    const handleFocus = () => {
      fetchDynamicData();
    };
    window.addEventListener('focus', handleFocus);

    // Refetch on visibility change (when tab becomes visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDynamicData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  /**
   * Get thumbnail URL for a course, with fallback to category image
   */
  const getThumbnail = (courseSlug: string, fallbackImage: string): string => {
    const dynamic = dynamicData[courseSlug];
    if (dynamic?.thumbnail_url) {
      // Cache-bust when admin updates thumbnail URL so users see it instantly.
      // Uses updated_at if available; falls back to a short-lived cache key.
      const rawUrl = dynamic.thumbnail_url;
      const v = dynamic.updated_at
        ? String(new Date(dynamic.updated_at).getTime())
        : String(Math.floor(Date.now() / 60_000)); // 1-minute rolling cache

      const joiner = rawUrl.includes('?') ? '&' : '?';
      return `${rawUrl}${joiner}v=${encodeURIComponent(v)}`;
    }
    return fallbackImage;
  };

  /**
   * Check if course is highlighted in admin
   */
  const isHighlighted = (courseSlug: string): boolean => {
    return dynamicData[courseSlug]?.is_highlighted || false;
  };

  /**
   * Check if course is featured in admin
   */
  const isFeatured = (courseSlug: string): boolean => {
    return dynamicData[courseSlug]?.is_featured || false;
  };

  /**
   * Get dynamic INR price for a course based on content richness.
   * - Prefer backend price_inr when available (set via auto-price-courses function).
   * - Fallback: Calculate from content metrics using the same algorithm as the backend.
   * - Price range: ₹399–₹4999 based on lessons and duration.
   */
  const getPriceInr = (courseSlug: string, fallbackPrice: number, durationHours?: number, totalLessons?: number): number => {
    const dynamic = dynamicData[courseSlug];
    if (typeof dynamic?.price_inr === 'number' && !Number.isNaN(dynamic.price_inr) && dynamic.price_inr > 0) {
      return Math.round(dynamic.price_inr);
    }

    // Price brackets matching the backend auto-price edge function (₹399–₹4999)
    const PRICE_BRACKETS = [499, 699, 899, 1199, 1499, 1799, 1999, 2499, 2999, 3499, 3999, 4499, 4999];

    const lessons = totalLessons ?? 0;
    const hours = durationHours ?? 0;

    // If we have content signals, use the same formula as the backend
    if (lessons > 0 || hours > 0) {
      const lessonScore = Math.min(lessons / 50, 1);
      const durationScore = Math.min(hours / 20, 1);
      const score = lessonScore * 0.4 + durationScore * 0.6;
      const idx = Math.round(score * (PRICE_BRACKETS.length - 1));
      return PRICE_BRACKETS[Math.max(0, Math.min(idx, PRICE_BRACKETS.length - 1))];
    }

    // Last resort: deterministic hash-based fallback in the new range
    const slugHash = courseSlug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return PRICE_BRACKETS[slugHash % PRICE_BRACKETS.length];
  };

  return {
    dynamicData,
    loading,
    getThumbnail,
    isHighlighted,
    isFeatured,
    getPriceInr,
  };
}
