#!/usr/bin/env bash
set -euo pipefail
echo "==> MF_VISUAL_LOCK_V1(min): start"

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

# deps
ensure_pkg "framer-motion"

# css neon
write_if_changed "src/styles/mf-neon.css" <<'CSS'
/* MF_NEON_DS_V1 (minimal safe) */
:root{
  --mf-bg-deep:#05060A;
  --mf-bg-0:#070812;
  --mf-card-a: rgba(18,22,40,0.82);
  --mf-card-b: rgba(10,14,25,0.62);
  --mf-text:#EAF2FF;
  --mf-muted: rgba(255,255,255,.62);
  --mf-border: rgba(255,255,255,.08);
  --mf-shadow: 0 18px 45px rgba(0,0,0,.55);
  --mf-radius: 22px;
}
.mf-bg-deep{
  background:
    radial-gradient(1200px 700px at 65% 15%, rgba(123,92,255,.18), transparent 60%),
    radial-gradient(900px 520px at 30% 0%, rgba(0,240,255,.14), transparent 55%),
    linear-gradient(180deg, var(--mf-bg-0), var(--mf-bg-deep));
  color: var(--mf-text);
}
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
.mf-muted{ color: var(--mf-muted); }
.mf-grid{
  background-image:
    linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px);
  background-size: 42px 42px;
  opacity: .35;
}
CSS

# AppShell + MFCard (não patcha App.tsx aqui — só garante componentes e css)
write_if_changed "src/components/mf/AppShell.tsx" <<'TSX'
import React from "react";
type Props = { children: React.ReactNode; className?: string };
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

write_if_changed "src/components/mf/MFCard.tsx" <<'TSX'
import React from "react";
type Props = { title?: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode; className?: string };
export function MFCard({ title, subtitle, right, children, className }: Props) {
  return (
    <section className={`mf-card p-5 ${className ?? ""}`}>
      {(title || right) ? (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {title ? <h3 className="text-[15px] font-semibold tracking-wide">{title}</h3> : null}
            {subtitle ? <p className="mt-0.5 text-xs mf-muted">{subtitle}</p> : null}
          </div>
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
TSX

# import mf-neon.css no entry (patch simples com sed)
ENTRY=""
[ -f src/main.tsx ] && ENTRY="src/main.tsx"
[ -z "$ENTRY" ] && [ -f src/main.ts ] && ENTRY="src/main.ts"
[ -n "$ENTRY" ] || die "não achei src/main.tsx/main.ts"

if ! rg -n "mf-neon\\.css" "$ENTRY" >/dev/null 2>&1; then
  backup_file "$ENTRY"
  # injeta após o primeiro import
  perl -0777 -i -pe "s/(^\\s*import[^;]*;\\s*\\n)/\\$1import \\\"\\.\\/styles\\/mf-neon.css\\\";\\n/m" "$ENTRY" || true
  # fallback: se não existir import, coloca no topo
  if ! rg -n "mf-neon\\.css" "$ENTRY" >/dev/null 2>&1; then
    perl -0777 -i -pe "s/^/import \\\"\\.\\/styles\\/mf-neon.css\\\";\\n/" "$ENTRY"
  fi
  ok "patched entry: $ENTRY"
else
  info "entry already imports mf-neon.css"
fi

echo "==> verify"
npm run -s verify
ok "MF_VISUAL_LOCK_V1(min): done"
