// Service Worker - Network First, No Aggressive Caching
// This ensures users always get the latest content

const CACHE_NAME = 'concrete-logic-v2';

// Install event - skip caching to ensure fresh content
self.addEventListener('install', (event) => {
  // Immediately activate
  self.skipWaiting();
});

// Activate event - clear ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => caches.delete(name))
      );
    }).then(() => {
      // Take control immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - ALWAYS go to network first, no fallback caching
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip API requests, Supabase, and function calls
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase') ||
      event.request.url.includes('/functions/') ||
      event.request.url.includes('/rest/')) {
    return;
  }

  // For navigation requests (HTML pages), always fetch from network
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store', // Bypass browser cache
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        }
      }).catch(() => {
        // Only on network failure, try cache
        return caches.match('/index.html');
      })
    );
    return;
  }

  // For other assets (JS, CSS, images), use network first
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .catch(() => caches.match(event.request))
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// Background sync for offline submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  console.log('Syncing progress data...');
}
