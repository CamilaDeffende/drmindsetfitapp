#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> FIX Phase 9 (App import + PredictionEngine defaults)"

# -------------------------------------------------------------------
# 1) App.tsx: corrigir import de AIDashboardPage para default
# -------------------------------------------------------------------
python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/App.tsx")
s = p.read_text(encoding="utf-8")

# troca named import -> default import
s2, n = re.subn(
  r'(?m)^\s*import\s*\{\s*AIDashboardPage\s*\}\s*from\s*["\']@/pages/ai-dashboard/AIDashboardPage["\']\s*;?\s*$',
  'import AIDashboardPage from "@/pages/ai-dashboard/AIDashboardPage";',
  s
)

# se não achou, tenta variação com aspas duplas/sem @
if n == 0:
  s2, n = re.subn(
    r'(?m)^\s*import\s*\{\s*AIDashboardPage\s*\}\s*from\s*["\'].*?/ai-dashboard/AIDashboardPage["\']\s*;?\s*$',
    'import AIDashboardPage from "@/pages/ai-dashboard/AIDashboardPage";',
    s
  )

if n == 0:
  raise SystemExit("❌ Não encontrei o import nomeado de AIDashboardPage em src/App.tsx para corrigir.")

p.write_text(s2, encoding="utf-8")
print("OK: App.tsx import AIDashboardPage -> default")
PY

# -------------------------------------------------------------------
# 2) PredictionEngine.ts: adicionar métodos defaults faltantes
# -------------------------------------------------------------------
python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/services/ml/PredictionEngine.ts")
s = p.read_text(encoding="utf-8")

# se já existir, não duplica
if "getDefaultDuration(" in s and "getDefaultCalories(" in s:
  print("OK: defaults já existem no PredictionEngine")
  raise SystemExit(0)

# injeta antes do último '}' da classe (antes do export const)
# achar "export class PredictionEngine" e inserir perto do final
# estratégia: inserir antes da linha "}" que fecha a classe, procurando por "}\n\nexport const predictionEngine"
m = re.search(r'(?s)(export class PredictionEngine\s*\{.*?)(\n\}\n\nexport const predictionEngine\b)', s)
if not m:
  raise SystemExit("❌ Não consegui localizar o fim da classe PredictionEngine para injetar defaults.")

body = m.group(1)
tail = m.group(2)

inject = r'''
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
'''.rstrip() + "\n"

# insere no fim do corpo da classe (antes do fechamento)
s2 = body.rstrip() + "\n\n" + inject + tail
p.write_text(s2, encoding="utf-8")
print("OK: PredictionEngine defaults adicionados")
PY

echo "==> typecheck + verify"
npx tsc --noEmit
npm run -s verify

git add src/App.tsx src/services/ml/PredictionEngine.ts
git commit -m "fix: phase 9 App import + PredictionEngine default fallbacks" || true

echo "✅ OK | Phase 9 fixed (green)"