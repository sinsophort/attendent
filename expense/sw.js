/* Trip Expense Manager — PWA Launcher service worker: caches only the launcher shell.
   The app itself (Google Apps Script) is always loaded live from Google. */
var CACHE = 'trip-launcher-v27';
var SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png', 'favicon-32.png', 'badge-96.png'];
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
      /* icon = the big picture (the app icon); badge = the small status-bar icon: Android needs it white on transparent,
         otherwise it shows a plain white square */
      body: String(m.body || '').slice(0, 500), icon: 'icon-192.png', badge: 'badge-96.png', tag: m.tag || ('tem-' + Date.now()), renotify: true,
      /* an incoming call stays on screen and vibrates longer (Android) */
      requireInteraction: /^call:/.test(String(m.go || '')), vibrate: /^call:/.test(String(m.go || '')) ? [500, 250, 500, 250, 500] : undefined,
      data: { go: validGo(m.go), msg: typeof m.msg === 'string' ? m.msg.slice(0, 2500) : '' }
    });
  }));
});
function validGo(g) { return /^(chat|exp|req|page|call):[A-Za-z0-9@_-]{1,90}$/.test(String(g || '')) ? String(g) : ''; }
/* tapping an alert opens (or focuses) the app and goes straight to that expense / request / chat */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var go = validGo(e.notification.data && e.notification.data.go);
  /* the chat message itself travels with the alert, so the app can show it at once */
  var msg = go && /^chat:/.test(go) && e.notification.data && typeof e.notification.data.msg === 'string' ? e.notification.data.msg.slice(0, 2500) : '';
  /* iPhone may deliver our message to a sleeping app late: also leave the target in the shared cache,
     which the launcher reads the moment it comes to the front */
  var keep = go ? caches.open('tem-badge').then(function (c) { return c.put('go', new Response(JSON.stringify({ go: go, msg: msg, t: Date.now() }))); }).catch(function () {}) : Promise.resolve();
  e.waitUntil(keep.then(function () { return self.clients.matchAll({ type: 'window', includeUncontrolled: true }); }).then(function (list) {
    /* tell every open window (iPhone may list the app more than once), then bring one to the front */
    var win = list.filter(function (c) { return 'focus' in c; });
    if (win.length) {
      if (go) win.forEach(function (c) { try { c.postMessage({ type: 'tem-go', go: go, msg: msg }); } catch (er) {} });
      return win[0].focus().catch(function () {});
    }
    return self.clients.openWindow ? self.clients.openWindow('./' + (go ? '?go=' + encodeURIComponent(go) + (msg ? '&gm=' + encodeURIComponent(msg) : '') : '')) : null;
  }));
});
/* 1.1.35: a chat video plays while it downloads. The player asks for pieces (byte ranges); this worker asks the
   launcher page for each piece, the page asks the app, and the app fetches it from Google Drive. */
function vsAsk(list, sid, off, len) {
  var i = 0;
  var one = function () {
    if (i >= list.length) return Promise.reject(new Error('no player'));
    var cl = list[i++];
    return new Promise(function (ok, bad) {
      var ch = new MessageChannel(), t = setTimeout(function () { bad(new Error('timeout')); }, 45000);
      ch.port1.onmessage = function (ev) { clearTimeout(t); var d = ev.data || {}; if (d.ok) ok({ d: d, cl: cl }); else bad(new Error(d.err || 'no data')); };
      cl.postMessage({ type: 'tem-vs-req', sid: sid, off: off, len: len }, [ch.port2]);
    }).catch(function (e) { if (e.message === 'gone' && i < list.length) return one(); throw e; });
  };
  return one();
}
function vsServe(e, url) {
  var m = /\/__vs\/([A-Za-z0-9]{6,40})\//.exec(url.pathname);
  if (!m) return Promise.resolve(new Response('', { status: 404 }));
  var sid = m[1], rg = /bytes=(\d+)-(\d*)/.exec(e.request.headers.get('range') || ''), a = rg ? Number(rg[1]) : 0;
  var who = e.clientId ? self.clients.get(e.clientId) : Promise.resolve(null);
  return who.then(function (c) { return c ? [c] : self.clients.matchAll({ type: 'window' }); }).then(function (list) {
    var want = rg && rg[2] ? Number(rg[2]) - a + 1 : 262144;
    return vsAsk(list, sid, a, Math.max(1, Math.min(262144, want))).then(function (x) {
      var d = x.d, size = Number(d.size) || 0, mime = String(d.mime || 'video/mp4'), only = [x.cl];
      if (!size || a >= size) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
      var b = rg && rg[2] ? Math.min(Number(rg[2]), size - 1) : size - 1;
      var first = new Uint8Array(d.buf || new ArrayBuffer(0)), pos, stop = false;
      if (first.length > b - a + 1) first = first.subarray(0, b - a + 1);
      pos = a + first.length;
      var body = new ReadableStream({
        start: function (ctl) { if (first.length) ctl.enqueue(first); if (pos > b) ctl.close(); },
        pull: function (ctl) {
          if (stop || pos > b) return;
          return vsAsk(only, sid, pos, Math.min(524288, b - pos + 1)).then(function (y) {
            var u = new Uint8Array(y.d.buf || new ArrayBuffer(0));
            if (stop) return;
            if (!u.length) { ctl.close(); return; }
            if (u.length > b - pos + 1) u = u.subarray(0, b - pos + 1);
            pos += u.length; ctl.enqueue(u);
            if (pos > b) ctl.close();
          }, function (er) { if (!stop) ctl.error(er); });
        },
        cancel: function () { stop = true; }
      });
      var h = { 'Content-Type': mime, 'Content-Length': String(b - a + 1), 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
      if (rg) h['Content-Range'] = 'bytes ' + a + '-' + b + '/' + size;
      return new Response(body, { status: rg ? 206 : 200, headers: h });
    });
  }).catch(function () { return new Response('', { status: 504 }); });
}
self.addEventListener('fetch', function (e) {
  var req = e.request, u0 = new URL(req.url);
  if (req.method === 'GET' && u0.origin === self.location.origin && u0.pathname.indexOf('/__vs/') !== -1) { e.respondWith(vsServe(e, u0)); return; }
  if (req.method !== 'GET' || u0.origin !== self.location.origin) return;
  /* network first (so updates show), cache as offline fallback */
  e.respondWith(fetch(req).then(function (res) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(req, copy); });
    return res;
  }).catch(function () { return caches.match(req).then(function (r) { return r || caches.match('index.html'); }); }));
});
