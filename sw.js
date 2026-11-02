'use strict';
/* ========================================================
   2 Oda 1 Bomba – Çevrimdışı Servis Çalışanı (Service Worker)
   Tüm kartları, arayüzü ve komut dosyalarını önbelleğe alır;
   zayıf Wi-Fi ve mobil veri kopmalarında oyunun takılmadan açılmasını sağlar.
   ======================================================== */

const CACHE_NAME = '2oda1bomba-v0.6.4';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './config.js',
  './relay.js',
  './manifest.webmanifest',
  './icon.svg',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './cards/back.jpg',
  './cards/baskan.jpg',
  './cards/bombaci.jpg',
  './cards/ajan_mavi.jpg',
  './cards/ajan_kirmizi.jpg',
  './cards/casus_mavi.jpg',
  './cards/casus_kirmizi.jpg',
  './cards/doktor.jpg',
  './cards/muhendis.jpg',
  './cards/takim_mavi.jpg',
  './cards/takim_kirmizi.jpg',
  './cards/sarhos.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Sayfa gezintisi için Ağ Öncelikli (Network First) - güncel sürümü getir, çevrimdışıysa önbellekten ver
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match('./index.html') || caches.match('./'))
    );
    return;
  }

  // Statik varlıklar (CSS, JS, kart görselleri) için Önbellek Öncelikli / Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchPromise = fetch(req)
        .then(res => {
          if (res && res.status === 200 && (res.type === 'basic' || res.type === 'cors')) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
