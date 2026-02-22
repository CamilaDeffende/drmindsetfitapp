#!/usr/bin/env bash
set -euo pipefail

echo "==> MF_VISUAL_LOCK_V1: start"
ROOT="$(pwd)"

# ---------- helpers ----------
die(){ echo "❌ $*"; exit 1; }
ok(){ echo "✅ $*"; }
info(){ echo "ℹ️ $*"; }

backup_file() {
  local f="$1"
  [ -f "$f" ] || return 0
  mkdir -p .backups/ui-lock
  cp -f "$f" ".backups/ui-lock/$(basename "$f").bak-$(date +%Y%m%d_%H%M%S)"
}

ensure_pkg() {
  local pkg="$1"
  if ! node -e "require.resolve('$pkg')" >/dev/null 2>&1; then
    info "install: $pkg"
    npm i "$pkg"
  else
    info "already: $pkg"
  fi
}

ensure_devpkg() {
  local pkg="$1"
  if ! node -e "require.resolve('$pkg')" >/dev/null 2>&1; then
    info "install(dev): $pkg"
    npm i -D "$pkg"
  else
    info "already(dev): $pkg"
  fi
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
import re

p = Path("$f")
s = p.read_text(encoding="utf-8") if p.exists() else ""

def apply(text):
    $py
    return text

out = apply(s)
if out == s:
    print("ℹ️ no changes:", p)
else:
    p.write_text(out, encoding="utf-8")
    print("✅ patched:", p)
PY
}

# ---------- [A] deps (somente visual) ----------
# framer-motion para animações premium
ensure_pkg "framer-motion"

# ---------- [B] Design System: tokens + utilities ----------
# 1) CSS tokens e classes (glass, glow, rings, gradients)
write_if_changed "src/styles/mf-neon.css" <<'CSS'
/* =============================================================================
   MF_NEON_DS_V1 — tokens + utilities (premium neon)
   Objetivo: reproduzir glass/glow/gradientes (igual às referências)
============================================================================= */

:root{
  --mf-bg-deep: #05060A;
  --mf-bg-0: #070812;
  --mf-card-a: rgba(18,22,40,0.82);
  --mf-card-b: rgba(10,14,25,0.62);

  --mf-text: #EAF2FF;
  --mf-muted: rgba(255,255,255,.62);
  --mf-soft: rgba(255,255,255,.42);

  --mf-neon-cyan: #00F0FF;
  --mf-neon-violet: #7B5CFF;
  --mf-neon-green: #00FFB2;

  --mf-border: rgba(255,255,255,.08);
  --mf-border-2: rgba(255,255,255,.12);

  --mf-shadow: 0 18px 45px rgba(0,0,0,.55);
  --mf-shadow-soft: 0 10px 28px rgba(0,0,0,.42);

  --mf-glow-cyan-1: 0 0 12px rgba(0,240,255,.28), 0 0 26px rgba(0,240,255,.14);
  --mf-glow-violet-1: 0 0 12px rgba(123,92,255,.24), 0 0 26px rgba(123,92,255,.12);
  --mf-glow-green-1: 0 0 12px rgba(0,255,178,.22), 0 0 24px rgba(0,255,178,.10);

  --mf-radius: 22px;
  --mf-radius-sm: 16px;
  --mf-radius-xs: 12px;
}

/* fundo global estilo “deep space” */
.mf-bg-deep{
  background:
    radial-gradient(1200px 700px at 65% 15%, rgba(123,92,255,.18), transparent 60%),
    radial-gradient(900px 520px at 30% 0%, rgba(0,240,255,.14), transparent 55%),
    radial-gradient(900px 520px at 40% 85%, rgba(0,255,178,.10), transparent 60%),
    linear-gradient(180deg, var(--mf-bg-0), var(--mf-bg-deep));
  color: var(--mf-text);
}

