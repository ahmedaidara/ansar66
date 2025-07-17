self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('ansar-almouyassar-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/main.css',
        '/main.js',
        '/chatbotResponses.js',
        '/logo.png'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        if (event.request.url.endsWith('.png') || event.request.url.endsWith('.jpg') || event.request.url.endsWith('.mp4')) {
          return caches.match('/assets/images/default-photo.png');
        }
        return new Response('Ressource non trouvée', { status: 404 });
      });
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data.json();
  const title = data.title || 'ANSAR ALMOUYASSAR';
  const options = {
    body: data.body,
    icon: '/assets/images/default-photo.png'
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
