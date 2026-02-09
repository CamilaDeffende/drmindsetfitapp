#!/usr/bin/env bash
set -euo pipefail
cd ~/Desktop/DrMindsetfitapp

echo "==> FIX Phase 9 v2 (force inject PredictionEngine defaults inside class)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/services/ml/PredictionEngine.ts")
s = p.read_text(encoding="utf-8")

# Só considera "existe" se os métodos existirem de fato como members da classe
has_dur = re.search(r'(?m)^\s*private\s+getDefaultDuration\s*\(', s) is not None
has_cal = re.search(r'(?m)^\s*private\s+getDefaultCalories\s*\(', s) is not None

if has_dur and has_cal:
  print("OK: métodos já existem como private members (nada a fazer)")
else:
  inject = "\n" + r'''
  private getDefaultDuration(type: any): number {
    switch (type) {
      case "corrida":
        return 40;
      case "ciclismo":
        return 50;
      case "musculacao":
        return 55;
      default:
        return 45;
    }
  }

  private getDefaultCalories(type: any): number {
    switch (type) {
      case "corrida":
        return 380;
      case "ciclismo":
        return 420;
      case "musculacao":
        return 360;
      default:
        return 350;
    }
  }
'''.rstrip() + "\n\n"

  # Insere logo após "export class PredictionEngine {"
  pat = r'(export\s+class\s+PredictionEngine\s*\{\s*\n)'
  if not re.search(pat, s):
    # fallback: class com "{" na mesma linha
    pat = r'(export\s+class\s+PredictionEngine\s*\{\s*)'
    m = re.search(pat, s)
    if not m:
      raise SystemExit("❌ Não achei 'export class PredictionEngine {' para injetar defaults.")
    s2 = s[:m.end()] + inject + s[m.end():]
  else:
    s2 = re.sub(pat, r'\1' + inject, s, count=1)

  p.write_text(s2, encoding="utf-8")
  print("OK: defaults injetados dentro da classe PredictionEngine (forçado)")

PY

echo "==> typecheck + verify"
npx tsc --noEmit
npm run -s verify

git add src/services/ml/PredictionEngine.ts
git commit -m "fix: phase 9 PredictionEngine defaults injected inside class (ts strict)" || true

echo "✅ OK | Phase 9 v2 fixed (green)"