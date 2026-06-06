const CACHE_NAME = "corre-br-prototype-v1";
const FILES = [
  "./",
  "./index.html",
  "./landing.html",
  "./analytics.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES)));
});

self.addEventListener("fetch", (event) => {
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
});
