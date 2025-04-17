import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Service worker version for cache busting
const SW_VERSION = '1.0.0';
const CACHE_NAME = `disaster-platform-${SW_VERSION}`;

// Resources to pre-cache
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/notification-badge.png',
  '/locales/en/common.json',
  '/locales/or/common.json'
];

// Install event - precache static resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => cacheName.startsWith('disaster-platform-'))
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Precache and route assets from the manifest
precacheAndRoute(self.__WB_MANIFEST);

// Cache map tiles
registerRoute(
  ({ url }) => url.pathname.includes('tile.openstreetmap.org'),
  new CacheFirst({
    cacheName: 'map-tiles',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 1000,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
      }),
    ],
  })
);

// Cache static assets
registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script' ||
                   request.destination === 'image',
  new StaleWhileRevalidate({
    cacheName: 'static-assets',
  })
);

// Main fetch event handler
self.addEventListener('fetch', event => {
  const { request } = event;
  
  // Skip non-GET requests except for API endpoints
  if (request.method !== 'GET' && !request.url.includes('/api/')) {
    return;
  }

  // Skip chrome-extension requests
  if (request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Handle API requests with network-first strategy
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful GET responses
          if (request.method === 'GET' && response.ok) {
            const responseToCache = response.clone();
            caches.open('api-responses')
              .then(cache => cache.put(request, responseToCache));
          }
          return response;
        })
        .catch(async error => {
          // Try to get cached response for GET requests
          if (request.method === 'GET') {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
              return cachedResponse;
            }
          }
          
          // Return offline response
          return new Response(
            JSON.stringify({
              error: 'You are offline',
              offline: true
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match('/offline.html'))
    );
    return;
  }

  // Handle all other requests with stale-while-revalidate
  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        const fetchPromise = fetch(request)
          .then(networkResponse => {
            // Cache successful responses
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, responseToCache));
            }
            return networkResponse;
          });
        return cachedResponse || fetchPromise;
      })
  );
});

// Push event - handle incoming push notifications
self.addEventListener('push', event => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/notification-badge.png',
        tag: data.tag,
        data: data.data,
        actions: data.actions,
        vibrate: [200, 100, 200],
        requireInteraction: data.requireInteraction || false,
        renotify: data.renotify || false
      })
    );
  } catch (error) {
    console.error('Push event error:', error);
  }
});

// Notification click event - handle notification interactions
self.addEventListener('notificationclick', event => {
  const notification = event.notification;
  const action = event.action;
  const data = notification.data;

  // Close the notification
  notification.close();

  // Handle click action
  if (action === 'view' && data?.url) {
    // Focus on existing window or open new one
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(windowClients => {
          // Try to focus existing window
          for (const client of windowClients) {
            if (client.url === data.url) {
              return client.focus();
            }
          }
          // Open new window if none exists
          return clients.openWindow(data.url);
        })
    );
  }
});

// Sync event - handle background sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncReports());
  }
});

// Periodic sync event - handle periodic background tasks
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-alerts') {
    event.waitUntil(updateAlerts());
  }
});

// Helper function to sync reports
async function syncReports() {
  // Implementation for syncing reports when back online
  // This would typically involve:
  // 1. Getting queued reports from IndexedDB
  // 2. Sending them to the server
  // 3. Clearing the queue if successful
}

// Helper function to update alerts
async function updateAlerts() {
  // Implementation for periodic alert updates
  // This would typically involve:
  // 1. Fetching latest alerts from the server
  // 2. Updating IndexedDB cache
  // 3. Showing notifications for new critical alerts
}

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  // You could track notification dismissals here
  console.log('Notification was closed', event.notification);
});