/* card glass premium */
.mf-card{
  border-radius: var(--mf-radius);
  border: 1px solid var(--mf-border);
  background: linear-gradient(180deg, var(--mf-card-a), var(--mf-card-b));
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  box-shadow: var(--mf-shadow);
  position: relative;
  overflow: hidden;
}
.mf-card::before{
  content:"";
  position:absolute; inset:0;
  background:
    radial-gradient(600px 220px at 22% 12%, rgba(255,255,255,.10), transparent 55%),
    radial-gradient(520px 240px at 78% 0%, rgba(0,240,255,.10), transparent 60%);
  opacity:.55;
  pointer-events:none;
}

/* borda “neon hairline” */
.mf-hairline{
  border: 1px solid rgba(255,255,255,.06);
}

/* glow helpers */
.mf-glow-cyan{ box-shadow: var(--mf-glow-cyan-1); }
.mf-glow-violet{ box-shadow: var(--mf-glow-violet-1); }
.mf-glow-green{ box-shadow: var(--mf-glow-green-1); }

/* botão premium */
.mf-btn{
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.10);
  background: linear-gradient(90deg, rgba(0,240,255,.22), rgba(123,92,255,.18));
  box-shadow: 0 10px 26px rgba(0,0,0,.45), var(--mf-glow-cyan-1);
  color: var(--mf-text);
  transition: transform .12s ease, filter .12s ease, box-shadow .12s ease;
}
.mf-btn:hover{ filter: brightness(1.06); }
.mf-btn:active{ transform: scale(.97); }

/* texto */
.mf-muted{ color: var(--mf-muted); }
.mf-soft{ color: var(--mf-soft); }

/* separators */
.mf-sep{
  height:1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
  opacity:.7;
}

/* ring (para kcal / timers) */
.mf-ring{
  filter: drop-shadow(0 0 12px rgba(0,240,255,.20)) drop-shadow(0 0 18px rgba(123,92,255,.14));
}

/* micro-grid (muito sutil) */
.mf-grid{
  background-image:
    linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
  background-size: 42px 42px;
  background-position: -1px -1px;
  opacity: .35;
}

/* HUD halo (avatar) */
.mf-halo{
  position: relative;
}
.mf-halo::before{
  content:"";
  position:absolute;
  inset:-18px;
  border-radius: 999px;
  background:
    radial-gradient(circle at 50% 50%, rgba(0,240,255,.18), transparent 62%),
    radial-gradient(circle at 30% 30%, rgba(123,92,255,.16), transparent 58%),
    radial-gradient(circle at 70% 70%, rgba(0,255,178,.10), transparent 60%);
  filter: blur(2px);
  pointer-events:none;
}
CSS

# 2) garantir import do css no entry (main.tsx/main.ts)
ENTRY=""
if [ -f "src/main.tsx" ]; then ENTRY="src/main.tsx"; fi
if [ -z "$ENTRY" ] && [ -f "src/main.ts" ]; then ENTRY="src/main.ts"; fi
[ -n "$ENTRY" ] || die "não achei src/main.tsx ou src/main.ts"

patch_text "$ENTRY" r'''
import_re = r'(?m)^\s*import\s+["\']\.\/styles\/mf-neon\.css["\'];\s*$'
if re.search(import_re, text):
    return text
# injeta após primeiro import
m = re.search(r'(?m)^\s*import\s+.*$', text)
if not m:
    return 'import "./styles/mf-neon.css"\n' + text
i = m.end()
return text[:i] + '\nimport "./styles/mf-neon.css";\n' + text[i:]
'''

# ---------- [C] Wrapper premium (AppShell) ----------
# Cria um wrapper que aplica fundo, grid sutil e padding consistente
write_if_changed "src/components/mf/AppShell.tsx" <<'TSX'
import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * MF AppShell — aplica o "deep space" e baseline de layout premium
 * Não altera lógica do app; só envolve conteúdo.
 */
export function AppShell({ children, className }: Props) {
  return (
    <div className={`mf-bg-deep min-h-screen ${className ?? ""}`}>
      <div className="pointer-events-none fixed inset-0 mf-grid" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-[520px] px-4 pb-28 pt-6">
        {children}
      </div>
    </div>
  );
}
TSX

# ---------- [D] Card/Section premium reutilizável ----------
write_if_changed "src/components/mf/MFCard.tsx" <<'TSX'
import React from "react";

