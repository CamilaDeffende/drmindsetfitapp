#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

F="src/services/ml/PredictionEngine.ts"
[[ -f "$F" ]] || { echo "❌ não achei: $F"; exit 2; }

echo "==> patch PredictionEngine helpers (lint-safe, remove ?? chain w/ 0)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/services/ml/PredictionEngine.ts")
s = p.read_text(encoding="utf-8")

new_duration = r'''
function durationMin(w: any): number {
  let v: any = w?.durationMinutes;
  if (typeof v !== "number") v = w?.durationMin;
  if (typeof v !== "number" && typeof w?.durationSec === "number") v = Math.round(w.durationSec / 60);
  if (typeof v !== "number") v = 0;
  return v;
}
'''.strip() + "\n"

new_calories = r'''
function caloriesKcal(w: any): number {
  let v: any = w?.caloriesBurned;
  if (typeof v !== "number") v = w?.caloriesKcal;
  if (typeof v !== "number") v = 0;
  return v;
}
'''.strip() + "\n"

# substitui a função inteira durationMin
s2, n1 = re.subn(
  r'(?s)function\s+durationMin\s*\(\s*w\s*:\s*any\s*\)\s*:\s*number\s*\{\s*.*?\n\}\s*\n',
  new_duration + "\n",
  s,
  count=1
)
if n1 == 0:
  raise SystemExit("❌ Não consegui localizar a função durationMin(...) para substituir.")

# substitui a função inteira caloriesKcal
s3, n2 = re.subn(
  r'(?s)function\s+caloriesKcal\s*\(\s*w\s*:\s*any\s*\)\s*:\s*number\s*\{\s*.*?\n\}\s*\n',
  new_calories + "\n",
  s2,
  count=1
)
if n2 == 0:
  raise SystemExit("❌ Não consegui localizar a função caloriesKcal(...) para substituir.")

p.write_text(s3, encoding="utf-8")
print(f"OK: substituted durationMin({n1}) + caloriesKcal({n2})")
PY

echo "==> verify"
npm run -s verify

git add "$F"
git commit -m "fix: PredictionEngine helpers lint-safe (remove redundant ?? chains)" || true

echo "✅ OK | BUILD VERDE"
