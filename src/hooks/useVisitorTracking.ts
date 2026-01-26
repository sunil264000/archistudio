import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

// Get or create a unique session ID
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('visitor_session_id', sessionId);
  }
  return sessionId;
};

// Detect device type from user agent and screen size
const detectDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  const ua = navigator.userAgent.toLowerCase();
  const screenWidth = window.innerWidth;
  
  // Check for mobile devices
  if (/android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  }
  
  // Check for tablets
  if (/ipad|tablet|playbook|silk/i.test(ua) || (screenWidth >= 768 && screenWidth < 1024)) {
    return 'tablet';
  }
  
  // Fallback to screen width detection
  if (screenWidth < 768) return 'mobile';
  if (screenWidth < 1024) return 'tablet';
  
  return 'desktop';
};

// Detect browser
const detectBrowser = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('SamsungBrowser')) return 'Samsung';
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera';
  if (ua.includes('Edge')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return 'Unknown';
};

// Detect OS
const detectOS = (): string => {
  const ua = navigator.userAgent;
  if (ua.includes('Windows')) return 'Windows';
  if (ua.includes('Mac OS')) return 'macOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
  return 'Unknown';
};

// Parse UTM parameters from URL
const getUTMParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
  };
};

export function useVisitorTracking() {
  const location = useLocation();
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pagesViewedRef = useRef<number>(1);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize session tracking
  const initSession = useCallback(async () => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;
    
    const sessionId = getSessionId();
    sessionIdRef.current = sessionId;
    startTimeRef.current = Date.now();
    
    const utmParams = getUTMParams();
    
    try {
      // Insert new session
      const { error } = await supabase
        .from('visitor_sessions')
        .insert({
          session_id: sessionId,
          device_type: detectDeviceType(),
          browser: detectBrowser(),
          os: detectOS(),
          screen_width: window.innerWidth,
          screen_height: window.innerHeight,
          referrer: document.referrer || null,
          landing_page: window.location.pathname,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...utmParams,
        });
      
      if (error) {
        console.error('Failed to create visitor session:', error);
        return;
      }

      // Start heartbeat ping every 30 seconds
      pingIntervalRef.current = setInterval(async () => {
        const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        await supabase
          .from('visitor_sessions')
          .update({
            last_ping: new Date().toISOString(),
            total_duration_seconds: durationSeconds,
            pages_viewed: pagesViewedRef.current,
            is_bounce: pagesViewedRef.current <= 1,
          })
          .eq('session_id', sessionId);
      }, 30000);

    } catch (err) {
      console.error('Visitor tracking error:', err);
    }
  }, []);

  // Track page changes
  useEffect(() => {
    if (isInitializedRef.current && pagesViewedRef.current > 0) {
      pagesViewedRef.current += 1;
    }
  }, [location.pathname]);

  // Initialize on mount
  useEffect(() => {
    initSession();

    // End session on page unload
    const handleUnload = () => {
      if (sessionIdRef.current) {
        const durationSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        // Use sendBeacon for reliable delivery
        const data = JSON.stringify({
          ended_at: new Date().toISOString(),
          total_duration_seconds: durationSeconds,
          pages_viewed: pagesViewedRef.current,
          is_bounce: pagesViewedRef.current <= 1,
        });
        
        // Note: sendBeacon with Supabase requires a different approach
        // For now, we rely on last_ping for duration calculation
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [initSession]);

  return null;
}

export default useVisitorTracking;
