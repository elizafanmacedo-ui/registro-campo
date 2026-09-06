const CACHE_NAME = 'registro-campo-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icone-180.png',
  './icone-192.png',
  './icone-512.png',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js'
];

// Instala e faz cache dos arquivos essenciais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.log('Cache parcial:', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativa e limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Intercepta requisições — usa cache quando offline
self.addEventListener('fetch', event => {
  // Só intercepta GET
  if (event.request.method !== 'GET') return;

  // Firebase Realtime Database — não cachear, deixar falhar offline (app trata localmente)
  if (event.request.url.includes('firebaseio.com') || 
      event.request.url.includes('identitytoolkit')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Guarda no cache para uso futuro
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline e não está no cache — retorna o index.html como fallback
        return caches.match('./index.html');
      });
    })
  );
});
