/* IrisTrix — Service Worker para usar sin internet */
const CACHE_NAME = "iristrix-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/main.js",
  "./assets/logo-iglesia.png",
  "./assets/fondo.gif",
  "./assets/cards/jesus.png",
  "./assets/cards/moises.png",
  "./assets/cards/isaias.png",
  "./assets/cards/david.png",
  "./assets/cards/jeremias.png",
  "./assets/cards/salomon.png",
  "./assets/cards/eliseo.png",
  "./assets/cards/jonas.png",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js",
  "https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.mode !== "navigate" && !e.request.url.startsWith("http")) return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((r) => {
      const clone = r.clone();
      if (r.ok && (e.request.url.startsWith(self.location.origin) || e.request.url.includes("cdn.jsdelivr.net") || e.request.url.includes("fonts.googleapis")))
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
      return r;
    }))
  );
});
