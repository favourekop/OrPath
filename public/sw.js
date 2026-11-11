const CACHE_NAME = "orpath-shell-v1";
const OFFLINE_URL = "/offline.html";
const APP_SHELL = ["/", "/about", "/manifest.json", OFFLINE_URL, "/orpath-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Bible API responses are public Scripture data. Cache each exact GET URL so
  // translations, chapter lists, chapters and searches already viewed can reopen offline.
  if (url.pathname === "/api/bible") {
    event.respondWith((async () => {
      const cache = await caches.open("orpath-bible-v1");
      try {
        const response = await fetch(request);
        if (response && response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await cache.match(request);
        return cached || new Response(JSON.stringify({
          message: "This Scripture item has not been saved for offline use yet. Reconnect and open it once."
        }), { status: 503, headers: { "Content-Type": "application/json" } });
      }
    })());
    return;
  }

  // Never cache private account pages or other authenticated API responses.
  if (url.pathname.startsWith("/auth") || url.pathname.startsWith("/account") ||
      url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/admin") ||
      url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        const shell = await caches.match("/");
        return shell || caches.match(OFFLINE_URL);
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/founder-") ||
      url.pathname.startsWith("/orpath-") || url.pathname.match(/\.(?:css|js|woff2?|png|jpe?g|webp|svg|ico)$/)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && response.ok) cache.put(request, response.clone());
        return response;
      } catch {
        return cached || Response.error();
      }
    })());
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
