#!/usr/bin/env bash
set -euo pipefail

echo "==> localizar PlanejamentoNutricional"
HITS="$(rg -n "type\s+PlanejamentoNutricional|interface\s+PlanejamentoNutricional" src | head -n 10 || true)"
echo "$HITS"
test -n "$HITS" || { echo "❌ Não encontrei PlanejamentoNutricional em src/"; exit 1; }

FILE="$(echo "$HITS" | head -n 1 | cut -d: -f1)"
echo "==> alvo: $FILE"

TS="$(date +%Y%m%d_%H%M%S)"
mkdir -p .backups
cp "$FILE" ".backups/$(basename "$FILE").before_planejamento_extend_${TS}.bak"
echo "✅ backup: .backups/$(basename "$FILE").before_planejamento_extend_${TS}.bak"

python3 - <<'PY'
import re
from pathlib import Path
import sys

# lê o arquivo alvo detectado pelo shell
file = Path(open("/dev/stdin").read().strip())
if not file.exists():
    raise SystemExit(f"❌ arquivo não existe: {file}")

s = file.read_text(encoding="utf-8")
orig = s

MARK = "// MF_PLANEJAMENTO_NUTRICIONAL_EXT_V1"
if MARK not in s:
    # 1) interface
    m = re.search(r"(?s)(interface\s+PlanejamentoNutricional\s*\{)(.*?)(\n\})", s)
    if m:
        head, body, tail = m.group(1), m.group(2), m.group(3)
        if "percentualEstrategia" not in body:
            body = body.rstrip() + "\n  " + MARK + "\n  percentualEstrategia?: number;\n  kcalAlvo?: number;\n"
        s = s[:m.start()] + head + body + tail + s[m.end():]
    else:
        # 2) type alias
        m = re.search(r"(?s)(type\s+PlanejamentoNutricional\s*=\s*\{)(.*?)(\n\}\s*;?)", s)
        if not m:
            raise SystemExit("❌ Não consegui localizar o bloco do tipo/interface PlanejamentoNutricional para editar.")
        head, body, tail = m.group(1), m.group(2), m.group(3)
        if "percentualEstrategia" not in body:
            body = body.rstrip() + "\n  " + MARK + "\n  percentualEstrategia?: number;\n  kcalAlvo?: number;\n"
        s = s[:m.start()] + head + body + tail + s[m.end():]

s = re.sub(r"\n{3,}", "\n\n", s)

if s == orig:
    print("ℹ️ Nenhuma mudança (já tinha os campos ou marker).")
else:
    file.write_text(s, encoding="utf-8")
    print("✅ Tipo PlanejamentoNutricional estendido:", str(file))
PY <<<"$FILE"

echo
echo "==> verify (BUILD VERDE)"
npm run -s verify

echo
echo "==> commit"
git add -A
git commit -m "types(nutrition): extend PlanejamentoNutricional with percentualEstrategia/kcalAlvo" || echo "ℹ️ nada para commitar"
git status -sb
