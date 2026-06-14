/// <reference lib="webworker" />
// Simple cache-first service worker for PWA installability.
const CACHE_NAME = "folio-v1";
const PRECACHE_URLS = ["/", "/browse", "/search", "/auth", "/manifest.webmanifest"];

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip cross-origin requests (Supabase, fonts, CDN)
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML navigation (always fresh)
  if (event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      (async () => {
        try {
          const networkRes = await fetch(event.request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkRes.clone());
          return networkRes;
        } catch {
          const cached = await caches.match(event.request);
          return cached ?? new Response("Offline — Folio", { status: 503 });
        }
      })(),
    );
    return;
  }

  // Cache-first for assets (JS, CSS, images, fonts)
  event.respondWith(
    (async () => {
      const cached = await caches.match(event.request);
      if (cached) return cached;
      try {
        const networkRes = await fetch(event.request);
        if (networkRes.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, networkRes.clone());
        }
        return networkRes;
      } catch {
        return new Response("Offline", { status: 503 });
      }
    })(),
  );
});

export {};
