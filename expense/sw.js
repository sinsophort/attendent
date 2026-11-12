/* Trip Expense Manager — PWA Launcher service worker: caches only the launcher shell.
   The app itself (Google Apps Script) is always loaded live from Google. */
var CACHE = 'trip-launcher-v4';
var SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE && k !== 'tem-badge'; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
/* real push messages (Firebase Cloud Messaging, sent by the Apps Script server) */
function bumpBadge() {
  return caches.open('tem-badge').then(function (c) {
    return c.match('n').then(function (r) { return r ? r.text() : '0'; }).then(function (t) {
      var n = (parseInt(t, 10) || 0) + 1;
      return c.put('n', new Response(String(n))).then(function () {
        try { if (self.navigator && self.navigator.setAppBadge) self.navigator.setAppBadge(n); } catch (e) {}
        return n;
      });
    });
  }).catch(function () { return 0; });
}
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (er) { d = { data: { body: e.data ? e.data.text() : '' } }; }
  var m = d.data || d.notification || d || {};
  e.waitUntil(bumpBadge().then(function () {
    return self.registration.showNotification(String(m.title || 'Trip Expense').slice(0, 120), {
      body: String(m.body || '').slice(0, 500), icon: 'icon-192.png', badge: 'icon-192.png', tag: m.tag || ('tem-' + Date.now()), renotify: true
    });
  }));
});
/* tapping an alert opens (or focuses) the app */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) { if ('focus' in list[i]) return list[i].focus(); }
    return self.clients.openWindow ? self.clients.openWindow('./') : null;
  }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  /* network first (so updates show), cache as offline fallback */
  e.respondWith(fetch(req).then(function (res) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copy); });
    return res;
  }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match('index.html'); }); }));
});
