import { useEffect } from 'react';

/**
 * Security Hook - Prevents content copying and protects against data scraping
 */
export function useContentProtection() {
  useEffect(() => {
    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      // Allow context menu in development
      if (import.meta.env.DEV) return;
      e.preventDefault();
    };

    // Disable keyboard shortcuts for copying/saving
    const handleKeyDown = (e: KeyboardEvent) => {
      if (import.meta.env.DEV) return;
      
      // Disable Ctrl+C, Ctrl+U, Ctrl+S, F12
      if (
        (e.ctrlKey && (e.key === 'c' || e.key === 'u' || e.key === 's' || e.key === 'p')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Disable text selection (except for inputs)
    const handleSelectStart = (e: Event) => {
      if (import.meta.env.DEV) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      e.preventDefault();
    };

    // Disable drag
    const handleDragStart = (e: DragEvent) => {
      if (import.meta.env.DEV) return;
      e.preventDefault();
    };

    // Detect DevTools opening
    const detectDevTools = () => {
      if (import.meta.env.DEV) return;
      
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        // DevTools might be open - you can log this or take action
        console.clear();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    
    // Check for DevTools periodically
    const devToolsInterval = setInterval(detectDevTools, 1000);

    // Add CSS to prevent selection and downloads
    if (!import.meta.env.DEV) {
      const style = document.createElement('style');
      style.id = 'content-protection-style';
      style.textContent = `
        body {
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        input, textarea, [contenteditable="true"] {
          -webkit-user-select: text;
          -moz-user-select: text;
          -ms-user-select: text;
          user-select: text;
        }
        img, video {
          -webkit-user-drag: none;
          -khtml-user-drag: none;
          -moz-user-drag: none;
          -o-user-drag: none;
          user-drag: none;
        }
        video {
          pointer-events: auto !important;
        }
        video::-webkit-media-controls-enclosure {
          overflow: hidden;
        }
        video::-webkit-media-controls-panel {
          width: calc(100% + 30px);
        }
        video::-webkit-media-controls-download-button {
          display: none !important;
        }
        video::-internal-media-controls-download-button {
          display: none !important;
        }
        video::-webkit-media-controls-overflow-button {
          display: none !important;
        }
        iframe {
          pointer-events: auto;
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      clearInterval(devToolsInterval);
      
      const styleEl = document.getElementById('content-protection-style');
      if (styleEl) styleEl.remove();
    };
  }, []);
}
