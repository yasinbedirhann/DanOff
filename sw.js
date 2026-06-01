self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : { title: 'DanOff', body: 'New notification' };
    event.waitUntil(
        self.registration.showNotification(data.title, {
            body: data.body,
            icon: '/favicon.ico',
            vibrate: [200, 100, 200]
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    event.waitUntil(clients.openWindow('/'));
});
