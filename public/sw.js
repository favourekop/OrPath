/* OrPath offline worker — resilient shell + saved Scripture cache. */
const CACHE_NAME = "orpath-shell-v3";
const BIBLE_CACHE_NAME = "orpath-bible-v2";
const LEGACY_BIBLE_CACHES = ["orpath-bible-v1"];
const OFFLINE_URL = "/offline.html";
const APP_SHELL = ["/", "/bible", "/manifest.json", OFFLINE_URL, "/orpath-logo.svg", "/orpath-icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // One missing optional asset must never prevent the worker installing.
    await Promise.allSettled(APP_SHELL.map(async (url) => {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response.ok) await cache.put(url, response);
      } catch { /* optional shell item; offline fallback remains available */ }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    // Preserve/migrate Scripture already downloaded by earlier OrPath versions.
    const nextBible = await caches.open(BIBLE_CACHE_NAME);
    for (const legacyName of LEGACY_BIBLE_CACHES) {
      const legacy = await caches.open(legacyName);
      for (const request of await legacy.keys()) {
        if (!(await nextBible.match(request))) {
          const response = await legacy.match(request);
          if (response) await nextBible.put(request, response);
        }
      }
    }
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) =>
      key.startsWith("orpath-shell-") && key !== CACHE_NAME
    ).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function bibleResponse(request) {
  const cache = await caches.open(BIBLE_CACHE_NAME);
  const cached = await cache.match(request);
  // Cached Scripture/catalogue is immediately usable offline; refresh online.
  if (cached) {
    fetch(request).then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
    }).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response && response.ok) await cache.put(request, response.clone());
    return response;
  } catch {
    return new Response(JSON.stringify({
      message: "This Scripture item is not saved on this device yet. Connect to the internet and download the translation for offline reading."
    }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname === "/api/bible") {
    event.respondWith(bibleResponse(request));
    return;
  }

  // Do not cache authenticated pages or private account/API responses.
  if (url.pathname.startsWith("/auth") || url.pathname.startsWith("/account") ||
      url.pathname.startsWith("/dashboard") || url.pathname.startsWith("/admin") ||
      (url.pathname.startsWith("/api/") && url.pathname !== "/api/bible")) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cache = await caches.open(CACHE_NAME);
        const exact = await cache.match(request);
        if (exact) return exact;
        if (url.pathname.startsWith("/bible")) {
          const biblePage = await cache.match("/bible");
          if (biblePage) return biblePage;
        }
        return (await cache.match("/")) || (await cache.match(OFFLINE_URL)) ||
          new Response("You are offline. Reopen OrPath after reconnecting.", { status: 503 });
      }
    })());
    return;
  }

  if (url.pathname.startsWith("/_next/static/") ||
      url.pathname.startsWith("/founder-") ||
      url.pathname.startsWith("/orpath-") ||
      url.pathname.match(/\.(?:css|js|woff2?|png|jpe?g|webp|svg|ico)$/)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached) {
        fetch(request).then((response) => {
          if (response && response.ok) cache.put(request, response.clone());
        }).catch(() => {});
        return cached;
      }
      try {
        const response = await fetch(request);
        if (response && response.ok) await cache.put(request, response.clone());
        return response;
      } catch { return Response.error(); }
    })());
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
