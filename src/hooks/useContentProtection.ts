import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Lightweight Content Protection
 *
 * The previous “advanced” protection (fetch overrides, CSP injection, mutation observers)
 * can break video playback on some devices/browsers.
 *
 * This keeps only minimal deterrents:
 * - Block right-click context menu on video/iframe players
 * - Block a couple of “save/view source” shortcuts
 * - Hide the browser download button where supported
 *
 * Admins and dev bypass automatically.
 */
export function useContentProtection() {
  const { isAdmin } = useAuth();

  useEffect(() => {
    const shouldBypass = import.meta.env.DEV || isAdmin;
    if (shouldBypass) return;

    const isMediaElement = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      return !!el.closest('video, iframe');
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Only block right-click on media elements so the rest of the site feels normal.
      if (!isMediaElement(e.target)) return;
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Keep this minimal to avoid breaking accessibility / normal workflows.
      const k = e.key.toLowerCase();
      if (e.ctrlKey && (k === 's' || k === 'u')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Hide download buttons where browsers expose them
    const style = document.createElement('style');
    style.id = 'content-protection-style';
    style.textContent = `
      video::-webkit-media-controls-download-button { display: none !important; }
      video::-internal-media-controls-download-button { display: none !important; }
      video::-webkit-media-controls-overflow-button { display: none !important; }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      const styleEl = document.getElementById('content-protection-style');
      if (styleEl) styleEl.remove();
    };
  }, [isAdmin]);
}
