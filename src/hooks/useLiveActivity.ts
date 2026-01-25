import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ActivityOptions {
  activityType: 'viewing' | 'purchase_attempt' | 'page_visit' | 'video_play';
  courseId?: string;
  lessonId?: string;
  pageUrl?: string;
  metadata?: Record<string, any>;
}

// Generate a unique session ID per browser tab
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('activity_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('activity_session_id', sessionId);
  }
  return sessionId;
};

export function useLiveActivity() {
  const { user } = useAuth();
  const activityIdRef = useRef<string | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startActivity = useCallback(async (options: ActivityOptions) => {
    if (!user) return null;

    try {
      const sessionId = getSessionId();
      
      // End any existing activity first
      if (activityIdRef.current) {
        await supabase
          .from('live_activity')
          .update({ ended_at: new Date().toISOString() })
          .eq('id', activityIdRef.current);
      }

      // Create new activity
      const { data, error } = await supabase
        .from('live_activity')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          activity_type: options.activityType,
          course_id: options.courseId || null,
          lesson_id: options.lessonId || null,
          page_url: options.pageUrl || window.location.pathname,
          metadata: options.metadata || {},
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to start activity:', error);
        return null;
      }

      activityIdRef.current = data.id;

      // Start heartbeat ping every 30 seconds
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      pingIntervalRef.current = setInterval(async () => {
        if (activityIdRef.current) {
          await supabase
            .from('live_activity')
            .update({ last_ping: new Date().toISOString() })
            .eq('id', activityIdRef.current);
        }
      }, 30000);

      return data.id;
    } catch (error) {
      console.error('Activity tracking error:', error);
      return null;
    }
  }, [user]);

  const endActivity = useCallback(async () => {
    if (activityIdRef.current) {
      await supabase
        .from('live_activity')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', activityIdRef.current);
      
      activityIdRef.current = null;
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  const updateActivity = useCallback(async (metadata: Record<string, any>) => {
    if (activityIdRef.current) {
      await supabase
        .from('live_activity')
        .update({ 
          metadata,
          last_ping: new Date().toISOString() 
        })
        .eq('id', activityIdRef.current);
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      endActivity();
    };
  }, [endActivity]);

  // End activity on page unload
  useEffect(() => {
    const handleUnload = () => {
      if (activityIdRef.current) {
        // Use sendBeacon for reliable delivery on page close
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/live_activity?id=eq.${activityIdRef.current}`;
        navigator.sendBeacon(url, JSON.stringify({ ended_at: new Date().toISOString() }));
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return {
    startActivity,
    endActivity,
    updateActivity,
  };
}

// Track purchase attempts
export async function trackPurchaseAttempt(
  userId: string | null,
  courseId: string,
  amount: number,
  status: 'initiated' | 'payment_started' | 'completed' | 'failed' | 'abandoned' = 'initiated'
) {
  try {
    const sessionId = getSessionId();
    
    const { data, error } = await supabase
      .from('purchase_attempts')
      .insert({
        user_id: userId,
        course_id: courseId,
        amount,
        status,
        session_id: sessionId,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to track purchase attempt:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Purchase tracking error:', error);
    return null;
  }
}

export async function updatePurchaseAttempt(
  attemptId: string,
  status: 'initiated' | 'payment_started' | 'completed' | 'failed' | 'abandoned',
  metadata?: Record<string, any>
) {
  try {
    await supabase
      .from('purchase_attempts')
      .update({ 
        status, 
        metadata: metadata || {},
        updated_at: new Date().toISOString() 
      })
      .eq('id', attemptId);
  } catch (error) {
    console.error('Failed to update purchase attempt:', error);
  }
}
