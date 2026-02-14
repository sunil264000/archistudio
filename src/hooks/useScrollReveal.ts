import { useEffect } from 'react';

/**
 * Global scroll-reveal: automatically adds 'in-view' class to elements
 * with .motion-section or .motion-stagger when they enter the viewport.
 * Uses IntersectionObserver for performance.
 */
export function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -60px 0px' }
    );

    const targets = document.querySelectorAll('.motion-section, .motion-stagger');
    targets.forEach((el) => observer.observe(el));

    // Re-observe on DOM changes (for dynamically added content)
    const mutationObserver = new MutationObserver(() => {
      const newTargets = document.querySelectorAll('.motion-section:not(.in-view), .motion-stagger:not(.in-view)');
      newTargets.forEach((el) => observer.observe(el));
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}
