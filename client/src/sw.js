import { precacheAndRoute } from 'workbox-precaching';

// Precaching assets automatically injected by Vite PWA
precacheAndRoute(self.__WB_MANIFEST || []);

// Custom Push Notification Listeners
self.addEventListener('push', (event) => {
  let data = { title: 'Milk Diary Update', body: 'New delivery recorded!' };
  
  if (event.data) {
    try {
      data = event.data.json();
    } catch (err) {
      data = { title: 'Milk Diary Update', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/web-app-manifest-192x192.png',
    badge: '/favicon-96x96.png',
    tag: data.tag || 'milk-diary-notification',
    renotify: true,
  };

  console.log('[Service Worker] Received push event:', data);

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/customer/overview')
  );
});
