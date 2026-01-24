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
        const { data, error } = await supabase
          .from('courses')
          .select('slug, thumbnail_url, is_highlighted, is_featured, price_inr, updated_at')
          .eq('is_published', true);

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

    return () => {
      supabase.removeChannel(channel);
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
   * Get normalized INR price for a course.
   * - Prefer backend price_inr when available.
   * - Fallback: normalize any static/high price into ₹300–₹600 so UI stays consistent.
   */
  const getPriceInr = (courseSlug: string, fallbackPrice: number): number => {
    const dynamic = dynamicData[courseSlug];
    if (typeof dynamic?.price_inr === 'number' && !Number.isNaN(dynamic.price_inr)) {
      return Math.round(dynamic.price_inr);
    }

    // Deterministic clamp into [300, 600] even if fallback is old (e.g. 7499)
    const min = 300;
    const max = 600;
    const range = max - min + 1;
    const n = Math.abs(Math.round(fallbackPrice || 0));
    return min + (n % range);
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
