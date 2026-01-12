// ===================================
// CHIPS Income Tracker v2 - Service Worker
// ===================================

const CACHE_NAME = 'chips-v2-cache-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/config.js',
    '/js/api.js',
    '/js/app.js',
    '/manifest.json',
    '/assets/icon-192.png',
    '/assets/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;600&family=Outfit:wght@300;400;500;600;700&display=swap',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name !== CACHE_NAME)
                        .map(name => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip Google Apps Script requests (always fetch from network)
    if (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com') {
        event.respondWith(fetch(request));
        return;
    }
    
    // For static assets, try cache first
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached version and update cache in background
                    event.waitUntil(
                        fetch(request)
                            .then(networkResponse => {
                                if (networkResponse.ok) {
                                    caches.open(CACHE_NAME)
                                        .then(cache => cache.put(request, networkResponse));
                                }
                            })
                            .catch(() => {})
                    );
                    return cachedResponse;
                }
                
                // Not in cache, fetch from network
                return fetch(request)
                    .then(networkResponse => {
                        // Cache successful responses
                        if (networkResponse.ok && request.method === 'GET') {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(request, responseToCache));
                        }
                        return networkResponse;
                    });
            })
            .catch(() => {
                // Offline fallback for HTML pages
                if (request.headers.get('Accept').includes('text/html')) {
                    return caches.match('/index.html');
                }
            })
    );
});

// Background sync for offline data
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // This will be triggered when connection is restored
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
        client.postMessage({ type: 'SYNC_COMPLETE' });
    });
}

// Push notification handler (for future use)
self.addEventListener('push', event => {
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/assets/icon-192.png',
        badge: '/assets/icon-192.png',
        vibrate: [100, 50, 100]
    };
    
    event.waitUntil(
        self.registration.showNotification('CHIPS Tracker', options)
    );
});
