// GroenPlan Service Worker — app-shell + runtime caching voor offline gebruik.
// Strategie:
//  - navigatie (HTML): network-first, val terug op de gecachete shell wanneer offline
//  - same-origin assets (JS/CSS/fonts/afbeeldingen): cache-first, anders netwerk + cachen
//  - /api/* en externe bronnen (Open-Meteo, Google Fonts, PlantNet): nooit cachen, altijd live
// __BUILD_ID__ wordt bij `vite build` vervangen door versie + build-id, zodat een
// nieuwe deploy automatisch een nieuwe cache krijgt en de oude shell opruimt.
const CACHE = "groenplan-__BUILD_ID__";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // externe bronnen ongemoeid laten
  if (url.pathname.startsWith("/api/")) return;     // AI/weer/plantnet altijd live

  // Navigatieverzoeken: network-first met shell-fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const kopie = res.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", kopie));
          return res;
        })
        .catch(() => caches.match("/index.html").then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Statische assets: cache-first, op de achtergrond bijwerken
  event.respondWith(
    caches.match(request).then((gecached) => {
      const netwerk = fetch(request)
        .then((res) => {
          if (res.ok && res.type === "basic") {
            const kopie = res.clone();
            caches.open(CACHE).then((c) => c.put(request, kopie));
          }
          return res;
        })
        .catch(() => gecached);
      return gecached || netwerk;
    }),
  );
});
