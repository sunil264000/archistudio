import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Content Protection — blocks right-click, dev tools shortcuts,
 * text selection on media, and download buttons.
 * Admins and dev mode bypass automatically.
 */
export function useContentProtection() {
  const { isAdmin } = useAuth();

  useEffect(() => {
    const shouldBypass = import.meta.env.DEV || isAdmin;
    if (shouldBypass) return;

    // Block right-click everywhere
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // Block: Ctrl+S, Ctrl+U, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, F12
      if (e.ctrlKey && (k === 's' || k === 'u')) { e.preventDefault(); }
      if (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) { e.preventDefault(); }
      if (e.key === 'F12') { e.preventDefault(); }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Hide download buttons and disable text selection on media
    const style = document.createElement('style');
    style.id = 'content-protection-style';
    style.textContent = `
      video::-webkit-media-controls-download-button { display: none !important; }
      video::-internal-media-controls-download-button { display: none !important; }
      video::-webkit-media-controls-overflow-button { display: none !important; }
      img, video, iframe { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
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
