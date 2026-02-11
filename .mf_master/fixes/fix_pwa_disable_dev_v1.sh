#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1
F="vite.config.ts"
test -f "$F" || { echo "❌ faltando: $F"; exit 2; }

python3 - <<'PY'
from pathlib import Path
import re

p = Path("vite.config.ts")
s = p.read_text(encoding="utf-8")

if "VitePWA(" not in s:
    raise SystemExit("❌ Sanity: VitePWA( não encontrado em vite.config.ts")

def repl_devoptions(m):
    block = m.group(0)
    block = re.sub(r"enabled\s*:\s*(true|false)", "enabled: false", block)
    if not re.search(r"enabled\s*:", block):
        block = re.sub(r"\{\s*", "{ enabled: false, ", block, count=1)
    return block

s2 = re.sub(r"devOptions\s*:\s*\{[\s\S]*?\}", repl_devoptions, s)

if "devOptions:" not in s2:
    s2 = re.sub(
        r"(registerType\s*:\s*['\"][^'\"]+['\"]\s*,)",
        r"\1\n      devOptions: { enabled: false },",
        s2,
        count=1
    )

if "devOptions" not in s2:
    raise SystemExit("❌ Sanity: não consegui inserir devOptions no VitePWA config")
if not re.search(r"devOptions\s*:\s*\{[^}]*enabled\s*:\s*false", s2):
    raise SystemExit("❌ Sanity: devOptions.enabled não ficou false")

p.write_text(s2, encoding="utf-8")
print("✅ patched:", p)
PY

echo "==> preview devOptions"
rg -n "VitePWA\\(|devOptions" -n vite.config.ts | head -n 60 || true
