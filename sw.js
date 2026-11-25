/* 自动生成：批 18 PWA 首屏缓存。改 tools/build.mjs 后重新构建。 */
const CACHE = 'na-b18-b4d4197c';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './web/vendor/phaser.min.js',
  './web/fonts/game.woff2',
  './web/atlas/core.png',
  './web/icons/icon-180.png',
  './web/icons/icon-192.png',
  './web/icons/icon-512.png',
  './web/icons/icon-maskable-512.png',
  './dist/assets.815d84ee.js',
  './dist/game.6d2e3c21.js',
];
const isAsset = (path) => path.endsWith('/manifest.json') || path.includes('/dist/') || path.includes('/web/');
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => (key.indexOf('na-b17-') === 0 || key.indexOf('na-b18-') === 0) && key !== CACHE).map((key) => caches.delete(key)),
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.indexOf('/web/audio/') >= 0) return; // 音乐/音效懒加载，不占离线首屏缓存
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then((res) => {
      if (res.ok) caches.open(CACHE).then((cache) => cache.put('./index.html', res.clone()));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  if (!isAsset(url.pathname)) return;
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => {
    if (res.ok) caches.open(CACHE).then((cache) => cache.put(req, res.clone()));
    return res;
  })));
});
