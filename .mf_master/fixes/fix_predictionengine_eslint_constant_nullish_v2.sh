#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

F="src/services/ml/PredictionEngine.ts"
[[ -f "$F" ]] || { echo "❌ não achei $F"; exit 2; }

echo "==> patch $F (remove 'LITERAL ?? RHS' apenas nas linhas 50 e 57)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/services/ml/PredictionEngine.ts")
lines = p.read_text(encoding="utf-8").splitlines(True)

targets = [50, 57]  # linhas do eslint (1-based)
changed = 0

# Remove " ?? <rhs>" antes de ';' quando LHS é literal constante
# Ex: "0 ?? foo;" -> "0;"
# Ex: "null ?? foo();" -> "null;"
pat = re.compile(r'(?P<lhs>\b(?:null|undefined|true|false)\b|\b\d+(?:\.\d+)?\b|"(?:[^"\\]|\\.)*"|\'(?:[^\'\\]|\\.)*\')\s*\?\?\s*(?P<rhs>[^;]+)(?P<semi>;)', re.M)

for lnno in targets:
  idx = lnno - 1
  if 0 <= idx < len(lines):
    s = lines[idx]
    s2, n = pat.subn(lambda m: f"{m.group('lhs')}{m.group('semi')}", s)
    if n:
      lines[idx] = s2
      changed += n

p.write_text("".join(lines), encoding="utf-8")
print(f"OK: patched occurrences={changed} (only lines {targets})")
PY

echo "==> verify"
npm run -s verify

git add "$F"
git commit -m "fix: PredictionEngine remove constant-lhs ?? (eslint no-constant-binary)" || true

echo "✅ OK | BUILD VERDE"
