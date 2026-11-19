'use strict';
/* ========================================================
   2 Oda 1 Bomba – Çevrimdışı Servis Çalışanı (Service Worker)
   Tüm kartları, arayüzü ve komut dosyalarını önbelleğe alır;
   zayıf Wi-Fi ve mobil veri kopmalarında oyunun takılmadan açılmasını sağlar.
   ======================================================== */

const CACHE_NAME = '2oda1bomba-v0.7.0';
const NAV_TIMEOUT_MS = 4000; // Sayfa açılışında ağ bu süre içinde cevap vermezse önbellekteki kopya açılır
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

// Önbellekten sayfa getir: tam eşleşme yoksa (ek parametre vb.) index.html ve kök adrese düşer
function navFromCache(req) {
  return caches.match(req, { ignoreSearch: true })
    .then(r => r || caches.match('./index.html', { ignoreSearch: true }))
    .then(r => r || caches.match('./', { ignoreSearch: true }));
}

// Hiçbir şey bulunamazsa tarayıcının beyaz hata sayfası yerine gösterilecek basit sayfa
function offlineResponse() {
  const html = '<!doctype html><html lang="tr"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>2 Oda 1 Bomba</title></head>' +
    '<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;' +
    'background:#0b0d14;color:#fff;font-family:system-ui,sans-serif;text-align:center;padding:24px">' +
    '<div><h2>Bağlantı kurulamadı</h2>' +
    '<p>İnternet bağlantınızı kontrol edin, ardından tekrar deneyin.</p>' +
    '<button onclick="location.reload()" style="padding:12px 28px;font-size:16px;border:0;border-radius:12px;' +
    'background:#f59e0b;color:#000;font-weight:700">Tekrar Dene</button></div></body></html>';
  return new Response(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Sayfa gezintisi için Ağ Öncelikli (Network First) - güncel sürümü getir.
  // Ağ hata verirse ya da NAV_TIMEOUT_MS içinde cevap vermezse önbellekten, o da yoksa basit hata sayfasından ver.
  if (req.mode === 'navigate') {
    event.respondWith(new Promise(resolve => {
      let settled = false;
      const finish = r => { if (r && !settled) { settled = true; resolve(r); } };
      const timer = setTimeout(() => { navFromCache(req).then(finish); }, NAV_TIMEOUT_MS);

      fetch(req)
        .then(res => {
          clearTimeout(timer);
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone)).catch(() => {});
          }
          finish(res);
        })
        .catch(() => {
          clearTimeout(timer);
          navFromCache(req).then(r => finish(r || offlineResponse()));
        });
    }));
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
