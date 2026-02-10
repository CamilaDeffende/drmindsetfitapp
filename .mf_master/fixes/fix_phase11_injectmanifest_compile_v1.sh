#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1

echo "==> FIX Phase11: sw.ts types + vite.config.ts VitePWA block rebuild (injectManifest)"

# -----------------------------------------------------------------------------
# 1) Fix src/sw.ts (TS2339 event.request)
# -----------------------------------------------------------------------------
SW="src/sw.ts"
test -f "$SW" || { echo "❌ faltando: $SW"; exit 2; }

python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/sw.ts")
s = p.read_text(encoding="utf-8")

# Replace setCatchHandler block to be TS-safe
# We rebuild only the setCatchHandler(...) call to avoid brittle micro-edits.
pattern = r"setCatchHandler\s*\(\s*async\s*\(\s*\{\s*event\s*\}\s*\)\s*=>\s*\{[\s\S]*?\}\s*\)\s*;"

replacement = r'''setCatchHandler(async ({ event }) => {
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
});'''

if re.search(pattern, s):
    s2 = re.sub(pattern, replacement, s)
else:
    # Fallback: if user has a slightly different formatting, patch the two offending lines
    s2 = s
    s2 = s2.replace("if (event.request.mode === \"navigate\") {", "const req = (event as any)?.request as Request | undefined;\n\n  if (req && req.mode === \"navigate\") {")
    s2 = s2.replace("return indexHandler({ request: event.request } as any);", "return indexHandler({ request: req } as any);")

p.write_text(s2, encoding="utf-8")
print("✅ patched:", p)
PY

# -----------------------------------------------------------------------------
# 2) Rebuild VitePWA({ ... }) block in vite.config.ts (remove broken workbox leftovers)
# -----------------------------------------------------------------------------
V="vite.config.ts"
test -f "$V" || { echo "❌ faltando: $V"; exit 3; }

python3 - <<'PY'
from pathlib import Path
import re

p = Path("vite.config.ts")
s = p.read_text(encoding="utf-8")

# Find "VitePWA(" call
m = re.search(r"VitePWA\s*\(\s*\{", s)
if not m:
    raise SystemExit("❌ Não encontrei VitePWA({ no vite.config.ts")

# Find end of the object by brace counting (starting after '{')
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
            end_obj = j
            break
    j += 1
else:
    raise SystemExit("❌ Não consegui achar fechamento do objeto VitePWA")

# Find closing ')' of VitePWA(...)
end_call = s.find(")", end_obj)
if end_call == -1:
    raise SystemExit("❌ Não encontrei ')' de fechamento do VitePWA(...)")

# Build a clean golden VitePWA config.
# Keep your manifest fields exactly (MindsetFit etc.) and includeAssets.
gold = r'''
    VitePWA({
      registerType: "autoUpdate",
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.ts",
      injectRegister: "auto",
      includeAssets: ["pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "MindsetFit",
        short_name: "MindsetFit",
        description: "Plataforma premium de treino e nutrição",
        theme_color: "#0B0F1A",
        background_color: "#0B0F1A",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      devOptions: { enabled: true },
      injectManifest: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        globIgnores: ["**/brand/mindsetfit-wordmark.png"],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
    })
'''.strip("\n")

# Replace the whole VitePWA({ ... }) call with golden block (preserving indentation context)
before = s[:m.start()]
after = s[end_call+1:]
s2 = before + gold + after

# Sanity checks
if "workbox:" in s2:
    # if still appears somewhere else, that's suspicious but not fatal
    pass
if "VitePWA({" not in s2 and "VitePWA({" not in s2.replace(" ", ""):
    raise SystemExit("❌ Sanity: VitePWA block sumiu.")

p.write_text(s2, encoding="utf-8")
print("✅ rebuilt VitePWA block:", p)
PY

echo "==> quick preview"
rg -n "VitePWA\\(|registerType:|strategies:|injectManifest:|workbox:" -n vite.config.ts || true
echo

# -----------------------------------------------------------------------------
# 3) VERIFY
# -----------------------------------------------------------------------------
echo "==> VERIFY"
npm run -s verify

echo
echo "============================================================"
echo "✅ FIX OK | Phase11 injectManifest compila | BUILD VERDE"
echo "============================================================"
