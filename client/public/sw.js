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
    icon: '/logo.png',
    badge: '/logo.png',
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
