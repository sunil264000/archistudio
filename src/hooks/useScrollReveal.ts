import { useEffect } from 'react';

const MOTION_SELECTORS = '.motion-section, .motion-stagger, .motion-from-left, .motion-from-right, .motion-scale, .motion-rotate';

/**
 * Ultra-smooth global scroll-reveal system.
 * Automatically animates elements into view using IntersectionObserver.
 * Supports: motion-section, motion-stagger, motion-from-left, motion-from-right, motion-scale, motion-rotate
 */
export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Small RAF delay for smoother paint
            requestAnimationFrame(() => {
              entry.target.classList.add('in-view');
            });
          }
        });
      },
      { threshold: 0.06, rootMargin: '0px 0px -40px 0px' }
    );

    const observe = () => {
      const targets = document.querySelectorAll(
        `${MOTION_SELECTORS}`.split(',').map(s => `${s.trim()}:not(.in-view)`).join(',')
      );
      targets.forEach((el) => observer.observe(el));
    };

    observe();

    // Re-observe on DOM changes (for dynamically added content)
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(observe);
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}
