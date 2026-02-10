#!/usr/bin/env bash
set -euo pipefail
cd ~/Desktop/DrMindsetfitapp

echo "==> fix_phase8_9_contracts_v1 (PredictionEngine exports + LevelInfo xp fields)"

python3 - <<'PY'
from pathlib import Path
import re

# -----------------------------------------------------------------------------
# A) PredictionEngine: garantir exports (WorkoutPrediction/WeightPrediction) + getAllWorkouts + typings
# -----------------------------------------------------------------------------
pe = Path("src/services/ml/PredictionEngine.ts")
if not pe.exists():
  raise SystemExit("❌ src/services/ml/PredictionEngine.ts não existe.")

s = pe.read_text(encoding="utf-8")

# 1) Remover import de WorkoutRecord se não for usado (TS6133)
s = re.sub(
  r'(?m)^\s*import\s*\{\s*historyService\s*,\s*WorkoutRecord\s*,\s*WorkoutType\s*\}\s*from\s*"@/services/history/HistoryService";\s*$',
  'import { historyService, WorkoutType } from "@/services/history/HistoryService";',
  s
)

# 2) Garantir que WorkoutType está importado (fallback se import diferente)
if 'from "@/services/history/HistoryService"' in s and "WorkoutType" not in s.split('from "@/services/history/HistoryService"')[0]:
  # não mexe se não achar a linha exata; apenas tenta um replace simples do import existente
  s = re.sub(
    r'(?m)^\s*import\s*\{\s*historyService\s*\}\s*from\s*"@/services/history/HistoryService";\s*$',
    'import { historyService, WorkoutType } from "@/services/history/HistoryService";',
    s
  )

# 3) Injetar tipos exportados se faltarem (para useAI)
types_block = r'''
export type WorkoutPrediction = {
  type: WorkoutType;
  avgDurationMin: number;
  avgCaloriesKcal: number;
  suggestedDistanceKm?: number;
  confidence01: number; // 0..1
  bestHour?: number; // 0..23
};

export type WeightPrediction = {
  trendKgPerWeek: number;
  predictedKg30d: number;
  r2: number; // 0..1
  bestWeighInHour?: number; // 0..23
  points: { dateIso: string; weightKg: number }[];
};
'''.lstrip()

if "export type WorkoutPrediction" not in s:
  # inserir após imports
  lines = s.splitlines(True)
  ins = 0
  for i, ln in enumerate(lines):
    if ln.startswith("import "):
      ins = i + 1
  lines.insert(ins, "\n" + types_block + "\n")
  s = "".join(lines)

# 4) Garantir getAllWorkouts() e usar historyService de forma SSOT-safe
if "function getAllWorkouts" not in s:
  helper = r'''
function getAllWorkouts(): any[] {
  const hs: any = historyService as any;
  const ws = hs.getWorkouts ? hs.getWorkouts() : (hs.workouts ?? hs.records?.workouts ?? []);
  return Array.isArray(ws) ? ws : [];
}

function safeDateIso(x: any): string {
  const v = x?.dateIso ?? x?.date ?? x?.startTime;
  return typeof v === "string" ? v : new Date().toISOString();
}
'''.lstrip()

  # inserir perto dos helpers (antes de export class PredictionEngine)
  m = re.search(r'(?m)^\s*export\s+class\s+PredictionEngine\b', s)
  if not m:
    raise SystemExit("❌ Não achei 'export class PredictionEngine' para inserir helpers.")
  s = s[:m.start()] + helper + "\n" + s[m.start():]

# 5) Corrigir assinaturas e implicit any dentro do arquivo (reduce/map/sort)
#    (somente nos padrões que estão acusando)
s = re.sub(r'hist\.reduce\(\(s,\s*w\)\s*=>', 'hist.reduce((s: number, w: any) =>', s)
s = re.sub(r'\.filter\(\(x\)\s*:\s*x\s+is\s+number', '.filter((x: unknown): x is number', s)
s = re.sub(r'\.sort\(\(a,\s*b\)\s*=>', '.sort((a: number, b: number) =>', s)

# 6) Se predictWorkout/predictWeight referenciam tipos não resolvidos, padronizar assinaturas
s = re.sub(
  r'(?m)^\s*predictWorkout\([^\)]*\)\s*:\s*WorkoutPrediction\s*\{',
  '  predictWorkout(type: WorkoutType, targetDistanceKm?: number): WorkoutPrediction {',
  s
)
s = re.sub(
  r'(?m)^\s*predictWeight\([^\)]*\)\s*:\s*WeightPrediction\s*\{',
  '  predictWeight(): WeightPrediction {',
  s
)

pe.write_text(s, encoding="utf-8")
print("✅ OK: PredictionEngine exports/tipos/helpers restaurados (useAI compat)")

# -----------------------------------------------------------------------------
# B) LevelSystem: garantir LevelInfo com xp/nextLevelXp e return preenchido (AchievementsPage compat)
# -----------------------------------------------------------------------------
ls = Path("src/services/gamification/LevelSystem.ts")
if ls.exists():
  t = ls.read_text(encoding="utf-8")

  # 1) Garantir LevelInfo inclui xp e nextLevelXp
  if "export type LevelInfo" in t and ("xp:" not in t or "nextLevelXp" not in t):
    # injeta campos antes do fechamento do type
    t2, n = re.subn(
      r'(?s)(export\s+type\s+LevelInfo\s*=\s*\{.*?)(\n\};)',
      r'\1\n  xp: number; // alias: total XP\n  nextLevelXp: number; // alias: XP do próximo level\2',
      t,
      count=1
    )
    if n:
      t = t2

  # 2) Garantir retorno do getLevelInfo inclui xp e nextLevelXp (procura bloco return { ... })
  if "getLevelInfo" in t and ("nextLevelXp:" not in t or "xp:" not in t):
    # tenta injetar após progress01:
    t2, n = re.subn(
      r'(?s)(progress01:\s*prog,\s*\n)',
      r'\1      xp: xp,\n      nextLevelXp: next.xp,\n',
      t,
      count=1
    )
    if n:
      t = t2

  ls.write_text(t, encoding="utf-8")
  print("✅ OK: LevelSystem LevelInfo xp/nextLevelXp garantidos")
else:
  print("ℹ️ SKIP: LevelSystem.ts não encontrado (não alterado)")

PY

echo "==> typecheck + verify"
npx tsc --noEmit
npm run -s verify

git add src/services/ml/PredictionEngine.ts src/services/gamification/LevelSystem.ts 2>/dev/null || true
git commit -m "fix: restore Phase8/9 contracts (PredictionEngine exports + LevelInfo xp fields)" || true

echo "✅ OK | BUILD VERDE"
