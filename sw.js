const CACHE_NAME = 'minimakers-pwa-v2';

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

// Estratégia Cache-First com Network Fallback e Cache Dinâmico
self.addEventListener('fetch', (event) => {
  // Apenas responder a requisições GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retorna a resposta do cache imediatamente
        // E em segundo plano atualiza se necessário
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(() => {
          // Ignora erros de rede quando offline
        });
        return cachedResponse;
      }

      // Se não estiver no cache, busca na rede e guarda no cache dinâmico
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // Se a requisição de página HTML falhar offline, tenta servir ide.html ou index.html
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('./ide.html') || caches.match('./index.html');
        }
      });
    })
  );
});
