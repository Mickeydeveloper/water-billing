const CACHE_NAME = 'mickey-water-billing-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/signup.html',
  '/main.html',
  '/records.html',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // Add your CSS and JS files here if you have external ones
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600,700&display=swap',
  'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        // Clone the request for network fetch
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseToCache = response.clone();

            // Cache successful GET requests
            if (event.request.method === 'GET') {
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });
            }

            return response;
          })
          .catch(() => {
            // Return offline fallback for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
          });
      })
  );
});

// Handle Push Notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event);

  if (!event.data) {
    console.log('Push notification but no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/icon-192x192.svg',
      badge: data.badge || '/icon-192x192.svg',
      data: data.data || {},
      requireInteraction: true,
      silent: false,
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icon-192x192.svg'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Water Billing', options)
    );
  } catch (error) {
    console.error('Error processing push notification:', error);
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('Water Billing', {
        body: 'You have a new notification',
        icon: '/icon-192x192.svg',
        badge: '/icon-192x192.svg'
      })
    );
  }
});

// Handle Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event);

  event.notification.close();

  const notificationData = event.notification.data || {};
  let url = '/';

  // Determine URL based on action or data
  if (event.action === 'view' && notificationData.url) {
    url = notificationData.url;
  } else if (notificationData.url) {
    url = notificationData.url;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus();
          }
        }

        // If no suitable window is found, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
      .catch((error) => {
        console.error('Error handling notification click:', error);
      })
  );
});

// Handle background sync for offline actions (optional)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered');
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  // This could sync offline data when connection is restored
  console.log('Performing background sync...');
}</content>
<parameter name="filePath">vscode-vfs://github/Mickeydeveloper/water-billing/service-worker.js