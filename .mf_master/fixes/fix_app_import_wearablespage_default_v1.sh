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

# Troca import nomeado -> default
s2 = re.sub(
    r'(?m)^\s*import\s*\{\s*WearablesPage\s*\}\s*from\s*[\'"]@/pages/wearables/WearablesPage[\'"]\s*;\s*$',
    'import WearablesPage from "@/pages/wearables/WearablesPage";',
    s
)

if s2 == s:
    # fallback: se estiver com caminho ligeiramente diferente
    s2 = re.sub(
        r'(?m)^\s*import\s*\{\s*WearablesPage\s*\}\s*from\s*[\'"][^\'"]*WearablesPage[\'"]\s*;\s*$',
        'import WearablesPage from "@/pages/wearables/WearablesPage";',
        s2
    )

p.write_text(s2, encoding="utf-8")
print("✅ fix applied:", p)
PY

echo "==> preview import (grep)"; rg -n "WearablesPage" -S "$F" || true
