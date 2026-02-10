#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> fix_predictionengine_nullish_v1 (remove literal ?? RHS que dispara eslint)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/services/ml/PredictionEngine.ts")
s = p.read_text(encoding="utf-8")

# Remove apenas "LITERAL ?? <algo>" (LHS constante) porque isso é redundante e dispara no-constant-binary-expression.
# Literais suportados: null, undefined, true, false, números, strings "..." ou '...'
lit = r'(?:null|undefined|true|false|\\d+(?:\\.\\d+)?|"(?:[^"\\\\\\\\]|\\\\\\\\.)*"|\\'(?:[^\\'\\\\\\\\]|\\\\\\\\.)*\\')'

# Remove o RHS até encontrar delimitador comum
pat = re.compile(rf'(?P<L>{lit})\\s*\\?\\?\\s*(?P<R>[^,\\);\\]\\}}:\\n]+)', re.M)

changed = 0
while True:
  s2, n = pat.subn(lambda m: m.group("L"), s)
  changed += n
  s = s2
  if n == 0:
    break

p.write_text(s, encoding="utf-8")
print(f"OK: removed {changed} literal-?? occurrences")
PY

echo "==> verify"
npm run -s verify

git add src/services/ml/PredictionEngine.ts
git commit -m "fix: remove constant-lhs ?? in PredictionEngine (eslint no-constant-binary)" || true

echo "✅ OK | BUILD VERDE"
