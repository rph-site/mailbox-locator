/* Cache app files only. Airtable and MapTiler requests always use the network. */
const CACHE_NAME = "blue-boxes-shell-2026-10-26.1";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png"];
const LEAFLET = ["https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css", "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"];
const root = new URL(self.registration.scope);
const coreURLs = new Set(CORE.map(path => new URL(path, root).href));
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE.map(path => new Request(new URL(path, root), {cache:"reload"})));
    await Promise.allSettled(LEAFLET.map(async url => {
      const response = await fetch(url, {signal:AbortSignal.timeout(4000)});
      if(response.ok)await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for(const name of await caches.keys())if(name.startsWith("blue-boxes-shell-") && name !== CACHE_NAME)await caches.delete(name);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const request = event.request;
  if(request.method !== "GET")return;
  const url = new URL(request.url);
  const navigation = request.mode === "navigate" && url.origin === root.origin && url.pathname.startsWith(root.pathname);
  if(!navigation && !coreURLs.has(url.href) && !LEAFLET.includes(url.href))return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(request, navigation ? {cache:"no-store"} : {});
      if(response.ok && response.type !== "opaque")await cache.put(navigation ? new URL("./index.html", root).href : request, response.clone());
      return response;
    } catch(error) {
      const saved = await cache.match(navigation ? new URL("./index.html", root).href : request);
      if(saved)return saved;
      throw error;
    }
  })());
});
