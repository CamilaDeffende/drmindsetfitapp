#!/usr/bin/env bash
# ==============================================================================
# MF_VISUAL_LOCK_V2 — Pixel pipeline 1:1 por tela (skins por rota + Playwright)
# Objetivo: replicar 1:1 cada tela das imagens SEM quebrar lógica.
# Estratégia:
#   - data-mf-route no <html> baseado no pathname (react-router)
#   - CSS "skins" por rota (sem editar cada página)
#   - Playwright visual snapshots para travar pixel-perfect
# Regras: idempotente, backups, BUILD VERDE obrigatório.
# ==============================================================================
set -euo pipefail

echo "==> MF_VISUAL_LOCK_V2: start"
[ -f package.json ] || { echo "❌ rode no repo"; exit 1; }

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

# ---------- [0] sanity: V1 aplicado ----------
# Procuramos marker do V1 no App.tsx OU import do mf-neon.css no entry
if ! rg -n "mf-neon\.css" src/main.tsx src/main.ts 2>/dev/null | rg -q "import"; then
  info "Não encontrei import do mf-neon.css no entry."
  info "Recomendado: rode MF_VISUAL_LOCK_V1 antes."
fi

# ---------- [A] CSS skins por rota ----------
# Importa um css extra com overrides por rota (pixel-level).
write_if_changed "src/styles/mf-skins.css" <<'CSS'
/* =============================================================================
   MF_NEON_SKINS_V2 — skins por rota (pixel-level)
   Como funciona:
     <html data-mf-route="dashboard"> ... </html>
   Você ajusta aqui até ficar 1:1 com as imagens.
============================================================================= */

/* base de “polimento” geral (seguro, não quebra layout) */
:root{
  --mf-space-1: 8px;
  --mf-space-2: 12px;
  --mf-space-3: 16px;
  --mf-space-4: 20px;
  --mf-space-5: 24px;
  --mf-space-6: 28px;
}

/* micro-ajustes globais */
.mf-card { transform: translateZ(0); }
.mf-btn { letter-spacing: 0.02em; }

/* ============================================================================
   SKINS (exemplos) — ajuste fino 1:1 por tela
   DICA: use DevTools → copie medidas e replique aqui.
============================================================================ */

/* Dashboard */
html[data-mf-route="dashboard"] .mf-card{
  /* exemplo: intensificar glow do dashboard */
  box-shadow: var(--mf-shadow), 0 0 18px rgba(0,240,255,.10), 0 0 24px rgba(123,92,255,.10);
}

/* Metabolismo */
html[data-mf-route="metabolismo"] .mf-card::before{
  opacity: .62;
}

/* Plano */
html[data-mf-route="plano"] .mf-sep{
  opacity: .85;
}

/* Treinos */
html[data-mf-route="treinos"] .mf-grid{
  opacity: .40;
}

/* Onboarding (se existir rota /onboarding/step-*) */
html[data-mf-route^="onboarding"] .mf-card{
  border: 1px solid rgba(255,255,255,.10);
}
CSS

# garantir import do mf-skins.css no entry (junto do mf-neon.css)
ENTRY=""
if [ -f "src/main.tsx" ]; then ENTRY="src/main.tsx"; fi
if [ -z "$ENTRY" ] && [ -f "src/main.ts" ]; then ENTRY="src/main.ts"; fi
[ -n "$ENTRY" ] || die "não achei src/main.tsx ou src/main.ts"

patch_text "$ENTRY" r'''
    # idempotência
    if re.search(r'(?m)^\s*import\s+["\']\.\/styles\/mf-skins\.css["\'];\s*$', text):
        return text
    # injeta após mf-neon.css se existir, senão após primeiro import
    if "mf-neon.css" in text:
        text = re.sub(r'(?m)^(import\s+["\']\.\/styles\/mf-neon\.css["\'];\s*)$',
                      r'\1\nimport "./styles/mf-skins.css";',
                      text, count=1)
        return text
    m = re.search(r'(?m)^\s*import\s+.*$', text)
    if not m:
        return 'import "./styles/mf-skins.css";\n' + text
    i = m.end()
    return text[:i] + '\nimport "./styles/mf-skins.css";\n' + text[i:]
'''

