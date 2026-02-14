// Service Worker - Network First with Aggressive Video Caching
// Videos are cached for instant replays and smooth seeking

const APP_CACHE = 'archistudio-app-v3';
const VIDEO_CACHE = 'archistudio-video-v1';
const MAX_VIDEO_CACHE_SIZE = 50; // max cached video entries

// Install - skip waiting
self.addEventListener('install', () => self.skipWaiting());

// Activate - clean old caches, keep video cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((n) => n !== APP_CACHE && n !== VIDEO_CACHE)
          .map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// Helper: is this a video/stream request?
function isVideoRequest(url) {
  return (
    url.includes('/stream-video') ||
    url.includes('/course-videos/') ||
    url.includes('googleapis.com/drive') ||
    /\.(mp4|webm|m4v|mov)(\?|$)/i.test(url)
  );
}

// Helper: trim video cache to max size
async function trimVideoCache() {
  const cache = await caches.open(VIDEO_CACHE);
  const keys = await cache.keys();
  if (keys.length > MAX_VIDEO_CACHE_SIZE) {
    // Delete oldest entries first
    const toDelete = keys.slice(0, keys.length - MAX_VIDEO_CACHE_SIZE);
    await Promise.all(toDelete.map((k) => cache.delete(k)));
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Skip API/auth requests entirely
  if (
    url.includes('/rest/') ||
    url.includes('/auth/') ||
    url.includes('supabase.co/auth')
  ) {
    return;
  }

  // === VIDEO REQUESTS: Cache-first for instant replay ===
  if (isVideoRequest(url)) {
    // Only cache full responses (no Range for simplicity & reliability)
    const hasRange = event.request.headers.get('range');

    if (hasRange) {
      // Range requests: network only (browser handles partial content natively)
      return;
    }

    event.respondWith(
      caches.open(VIDEO_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;

        const response = await fetch(event.request);
        if (response.ok || response.status === 206) {
          // Clone and cache in background (don't block playback)
          const clone = response.clone();
          cache.put(event.request, clone).then(() => trimVideoCache());
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // === EDGE FUNCTION / SUPABASE CALLS: always network ===
  if (url.includes('/functions/') || url.includes('supabase')) {
    return;
  }

  // === NAVIGATION: network first ===
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // === STATIC ASSETS: network first, cache fallback ===
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(() =>
      caches.match(event.request)
    )
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  console.log('Syncing progress data...');
}
