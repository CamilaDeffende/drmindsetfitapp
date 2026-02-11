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

# 1) Remove <OfflineIndicator /> de dentro de <Routes>...</Routes>
def strip_inside_routes(m: re.Match) -> str:
    open_tag, body, close_tag = m.group(1), m.group(2), m.group(3)
    body2 = re.sub(r"\s*<OfflineIndicator\s*/>\s*", "\n", body)
    return open_tag + body2 + close_tag

s2 = re.sub(r"(?s)(<Routes[^>]*>)(.*?)(</Routes>)", strip_inside_routes, s)

# 2) Garantir 1 ocorrência FORA do Routes (antes do primeiro <Routes ...>)
# Heurística: se já existe OfflineIndicator em qualquer lugar fora, não duplica.
# Vamos inserir antes do primeiro <Routes se não houver nenhuma ocorrência no arquivo.
if "OfflineIndicator" not in s2:
    raise SystemExit("❌ Sanity: símbolo OfflineIndicator não aparece no App.tsx (import/uso ausente).")

# Se NÃO existe um "<OfflineIndicator />" fora, injeta antes do primeiro <Routes
before_routes, sep, after = s2.partition("<Routes")
if sep:
    if "<OfflineIndicator" not in before_routes:
        # remove qualquer resto de OfflineIndicator no after (já removemos dentro do Routes, mas por segurança)
        after2 = after
        s2 = before_routes.rstrip() + "\n  <OfflineIndicator />\n\n<Routes" + after2
else:
    # não achou <Routes, não mexe
    pass

# 3) Sanity: não pode sobrar OfflineIndicator dentro do bloco Routes
m = re.search(r"(?s)<Routes[^>]*>(.*?)</Routes>", s2)
if m and "OfflineIndicator" in m.group(1):
    raise SystemExit("❌ Sanity: OfflineIndicator ainda está dentro de <Routes>.")

p.write_text(s2, encoding="utf-8")
print("✅ patched:", p)
PY

echo "==> preview (OfflineIndicator/Routes)"
rg -n "OfflineIndicator|<Routes" -n "$F" | head -n 160 || true

echo
echo "==> VERIFY (BUILD VERDE)"
npm run -s verify

echo
echo "============================================================"
echo "✅ OK | OfflineIndicator fora do <Routes> | app volta a renderizar"
echo "============================================================"