type Props = {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  subtitle?: string;
};

export function MFCard({ title, right, subtitle, children, className }: Props) {
  return (
    <section className={`mf-card p-5 ${className ?? ""}`}>
      {(title || right) ? (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? (
              <h3 className="text-[15px] font-semibold tracking-wide">{title}</h3>
            ) : null}
            {subtitle ? (
              <p className="mt-0.5 text-xs mf-muted">{subtitle}</p>
            ) : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
TSX

# ---------- [E] Motion wrappers ----------
write_if_changed "src/components/mf/MFMotion.tsx" <<'TSX'
import React from "react";
import { motion } from "framer-motion";

type Props = {
  children: React.ReactNode;
  className?: string;
  delay?: number;
};

export function MFEnter({ children, className, delay = 0 }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8, filter: "blur(2px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.28, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
TSX

# ---------- [F] Patch App.tsx para envolver conteúdo com AppShell (sem quebrar rotas) ----------
# Estratégia: se App.tsx retorna <Router>...</Router> ou <Routes>..., envolve com <AppShell>.
# Caso já esteja envolvido, não mexe.
APPF=""
for cand in src/App.tsx src/app/App.tsx src/pages/App.tsx; do
  [ -f "$cand" ] && APPF="$cand" && break
done
[ -n "$APPF" ] || die "não achei App.tsx em locais comuns"

patch_text "$APPF" r'''
# idempotência
if "AppShell" in text and "src/components/mf/AppShell" in text:
    return text

# adiciona import
if "from \"./components/mf/AppShell\"" in text or "from '@/components/mf/AppShell'" in text:
    pass
else:
    # tenta inserir após imports existentes
    imp = '\nimport { AppShell } from "./components/mf/AppShell";\n'
    m = re.search(r'(?s)\A(.*?\n)(\s*\n)?', text)
    if m:
        # insere após bloco inicial de imports (heurística)
        # encontra último import
        imports = list(re.finditer(r'(?m)^\s*import\s+.*?;\s*$', text))
        if imports:
            i = imports[-1].end()
            text = text[:i] + imp + text[i:]
        else:
            text = imp + text

# envolve return principal: tenta pegar "return (" do App e envolver o primeiro nó
# Heurística simples: troca "return (" por "return (<AppShell>" e fecha antes do ");"
if re.search(r'AppShell\s*>\s*', text):
    return text

# coloca AppShell logo após "return ("
text = re.sub(r'(\breturn\s*\(\s*)', r'\1<AppShell>\n', text, count=1)

# fecha AppShell antes do ");" do return do componente
# tenta fechar no último ");" do arquivo
text = re.sub(r'(\n\s*\)\s*;\s*\n\s*\}\s*\n\s*export\s+default\s+App\s*;?\s*)\Z',
              r'\n</AppShell>\n\1', text, count=1)
# fallback: fecha antes do primeiro ");" após o return
if "</AppShell>" not in text:
    text = re.sub(r'(\n\s*\)\s*;\s*)', r'\n</AppShell>\n\1', text, count=1)

return text
'''

# ---------- [G] Ajuste fino de base typography via Tailwind (sem quebrar) ----------
# Se existir src/index.css ou src/styles/globals.css, injeta um pequeno baseline.
BASE=""
for cand in src/index.css src/styles/globals.css src/styles/index.css; do
  [ -f "$cand" ] && BASE="$cand" && break
done
if [ -n "$BASE" ]; then
  patch_text "$BASE" r'''
  if "MF_TYPO_BASELINE_V1" in text:
      return text
  block = """
/* MF_TYPO_BASELINE_V1 */
html, body {
  background: var(--mf-bg-deep);
  color: var(--mf-text);
}
* { -webkit-tap-highlight-color: transparent; }
"""
  return text + "\n" + block
  '''
else
  info "não achei css global (ok) — usando mf-neon.css no AppShell"
fi

# ---------- [H] Smoke verify ----------
echo "==> verify (BUILD VERDE obrigatório)"
npm run -s verify
ok "MF_VISUAL_LOCK_V1: done"
