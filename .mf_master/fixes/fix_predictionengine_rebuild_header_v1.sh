#!/usr/bin/env bash
set -euo pipefail
cd ~/Desktop/DrMindsetfitapp

echo "==> fix_predictionengine_rebuild_header_v1 (rebuild header between imports and class)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/services/ml/PredictionEngine.ts")
if not p.exists():
  raise SystemExit("❌ PredictionEngine.ts não existe.")

s = p.read_text(encoding="utf-8")

m = re.search(r'(?m)^\s*export\s+class\s+PredictionEngine\b', s)
if not m:
  raise SystemExit("❌ Não achei 'export class PredictionEngine' no arquivo.")

head = s[:m.start()]
tail = s[m.start():]

# mantém somente imports no head
lines = head.splitlines(True)
imports = []
i = 0
while i < len(lines) and (lines[i].lstrip().startswith("import ") or lines[i].strip() == ""):
  if lines[i].lstrip().startswith("import "):
    imports.append(lines[i])
  i += 1

imports_block = "".join(imports).rstrip() + "\n\n"

helpers = r'''
// -----------------------------------------------------------------------------
// Helpers (lint-safe) — normalize history/workout shapes (SSOT compatible)
// -----------------------------------------------------------------------------
function durationMin(w: any): number {
  if (!w) return 0;
  const a = (w as any).durationMinutes;
  if (typeof a === "number") return a;
  const b = (w as any).durationMin;
  if (typeof b === "number") return b;
  const c = (w as any).durationSec;
  if (typeof c === "number") return Math.round(c / 60);
  return 0;
}

function caloriesKcal(w: any): number {
  if (!w) return 0;
  const a = (w as any).caloriesBurned;
  if (typeof a === "number") return a;
  const b = (w as any).caloriesKcal;
  if (typeof b === "number") return b;
  return 0;
}

function distanceKm(w: any): number | undefined {
  if (!w) return undefined;
  const km = (w as any).distanceKm;
  if (typeof km === "number") return km;
  const m = (w as any).distanceMeters;
  if (typeof m === "number") return m / 1000;
  return undefined;
}

function safeDateIso(x: any): string {
  const v = x?.dateIso ?? x?.date ?? x?.startTime;
  return typeof v === "string" ? v : new Date().toISOString();
}

'''.lstrip()

# remove qualquer helper duplicado (se existirem dentro do tail antes da classe por algum motivo)
# (a classe começa em tail, então ok)

out = imports_block + helpers + tail
p.write_text(out, encoding="utf-8")
print("✅ OK: PredictionEngine header reconstruído (imports preservados, helpers limpos)")
PY

echo "==> typecheck + verify"
npx tsc --noEmit
npm run -s verify

git add src/services/ml/PredictionEngine.ts
git commit -m "fix: PredictionEngine rebuild header (lint-safe helpers, fix parse error)" || true

echo "✅ OK | BUILD VERDE"
