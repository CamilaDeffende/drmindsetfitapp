#!/usr/bin/env bash
set -euo pipefail

F="src/components/steps/Step4Nutricao.tsx"
test -f "$F" || { echo "❌ Arquivo não encontrado: $F"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
mkdir -p .backups
cp "$F" ".backups/Step4Nutricao_before_remove_unused_clamp_${TS}.tsx"
echo "✅ backup: .backups/Step4Nutricao_before_remove_unused_clamp_${TS}.tsx"

python3 - <<'PY'
import re
from pathlib import Path

p = Path("src/components/steps/Step4Nutricao.tsx")
s = p.read_text(encoding="utf-8")
orig = s

# Remove APENAS a linha do mfClamp antigo (const mfClamp = (...) => ...;)
# e também remove possíveis linhas em branco extras geradas.
s2 = re.sub(
    r'(?m)^\s*const\s+mfClamp\s*=\s*\(.*?\)\s*=>\s*.*?;\s*\n',
    '',
    s,
    count=1
)

s2 = re.sub(r"\n{3,}", "\n\n", s2)

if s2 == orig:
    print("ℹ️ Nenhuma remoção aplicada (mfClamp não encontrado).")
else:
    p.write_text(s2, encoding="utf-8")
    print("✅ Removi mfClamp não utilizado:", str(p))
PY

echo
echo "==> verify (BUILD VERDE)"
npm run -s verify

echo
echo "==> commit"
git add -A
git commit -m "chore(step4): remove unused mfClamp (keep SSOT helper)" || echo "ℹ️ nada para commitar"
git status -sb
