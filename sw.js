const CACHE_NAME = 'minimakers-pwa-v5';

const STATIC_ASSETS = [
  './',
  './index.html',
  './ide.html',
  './style.css',
  './landing.css',
  './main.js',
  './script.js',
  './pwa-installer.js',
  './manifest.json',
  './favicon.ico',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './logo.svg',
  './hero-premium.png',
  './criancas_robotica_1.png',
  './criancas_robotica_2.png',
  './mascote.png',
  './badge.png'
];

// Instalação do Service Worker e pré-carregamento dos ativos essenciais
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pré-cacheando arquivos estáticos');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Algum ativo falhou no pre-cache, continuando...', err);
      });
    })
  );
  self.skipWaiting();
});

// Ativação e limpeza de caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[ServiceWorker] Removendo cache antigo:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de busca do Service Worker: Network-First para HTML, Cache-First para estáticos
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isHtml = event.request.headers.get('accept')?.includes('text/html');

  if (isHtml) {
    // Para navegação HTML: Network First com fallback para cache
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match('./ide.html').then((ideRes) => ideRes || caches.match('./index.html'));
          });
        })
    );
  } else {
    // Para ativos estáticos (CSS, JS, Imagens): Cache First com atualização em background
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        });
      })
    );
  }
});
