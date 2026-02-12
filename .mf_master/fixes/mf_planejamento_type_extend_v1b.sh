#!/usr/bin/env bash
set -euo pipefail

FILE="src/types/index.ts"
test -f "$FILE" || { echo "❌ Arquivo não encontrado: $FILE"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
mkdir -p .backups
cp "$FILE" ".backups/index.ts.before_planejamento_extend_${TS}.bak"
echo "✅ backup: .backups/index.ts.before_planejamento_extend_${TS}.bak"

python3 - <<'PY'
import re
from pathlib import Path

file = Path("src/types/index.ts")
s = file.read_text(encoding="utf-8")
orig = s

MARK = "// MF_PLANEJAMENTO_NUTRICIONAL_EXT_V1"

m = re.search(r"(?s)(export\s+interface\s+PlanejamentoNutricional\s*\{)(.*?)(\n\})", s)
if not m:
    raise SystemExit("❌ Não encontrei 'export interface PlanejamentoNutricional {' em src/types/index.ts")

head, body, tail = m.group(1), m.group(2), m.group(3)

if "percentualEstrategia" not in body:
    body = body.rstrip() + "\n  " + MARK + "\n  percentualEstrategia?: number;\n  kcalAlvo?: number;\n"

s2 = s[:m.start()] + head + body + tail + s[m.end():]
s2 = re.sub(r"\n{3,}", "\n\n", s2)

if s2 == orig:
    print("ℹ️ Nenhuma mudança (já tinha os campos).")
else:
    file.write_text(s2, encoding="utf-8")
    print("✅ Tipo PlanejamentoNutricional estendido:", str(file))
PY

echo
echo "==> verify (BUILD VERDE)"
npm run -s verify

echo
echo "==> commit"
git add -A
git commit -m "types(nutrition): extend PlanejamentoNutricional with percentualEstrategia/kcalAlvo" || echo "ℹ️ nada para commitar"
git status -sb