# ---------- [B] Componente que escreve data-mf-route no <html> ----------
write_if_changed "src/components/mf/MFRouteSkin.tsx" <<'TSX'
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function sanitizeRoute(pathname: string) {
  // "/" -> "dashboard" (default)
  if (!pathname || pathname === "/") return "dashboard";
  // remove query/hash já vêm limpos do location.pathname
  const p = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  // converte "onboarding/step-2" -> "onboarding-step-2"
  return p.replace(/[^\w\-\/]/g, "").replace(/\//g, "-").toLowerCase();
}

/**
 * MFRouteSkin — escreve data-mf-route no <html> baseado na rota.
 * Permite CSS 1:1 por tela sem editar cada página.
 */
export function MFRouteSkin() {
  const loc = useLocation();

  useEffect(() => {
    const id = sanitizeRoute(loc.pathname);
    document.documentElement.setAttribute("data-mf-route", id);
  }, [loc.pathname]);

  return null;
}
TSX

# ---------- [C] Inserir MFRouteSkin dentro do Router (App.tsx) ----------
APPF=""
for cand in src/App.tsx src/app/App.tsx src/pages/App.tsx; do
  [ -f "$cand" ] && APPF="$cand" && break
done
[ -n "$APPF" ] || die "não achei App.tsx"

patch_text "$APPF" r'''
    if "MF_ROUTE_SKIN_V2" in text:
        return text

    # adiciona import do MFRouteSkin
    if re.search(r'(?m)^\s*import\s*\{\s*MFRouteSkin\s*\}\s*from\s*["\']', text):
        pass
    else:
        # detecta alias @/
        import_path = "./components/mf/MFRouteSkin"
        try:
            from pathlib import Path
            import json
            ts = Path("tsconfig.json")
            if ts.exists():
                j = json.loads(ts.read_text(encoding="utf-8"))
                paths = (((j.get("compilerOptions") or {}).get("paths")) or {})
                if isinstance(paths, dict) and any(k.startswith("@/") or k == "@/*" or k.startswith("@/*") for k in paths.keys()):
                    import_path = "@/components/mf/MFRouteSkin"
        except Exception:
            pass

        imports = list(re.finditer(r'(?m)^\s*import\s+.*?;\s*$', text))
        imp_line = f'\nimport {{ MFRouteSkin }} from "{import_path}";\n'
        if imports:
            i = imports[-1].end()
            text = text[:i] + imp_line + text[i:]
        else:
            text = imp_line + text

    # injeta <MFRouteSkin /> dentro do <BrowserRouter> (ou Router) se existir
    # heurística: após a primeira ocorrência de "<BrowserRouter" ou "<Router"
    if "<MFRouteSkin" in text:
        return text

    m = re.search(r'(<BrowserRouter\b[^>]*>)', text)
    if not m:
        m = re.search(r'(<Router\b[^>]*>)', text)

    if m:
        insert = '\n{/* MF_ROUTE_SKIN_V2 */}\n<MFRouteSkin />\n'
        text = text[:m.end()] + insert + text[m.end():]
        return text

    # fallback: se não achou Router tags, não arrisca quebrar
    return text
'''

# ---------- [D] Playwright visual regression (snapshot por rota) ----------
# Se vocês já usam Playwright, isso cria um spec paralelo só de UI.
# Importante: snapshots só passam depois que você "aprova" as imagens base.
ensure_devpkg "@playwright/test"

mkdir -p tests/visual

write_if_changed "tests/visual/screens.visual.spec.ts" <<'TS'
import { test, expect } from "@playwright/test";

const routes = [
  "/",                 // dashboard (default)
  "/metabolismo",
  "/plano",
  "/treinos",
  // adicione aqui as rotas reais do seu app:
  // "/onboarding/step-1",
  // "/relatorio",
];

test.describe("MF Visual Lock V2 — snapshots", () => {
  for (const r of routes) {
    test(`snapshot: ${r}`, async ({ page }) => {
      await page.goto(r, { waitUntil: "networkidle" });
      // aguarda hidratação básica
      await page.waitForTimeout(400);
      await expect(page).toHaveScreenshot(
        [`mf-${r === "/" ? "dashboard" : r.replace(/\//g, "-").replace(/^-/, "")}.png`],
        {
          fullPage: true,
          // tolerância baixa pra travar pixel; ajuste se tiver animações
          maxDiffPixelRatio: 0.001,
        }
      );
    });
  }
});
TS

# ---------- [E] verify ----------
echo "==> verify (BUILD VERDE obrigatório)"
npm run -s verify
ok "MF_VISUAL_LOCK_V2: done"

echo
echo "==> COMO USAR O PIXEL LOCK"
echo "1) Gerar baseline (primeira vez): npx playwright test tests/visual --update-snapshots"
echo "2) Depois, travar:            npx playwright test tests/visual"
echo "3) Ajuste 1:1: edite src/styles/mf-skins.css por rota até bater com as imagens."
