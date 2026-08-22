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
    icon: data.icon || '/web-app-manifest-192x192.png',
    badge: data.badge || '/badge-96x96.png',
    tag: data.tag || 'milk-diary-notification',
    vibrate: [200, 100, 200],
    renotify: true,
    data: data,
  };

  console.log('[Service Worker] Received push event:', data);

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/#/customer/overview';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if a client window is already open
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && client.url && !client.url.includes('#/customer/overview')) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      // If no window is open, open a new one with the HashRouter path
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
