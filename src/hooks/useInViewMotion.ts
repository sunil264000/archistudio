import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook that adds 'in-view' class when element enters viewport.
 * Uses IntersectionObserver for CSS-based motion (no JS animation overhead).
 */
export function useInViewMotion(options?: { threshold?: number; margin?: string; once?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { threshold = 0.1, margin = '-80px', once = true } = options || {};

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('in-view');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          if (once) observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: margin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, margin, once]);

  return ref;
}

/**
 * Hook that observes multiple children and adds 'in-view' to parent for stagger effects.
 */
export function useStaggerMotion(options?: { threshold?: number; margin?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { threshold = 0.15, margin = '-60px' } = options || {};

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('in-view');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      },
      { threshold, rootMargin: margin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, margin]);

  return ref;
}

/**
 * Returns true if user prefers reduced motion.
 */
export function usePrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
