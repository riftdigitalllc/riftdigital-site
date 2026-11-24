// Trip boards offline cache. Network first so republished pages show up when online;
// cache fallback so the pages still open with no signal after one visit.
var CACHE = 'tripboards-v1795506317';
var PRECACHE = ['/trip/', '/trip/tokyo/', '/trip/bangkok/'];
self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(PRECACHE); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  var ours = url.origin === self.location.origin && (url.pathname.indexOf('/trip/') === 0 || url.pathname === '/favicon.png');
  var fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if(!ours && !fonts) return;
  e.respondWith(
    fetch(e.request).then(function(res){
      if(res && (res.ok || res.type === 'opaque')){ var copy = res.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copy); }); }
      return res;
    }).catch(function(){
      return caches.match(e.request, {ignoreSearch: true}).then(function(hit){
        if(hit) return hit;
        if(e.request.mode === 'navigate'){ var p = url.pathname.replace(/index\.html$/, ''); return caches.match(p); }
        return Response.error();
      });
    })
  );
});
