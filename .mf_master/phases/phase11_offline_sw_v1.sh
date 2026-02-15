#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1

echo "==> Phase11: custom SW via injectManifest + offline fallback"

# -----------------------------------------------------------------------------
# 1) Garantir offline.html existe (public/offline.html já existe no seu projeto)
# -----------------------------------------------------------------------------
if [[ ! -f public/offline.html ]]; then
  echo "❌ faltando: public/offline.html"
  exit 2
fi

# -----------------------------------------------------------------------------
# 2) Criar src/sw.ts (Workbox injectManifest)
# -----------------------------------------------------------------------------
mkdir -p src

cat > src/sw.ts <<'TS'
/// <reference lib="webworker" />
/* eslint-disable no-restricted-globals */

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
  // Para navegação, tenta offline.html primeiro
  if (event.request.mode === "navigate") {
    try {
      const offline = await caches.match("/offline.html");
      if (offline) return offline;
    } catch {
      // ignore
    }
    // fallback final: index shell
    return indexHandler({ request: event.request } as any);
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
TS

echo "==> wrote: src/sw.ts"

# -----------------------------------------------------------------------------
# 3) Patch vite.config.ts: trocar generateSW(workbox) -> injectManifest
# -----------------------------------------------------------------------------
V="vite.config.ts"
test -f "$V" || { echo "❌ faltando: $V"; exit 3; }

python3 - <<'PY'
from pathlib import Path
import re

p = Path("vite.config.ts")
s = p.read_text(encoding="utf-8")

if "strategies: \"injectManifest\"" in s or "strategies: 'injectManifest'" in s:
    print("ℹ️ vite.config.ts já parece estar em injectManifest. Pulando patch pesado.")
    raise SystemExit(0)

# 1) localizar bloco VitePWA({ ... })
m = re.search(r"VitePWA\s*\(\s*\{", s)
if not m:
    raise SystemExit("❌ Não encontrei VitePWA({ no vite.config.ts")

# heuristic: achar o fechamento do objeto do plugin contando chaves
i = m.end()
depth = 1
j = i
while j < len(s):
    ch = s[j]
    if ch == "{":
        depth += 1
    elif ch == "}":
        depth -= 1
        if depth == 0:
            # j aponta para '}' do objeto
            end_obj = j
            break
    j += 1
else:
    raise SystemExit("❌ Não consegui achar fechamento do objeto VitePWA")

# Encontrar o fechamento do call "VitePWA({ ... })"
k = end_obj + 1
while k < len(s) and s[k].isspace():
    k += 1
if k >= len(s) or s[k] != ")":
    # pode haver espaços/comentários; tenta achar o próximo ')'
    kp = s.find(")", end_obj)
    if kp == -1:
        raise SystemExit("❌ Não encontrei ')' de fechamento do VitePWA(...)")
    end_call = kp
else:
    end_call = k

# Extrair o corpo atual para preservar manifest/includeAssets
body = s[m.end():end_obj]

# Remover bloco workbox inteiro, se existir
body2 = re.sub(r"(?s)\bworkbox\s*:\s*\{[\s\S]*?\}\s*,?\s*", "", body)

# Inserir config injectManifest após manifest/includeAssets
inject_block = """
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: "auto",
      devOptions: {
        enabled: true,
      },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        globIgnores: ["**/brand/mindsetfit-wordmark.png"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
"""

# Garanta que não duplica
if "injectManifest" not in body2:
    # coloca antes do fechamento do objeto
    body2 = body2.rstrip() + "\n" + inject_block

# Reconstruir
s2 = s[:m.end()] + body2 + s[end_obj:end_call+1] + s[end_call+1:]

# Sanity: ainda tem manifest
if "manifest:" not in s2:
    raise SystemExit("❌ Sanity: manifest sumiu do VitePWA config.")

p.write_text(s2, encoding="utf-8")
print("✅ patched:", p)
PY

echo "==> preview vite.config.ts (VitePWA block excerpt)"
rg -n "VitePWA\\(|strategies:|injectManifest:|workbox:" -n vite.config.ts | head -n 80 || true

# -----------------------------------------------------------------------------
# 4) VERIFY
# -----------------------------------------------------------------------------
echo
echo "==> mf verify"
npm run -s verify

echo
echo "============================================================"
echo "✅ Phase 11 (SW custom + offline fallback) aplicado | BUILD VERDE"
echo "============================================================"
