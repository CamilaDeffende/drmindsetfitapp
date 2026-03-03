#!/usr/bin/env bash
set -euo pipefail

echo "==> MF_VISUAL_LOCK_V2: start"
die(){ echo "❌ $*"; exit 1; }
ok(){ echo "✅ $*"; }
info(){ echo "ℹ️ $*"; }

backup_file() {
  local f="$1"
  [ -f "$f" ] || return 0
  mkdir -p .backups/ui-lock
  local h
  h="$(python3 - <<PY
import hashlib
print(hashlib.sha1("$f".encode()).hexdigest()[:10])
PY
)"
  cp -f "$f" ".backups/ui-lock/$(basename "$f").${h}.bak-$(date +%Y%m%d_%H%M%S)"
}

write_if_changed(){
  local f="$1"
  local tmp
  tmp="$(mktemp)"
  cat > "$tmp"
  if [ -f "$f" ] && cmp -s "$tmp" "$f"; then
    rm -f "$tmp"
    info "no changes: $f"
    return 0
  fi
  mkdir -p "$(dirname "$f")"
  backup_file "$f"
  mv "$tmp" "$f"
  ok "wrote: $f"
}

patch_text(){
  local f="$1"
  local py="$2"
  backup_file "$f"
  python3 - <<PY
from pathlib import Path
import re, json

p = Path("$f")
text = p.read_text(encoding="utf-8") if p.exists() else ""

def apply(text: str) -> str:
$py
    return text

out = apply(text)
if out == text:
    print("ℹ️ no changes:", p)
else:
    p.write_text(out, encoding="utf-8")
    print("✅ patched:", p)
PY
}

ensure_devpkg(){
  local pkg="$1"
  if ! node -e "require.resolve('$pkg')" >/dev/null 2>&1; then
    info "install(dev): $pkg"
    npm i -D "$pkg"
  else
    info "already(dev): $pkg"
  fi
}

# skins css
write_if_changed "src/styles/mf-skins.css" <<'CSS'
/* MF_NEON_SKINS_V2 */
:root{ --mf-space-1:8px; --mf-space-2:12px; --mf-space-3:16px; --mf-space-4:20px; --mf-space-5:24px; }
html[data-mf-route="dashboard"] .mf-card { box-shadow: var(--mf-shadow), 0 0 18px rgba(0,240,255,.10), 0 0 24px rgba(123,92,255,.10); }
CSS

# import skins no entry
ENTRY=""
if [ -f "src/main.tsx" ]; then ENTRY="src/main.tsx"; fi
if [ -z "$ENTRY" ] && [ -f "src/main.ts" ]; then ENTRY="src/main.ts"; fi
[ -n "$ENTRY" ] || die "não achei src/main.tsx ou src/main.ts"

patch_text "$ENTRY" "$(cat <<'PY'
import re
if re.search(r'(?m)^\s*import\s+["\']\.\/styles\/mf-skins\.css["\'];\s*$', text):
    return text

# após mf-neon se existir
if "mf-neon.css" in text:
    return re.sub(r'(?m)^(import\s+["\']\.\/styles\/mf-neon\.css["\'];\s*)$',
                  r'\1\nimport "./styles/mf-skins.css";',
                  text, count=1)

m = re.search(r'(?m)^\s*import\s+.*$', text)
if not m:
    return 'import "./styles/mf-skins.css";\n' + text
i = m.end()
return text[:i] + '\nimport "./styles/mf-skins.css";\n' + text[i:]
PY
)"

# Route skin component
write_if_changed "src/components/mf/MFRouteSkin.tsx" <<'TSX'
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function sanitizeRoute(pathname: string) {
  if (!pathname || pathname === "/") return "dashboard";
  const p = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  return p.replace(/[^\w\-\/]/g, "").replace(/\//g, "-").toLowerCase();
}

export function MFRouteSkin() {
  const loc = useLocation();
  useEffect(() => {
    document.documentElement.setAttribute("data-mf-route", sanitizeRoute(loc.pathname));
  }, [loc.pathname]);
  return null;
}
TSX

# inject MFRouteSkin inside BrowserRouter/Router
APPF=""
for cand in src/App.tsx src/app/App.tsx src/pages/App.tsx; do
  [ -f "$cand" ] && APPF="$cand" && break
done
[ -n "$APPF" ] || die "não achei App.tsx"

patch_text "$APPF" "$(cat <<'PY'
import re, json
from pathlib import Path

if "MF_ROUTE_SKIN_V2" in text:
    return text

import_path = "./components/mf/MFRouteSkin"
try:
    ts = Path("tsconfig.json")
    if ts.exists():
        j = json.loads(ts.read_text(encoding="utf-8"))
        paths = (((j.get("compilerOptions") or {}).get("paths")) or {})
        if isinstance(paths, dict) and any(k.startswith("@/") or k == "@/*" or k.startswith("@/*") for k in paths.keys()):
            import_path = "@/components/mf/MFRouteSkin"
except Exception:
    pass

if not re.search(r'(?m)^\s*import\s*\{\s*MFRouteSkin\s*\}\s*from\s*["\']', text):
    imports = list(re.finditer(r'(?m)^\s*import\s+.*?;\s*$', text))
    imp_line = f'\nimport {{ MFRouteSkin }} from "{import_path}";\n'
    if imports:
        i = imports[-1].end()
        text = text[:i] + imp_line + text[i:]
    else:
        text = imp_line + text

if "<MFRouteSkin" in text:
    return text

m = re.search(r'(<BrowserRouter\\b[^>]*>)', text)
if not m:
    m = re.search(r'(<Router\\b[^>]*>)', text)

if not m:
    return text

insert = "\\n{/* MF_ROUTE_SKIN_V2 */}\\n<MFRouteSkin />\\n"
text = text[:m.end()] + insert + text[m.end():]
return text
PY
)"

# visual test spec (garante)
mkdir -p tests/visual
if [ ! -f tests/visual/screens.visual.spec.ts ]; then
cat > tests/visual/screens.visual.spec.ts <<'TS'
import { test, expect } from "@playwright/test";

const routes = ["/", "/metabolismo", "/plano", "/treinos"];

test.describe("MF Visual Lock — snapshots", () => {
  for (const r of routes) {
    test(`snapshot: ${r}`, async ({ page }) => {
      await page.goto(r, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      const name = `mf-${r === "/" ? "dashboard" : r.replace(/\//g, "-").replace(/^-/, "")}.png`;
      await expect(page).toHaveScreenshot([name], { fullPage: true, maxDiffPixelRatio: 0.001 });
    });
  }
});
TS
fi

ensure_devpkg "@playwright/test"

echo "==> verify"
npm run -s verify
ok "MF_VISUAL_LOCK_V2: done"

echo
echo "==> VISUAL LOCK"
echo "npx playwright test -c playwright.visual.config.ts --list"
echo "npx playwright test -c playwright.visual.config.ts --update-snapshots"
echo "npx playwright test -c playwright.visual.config.ts"
