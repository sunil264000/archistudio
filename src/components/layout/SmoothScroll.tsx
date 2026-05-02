import { ReactNode, useEffect } from 'react';

/**
 * World-Class Smooth Scroll (Lightweight Edition)
 * Provides a fluid scrolling experience without external dependencies.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Simple but effective smooth scroll logic
    // On modern browsers, 'scroll-behavior: smooth' in CSS handles most cases.
    // This component acts as a wrapper for future expansion or custom easing.
    document.documentElement.style.scrollBehavior = 'smooth';
    
    return () => {
      document.documentElement.style.scrollBehavior = 'auto';
    };
  }, []);

  return <>{children}</>;
}
