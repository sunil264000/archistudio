import { QueryClient } from '@tanstack/react-query';

/**
 * Resilient QueryClient configuration for high-scale platform
 * - Aggressive stale-while-revalidate for read-heavy data
 * - Automatic retry with exponential backoff
 * - Error recovery patterns
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale after 30 seconds - shows cached data while refetching
      staleTime: 30 * 1000,
      // Keep unused cache for 5 minutes
      gcTime: 5 * 60 * 1000,
      // Retry up to 3 times with exponential backoff
      retry: (failureCount, error: any) => {
        // Don't retry 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500 && error?.status !== 429) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        return Math.min(1000 * Math.pow(2, attemptIndex), 30000);
      },
      // Refetch on window focus for real-time feel
      refetchOnWindowFocus: true,
      // Don't refetch on reconnect automatically
      refetchOnReconnect: 'always',
      // Network mode: always attempt even offline (for cache hits)
      networkMode: 'offlineFirst',
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 2000,
      networkMode: 'offlineFirst',
    },
  },
});

/**
 * Prefetch critical data on app load
 * Called once during app initialization
 */
export async function prefetchCriticalData() {
  // These run in parallel to warm the cache
  await Promise.allSettled([
    queryClient.prefetchQuery({
      queryKey: ['courses', 'published'],
      queryFn: async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data } = await supabase
          .from('courses')
          .select('id, title, slug, thumbnail_url, price_inr, level, short_description, is_featured')
          .eq('is_published', true)
          .order('order_index');
        return data;
      },
      staleTime: 60 * 1000, // Courses change rarely
    }),
    queryClient.prefetchQuery({
      queryKey: ['categories'],
      queryFn: async () => {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data } = await supabase.from('course_categories').select('*');
        return data;
      },
      staleTime: 5 * 60 * 1000, // Categories rarely change
    }),
  ]);
}
