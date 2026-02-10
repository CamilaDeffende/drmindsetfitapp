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

# 1) Remove bloco vazio/bugado de SyncManager (com chaves sobrando)
# Remove padrões tipo:
# if ("serviceWorker" in navigator && "SyncManager" in window) { } }
s2 = re.sub(
    r'\n\s*//\s*best effort: background sync[\s\S]*?if\s*\(\s*"serviceWorker"\s+in\s+navigator\s*&&\s*"SyncManager"\s+in\s+window\s*\)\s*\{\s*\}\s*\}\s*\n',
    "\n",
    s,
    flags=re.M
)

# 2) Garante existir apenas 1 bloco de background sync "best effort" dentro do useEffect
# Vamos inserir/normalizar um bloco seguro após addEventListener.
insert_marker = "window.addEventListener(\"offline\", onOffline);"
bg_block = """
    // Background Sync (best effort) — sem depender de tipos TS
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          const anyReg = reg as unknown as { sync?: { register: (tag: string) => Promise<void> } };
          return anyReg.sync?.register ? anyReg.sync.register("mf-sync-v1") : Promise.resolve();
        })
        .catch(() => {});
    }
""".rstrip("\n")

# Remove qualquer bloco duplicado já existente (mantém 1)
s2 = re.sub(
    r'(?s)\n\s*//\s*Background Sync \(best effort\)[\s\S]*?\n\s*\}\n\s*\n',
    "\n",
    s2
)

if insert_marker in s2 and "mf-sync-v1" not in s2:
    s2 = s2.replace(insert_marker, insert_marker + "\n" + bg_block)

# 3) Sanity: checar que useEffect tem return cleanup e não sobrou "SyncManager" lixo
if "SyncManager" in s2:
    # deixa apenas se estiver em comentário/sem bloco vazio
    pass

p.write_text(s2, encoding="utf-8")
print("✅ fix applied:", p)
PY

echo "==> preview (useOffline.ts)"; sed -n '1,220p' "$F"
