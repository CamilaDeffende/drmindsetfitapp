#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1

F="src/App.tsx"
test -f "$F" || { echo "❌ faltando: $F"; exit 2; }

python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/App.tsx")
s = p.read_text(encoding="utf-8")

if "<Routes" not in s:
    raise SystemExit("❌ Não achei <Routes em src/App.tsx")

# 1) Remove qualquer <LiveLocationPill .../> que esteja DENTRO de <Routes>...</Routes>
def strip_inside_routes(text: str) -> str:
    m = re.search(r"(?s)(<Routes[^>]*>)(.*?)(</Routes>)", text)
    if not m:
        return text
    head, body, tail = m.group(1), m.group(2), m.group(3)

    # remove linhas com o componente (autocontido) e versões com props
    body2 = re.sub(r"(?m)^[^\S\r\n]*<LiveLocationPill\b[^>]*/>\s*$\n?", "", body)

    return text[:m.start()] + head + body2 + tail + text[m.end():]

s2 = strip_inside_routes(s)

# 2) Garante que exista 1 <LiveLocationPill /> FORA de <Routes> (antes do <Routes>)
# (não duplica se já existir fora)
routes_pos = s2.find("<Routes")
before = s2[:routes_pos]
after = s2[routes_pos:]

has_outside = "<LiveLocationPill" in before
if not has_outside:
    insert = "\n  <LiveLocationPill />\n"
    # tenta inserir junto do OfflineIndicator se existir
    if "<OfflineIndicator" in before and "</" not in insert:
        pass
    s2 = before.rstrip() + insert + "\n" + after

# 3) Sanity: LiveLocationPill NÃO pode sobrar dentro do Routes
m = re.search(r"(?s)<Routes[^>]*>(.*?)</Routes>", s2)
if m and "LiveLocationPill" in m.group(1):
    raise SystemExit("❌ Sanity: LiveLocationPill ainda está dentro de <Routes>.")

p.write_text(s2, encoding="utf-8")
print("✅ patched:", p)
PY

echo "==> preview (LiveLocationPill/Routes)"
rg -n "LiveLocationPill|<Routes" -n "$F" | head -n 180 || true
