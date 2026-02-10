#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1

F="src/hooks/useOffline/useOffline.ts"
test -f "$F" || { echo "❌ faltando: $F"; exit 2; }

python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/hooks/useOffline/useOffline.ts")
s = p.read_text(encoding="utf-8")

# Remove completamente o bloco "best effort: background sync (se suportado)" e qualquer if SyncManager quebrado
s2 = re.sub(
    r'(?s)\n\s*//\s*best effort: background sync \(se suportado\)\s*\n\s*if\s*\(\s*"serviceWorker"\s+in\s+navigator\s*&&\s*"SyncManager"\s+in\s+window\s*\)\s*\{\s*[\s\S]*?\}\s*',
    "\n",
    s
)

# Sanity: não pode sobrar o comentário
s2 = re.sub(r'(?m)^\s*//\s*best effort: background sync \(se suportado\)\s*$', '', s2)

# Sanity: garante que o return cleanup está indentado minimamente (não muda lógica)
s2 = re.sub(r'(?m)^\s*return\s*\(\)\s*=>\s*\{', '    return () => {', s2)

p.write_text(s2, encoding="utf-8")
print("✅ fix applied:", p)
PY

echo "==> preview (useOffline.ts)"; sed -n '1,220p' "$F"
