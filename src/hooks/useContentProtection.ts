import { useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Security Hook - Prevents content copying, blocks download extensions (IDM, etc.), 
 * and protects against data scraping.
 * Admins can bypass all protections for content management.
 */
export function useContentProtection() {
  const { isAdmin } = useAuth();

  // Detect and block download manager extensions
  const blockDownloadExtensions = useCallback(() => {
    // Block common download manager injection patterns
    const blockedSelectors = [
      '[id*="idm"]',
      '[class*="idm"]',
      '[id*="download"]',
      '[class*="download-manager"]',
      'iframe[src*="idm"]',
      '[data-idm]',
      '[id*="thunder"]',
      '[class*="thunder"]',
      '[id*="eagleget"]',
      '[class*="eagleget"]',
    ];

    // Remove injected download elements
    blockedSelectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        if (!el.closest('video') && !el.closest('[data-allow-download]')) {
          el.remove();
        }
      });
    });

    // Block network requests from known download extensions via CSP meta tag
    let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (!cspMeta) {
      cspMeta = document.createElement('meta');
      cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      // Block connections to known download manager domains
      cspMeta.setAttribute('content', 
        "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co blob: data:; " +
        "media-src 'self' https://*.supabase.co https://*.supabase.in blob: data: https://drive.google.com; " +
        "frame-src 'self' https://drive.google.com https://docs.google.com;"
      );
      cspMeta.id = 'security-csp';
      document.head.appendChild(cspMeta);
    }
  }, []);

  // Override XMLHttpRequest and fetch to prevent extension sniffing
  const blockNetworkSniffing = useCallback(() => {
    // Store original methods
    const originalFetch = window.fetch;
    const originalXHR = window.XMLHttpRequest;

    // Whitelist of allowed domains
    const allowedDomains = [
      'supabase.co',
      'supabase.in',
      'googleapis.com',
      'drive.google.com',
      'docs.google.com',
      window.location.hostname,
    ];

    const isAllowedUrl = (url: string): boolean => {
      try {
        const urlObj = new URL(url, window.location.origin);
        return allowedDomains.some(domain => urlObj.hostname.includes(domain));
      } catch {
        return true; // Allow relative URLs
      }
    };

    // Override fetch to block suspicious requests
    (window as any).__originalFetch = originalFetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      // Block requests that look like download manager probes
      if (url.includes('.mp4') || url.includes('.mkv') || url.includes('.avi') || url.includes('.webm')) {
        if (!isAllowedUrl(url)) {
          console.warn('[Security] Blocked unauthorized media request:', url);
          return new Response('', { status: 403 });
        }
      }
      
      return originalFetch(input, init);
    };

    // Add flag to detect IDM specifically
    const detectIDM = () => {
      // IDM injects specific attributes and modifies video elements
      const videos = document.querySelectorAll('video');
      videos.forEach(video => {
        // Remove any injected download buttons
        const parent = video.parentElement;
        if (parent) {
          const idmElements = parent.querySelectorAll('[class*="idm"], [id*="idm"]');
          idmElements.forEach(el => el.remove());
        }

        // Block IDM's attempt to read video src directly
        const originalSrc = video.src;
        Object.defineProperty(video, 'currentSrc', {
          get: () => 'blob:protected',
          configurable: true,
        });
      });
    };

    // Run detection periodically
    const idmInterval = setInterval(detectIDM, 500);

    return () => {
      clearInterval(idmInterval);
      window.fetch = originalFetch;
    };
  }, []);

  useEffect(() => {
    // Allow all actions in development or for admins
    const shouldBypass = import.meta.env.DEV || isAdmin;

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      if (shouldBypass) return;
      e.preventDefault();
    };

    // Disable keyboard shortcuts for copying/saving/devtools
    const handleKeyDown = (e: KeyboardEvent) => {
      if (shouldBypass) return;
      
      // Disable Ctrl+C, Ctrl+U, Ctrl+S, Ctrl+P, F12, and DevTools shortcuts
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
      if (shouldBypass) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }
      e.preventDefault();
    };

    // Disable drag
    const handleDragStart = (e: DragEvent) => {
      if (shouldBypass) return;
      e.preventDefault();
    };

    // Detect DevTools opening
    const detectDevTools = () => {
      if (shouldBypass) return;
      
      const threshold = 160;
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        console.clear();
      }
    };

    // Block video URL exposure to extensions
    const protectVideoSources = () => {
      if (shouldBypass) return;
      
      document.querySelectorAll('video').forEach(video => {
        // Remove src attribute visibility from DOM inspection
        video.setAttribute('data-protected', 'true');
        
        // Block attempts to read source programmatically by extensions
        const observer = new MutationObserver((mutations) => {
          mutations.forEach(mutation => {
            if (mutation.type === 'attributes') {
              const target = mutation.target as HTMLVideoElement;
              // If someone tries to add download-related attributes, remove them
              if (target.hasAttribute('download') || target.hasAttribute('data-downloadurl')) {
                target.removeAttribute('download');
                target.removeAttribute('data-downloadurl');
              }
            }
          });
        });
        
        observer.observe(video, { attributes: true });
      });
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    
    // Check for DevTools periodically
    const devToolsInterval = setInterval(detectDevTools, 1000);
    
    // Protect video sources periodically
    const videoProtectionInterval = setInterval(protectVideoSources, 500);

    // Block download extensions
    let cleanupNetworkBlocking: (() => void) | undefined;
    if (!shouldBypass) {
      blockDownloadExtensions();
      cleanupNetworkBlocking = blockNetworkSniffing();
      
      // Also run protection on DOM changes
      const domObserver = new MutationObserver(() => {
        blockDownloadExtensions();
        protectVideoSources();
      });
      domObserver.observe(document.body, { childList: true, subtree: true });
    }

    // Add CSS to prevent selection, downloads, and extension UI
    if (!shouldBypass) {
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
          pointer-events: auto;
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
        /* Hide IDM and other download manager UI injections */
        [id*="idm"], [class*="idm"], 
        [id*="thunder"], [class*="thunder"],
        [id*="eagleget"], [class*="eagleget"],
        [id*="download-manager"], [class*="download-manager"],
        [id*="video-download"], [class*="video-download"] {
          display: none !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }
        /* Prevent download tooltips */
        video::after {
          content: none !important;
        }
        iframe {
          pointer-events: auto;
        }
        /* Protect video container */
        .video-protected-container {
          position: relative;
        }
        .video-protected-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
          pointer-events: none;
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
      clearInterval(videoProtectionInterval);
      
      if (cleanupNetworkBlocking) {
        cleanupNetworkBlocking();
      }
      
      const styleEl = document.getElementById('content-protection-style');
      if (styleEl) styleEl.remove();
      
      const cspEl = document.getElementById('security-csp');
      if (cspEl) cspEl.remove();
    };
  }, [isAdmin, blockDownloadExtensions, blockNetworkSniffing]);
}
