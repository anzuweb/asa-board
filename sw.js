// あさ/よる じゅんびボード - オフライン用 Service Worker
// 画像はキャッシュ優先で読み込むため、ネットが不安定でもイラストが消えない。
// 画像を差し替えたら CACHE のバージョン名を上げること(例: v2 → v3)。
const CACHE = 'asaboard-v3';
const ASSETS = [
  './',
  './index.html',
  './images/hanky.png',
  './images/dinner.png',
  './images/bath.png',
  './images/breakfast.png',
  './images/teeth.png',
  './images/sunscreen.png',
  './images/clothes.png',
  './images/bugspray.png',
  './images/taion.png',
  './images/toilet.png',
  './images/socks.png',
  './images/floss.png',
  './images/teeth-night.png',
  './images/toilet-night.png',
  './images/celebrate.png',
  './images/celebrate-night.png',
  './images/icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 画像: キャッシュ優先(無ければ取得してキャッシュ)
  if (url.pathname.includes('/images/')) {
    e.respondWith(
      caches.match(req).then((hit) =>
        hit || fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
      )
    );
    return;
  }

  // HTML等: ネット優先(更新を取りに行く)。失敗したらキャッシュ
  if (req.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('index.html')) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('./index.html')))
    );
  }
});
