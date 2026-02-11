/// <reference lib="webworker" />
// Workbox (bundleado pelo vite-plugin-pwa em injectManifest)
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { registerRoute, setCatchHandler } from "workbox-routing";
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Precache (gerado no build)
precacheAndRoute(self.__WB_MANIFEST);

// -----------------------------
// Navigation (SPA) — NetworkFirst
// Se falhar (offline e sem cache), entrega /offline.html
// -----------------------------
const indexHandler = createHandlerBoundToURL("/index.html");

registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: "mf-pages",
    networkTimeoutSeconds: 3,
  })
);

// Catch global: se um handler falhar, tenta offline.html, senão index
setCatchHandler(async ({ event }) => {
  const req = (event as any)?.request as Request | undefined;

  // Para navegação, tenta offline.html primeiro
  if (req && req.mode === "navigate") {
    try {
      const offline = await caches.match("/offline.html");
      if (offline) return offline;
    } catch {
      // ignore
    }
    // fallback final: index shell
    return indexHandler({ request: req } as any);
  }

  // Para outros requests, apenas falha normalmente
  return Response.error();
});

// -----------------------------
// Assets — CSS/JS/Fonts (SWR)
// -----------------------------
registerRoute(
  ({ request }) =>
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font",
  new StaleWhileRevalidate({
    cacheName: "mf-assets",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 60 * 60 * 24 * 14, // 14 dias
      }),
    ],
  })
);

// -----------------------------
// Images / brand — CacheFirst
// -----------------------------
registerRoute(
  ({ request, url }) => request.destination === "image" || url.pathname.startsWith("/brand/"),
  new CacheFirst({
    cacheName: "mf-images",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 dias
      }),
    ],
  })
);

// -----------------------------
// SW lifecycle
// -----------------------------
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
