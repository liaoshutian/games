const CACHE = "poolo-kids-v1.0.2";
const SHELL = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./engine.js",
  "./rules.js",
  "./vendor/three.min.js",
  "./icon.svg",
  "./apple-touch-icon.png",
  "./icon-192.png",
  "./icon-512.png",
  "./manifest.webmanifest",
  "./design.html",
];
self.addEventListener("install", (event) =>
  event.waitUntil(
    (async () => {
      const c = await caches.open(CACHE);
      await c.addAll(SHELL.map((url) => new Request(url, { cache: "reload" })));
      await self.skipWaiting();
    })(),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      for (const k of await caches.keys())
        if (
          (k.startsWith("poolo-kids-") ||
            k.startsWith("candy-planet-shell-")) &&
          k !== CACHE
        )
          await caches.delete(k);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (event) => {
  const u = new URL(event.request.url),
    scope = new URL(self.registration.scope);
  if (
    event.request.method !== "GET" ||
    u.origin !== scope.origin ||
    !u.pathname.startsWith(scope.pathname)
  )
    return;
  event.respondWith(
    (async () => {
      const c = await caches.open(CACHE);
      try {
        const r = await fetch(event.request, { cache: "no-cache" });
        if (r.ok) await c.put(event.request, r.clone());
        return r;
      } catch {
        const cached = await c.match(event.request);
        if (cached) return cached;
        if (event.request.mode === "navigate") return c.match("./index.html");
        return new Response("", { status: 503, statusText: "Offline" });
      }
    })(),
  );
});
