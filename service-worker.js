
// Simple cache-first service worker with versioned cache
const CACHE_VERSION = 'v1';
const CACHE_NAME = `game-cache-${CACHE_VERSION}`;
const CORE_ASSETS = [
  '/index.html',
  '/manifest.webmanifest',
  '/sw-update.js'// Add other core assets here (images, audio, WASM, JS bundles)
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => {
      if (!k.includes(CACHE_VERSION)) return caches.delete(k);
    }))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Network-first for HTML (so updates ship quickly), cache-first for others
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkThenCache(req));
  } else {
    event.respondWith(cacheThenNetwork(req));
  }
});

async function cacheThenNetwork(req) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res && res.ok) cache.put(req, res.clone());
  return res;
}

async function networkThenCache(req) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const res = await fetch(req);
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const cached = await cache.match(req);
    if (cached) return cached;
    throw err;
  }
}

// Notify page when a new SW is ready
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// On new SW installed, inform clients
self.addEventListener('install', () => {
  self.registration.waiting?.postMessage({ type: 'SW_UPDATE_AVAILABLE' });
});
