import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Initialize GA4
export function initializeGA4(measurementId: string) {
  if (typeof window === 'undefined') return;
  
  // Check if already initialized
  if (document.querySelector(`script[src*="${measurementId}"]`)) return;

  // Load gtag.js
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    page_path: window.location.pathname,
    send_page_view: true,
  });

  console.log('GA4 initialized:', measurementId);
}

// Track page views
export function trackPageView(path: string, title?: string) {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
}

// Track custom events
export function trackEvent(
  eventName: string,
  parameters?: Record<string, any>
) {
  if (typeof window === 'undefined' || !window.gtag) return;
  
  window.gtag('event', eventName, parameters);
}

// Predefined event trackers for Archistudio
export const analytics = {
  // Studio (course) events
  viewStudio: (studioId: string, studioTitle: string, price?: number) => {
    trackEvent('view_item', {
      currency: 'INR',
      value: price,
      items: [{
        item_id: studioId,
        item_name: studioTitle,
        item_category: 'Studio Program',
      }],
    });
  },

  // Add to cart
  addToCart: (studioId: string, studioTitle: string, price: number) => {
    trackEvent('add_to_cart', {
      currency: 'INR',
      value: price,
      items: [{
        item_id: studioId,
        item_name: studioTitle,
        item_category: 'Studio Program',
        price: price,
        quantity: 1,
      }],
    });
  },

  // Begin checkout
  beginCheckout: (studioId: string, studioTitle: string, price: number) => {
    trackEvent('begin_checkout', {
      currency: 'INR',
      value: price,
      items: [{
        item_id: studioId,
        item_name: studioTitle,
        price: price,
        quantity: 1,
      }],
    });
  },

  // Purchase complete
  purchase: (transactionId: string, studioId: string, studioTitle: string, price: number) => {
    trackEvent('purchase', {
      transaction_id: transactionId,
      currency: 'INR',
      value: price,
      items: [{
        item_id: studioId,
        item_name: studioTitle,
        price: price,
        quantity: 1,
      }],
    });
  },

  // Sign up
  signUp: (method: string) => {
    trackEvent('sign_up', { method });
  },

  // Login
  login: (method: string) => {
    trackEvent('login', { method });
  },

  // Session/lesson events
  startSession: (studioId: string, sessionTitle: string) => {
    trackEvent('lesson_start', {
      studio_id: studioId,
      session_title: sessionTitle,
    });
  },

  completeSession: (studioId: string, sessionTitle: string, watchTime: number) => {
    trackEvent('lesson_complete', {
      studio_id: studioId,
      session_title: sessionTitle,
      watch_time_seconds: watchTime,
    });
  },

  // Studio completion
  completeStudio: (studioId: string, studioTitle: string) => {
    trackEvent('course_complete', {
      studio_id: studioId,
      studio_title: studioTitle,
    });
  },

  // Search
  search: (searchTerm: string) => {
    trackEvent('search', { search_term: searchTerm });
  },

  // Blog view
  viewBlogPost: (postId: string, postTitle: string) => {
    trackEvent('view_blog_post', {
      post_id: postId,
      post_title: postTitle,
    });
  },

  // CTA clicks
  ctaClick: (ctaName: string, location: string) => {
    trackEvent('cta_click', {
      cta_name: ctaName,
      location: location,
    });
  },

  // Video engagement
  videoProgress: (studioId: string, sessionId: string, percent: number) => {
    trackEvent('video_progress', {
      studio_id: studioId,
      session_id: sessionId,
      percent_watched: percent,
    });
  },
};

// Hook for automatic page view tracking
export function useGoogleAnalytics(measurementId?: string) {
  const location = useLocation();

  useEffect(() => {
    if (measurementId) {
      initializeGA4(measurementId);
    }
  }, [measurementId]);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
}

export default useGoogleAnalytics;
