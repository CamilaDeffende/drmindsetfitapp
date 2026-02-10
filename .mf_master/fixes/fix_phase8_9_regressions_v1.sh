#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> FIX v1 | phase8/9 regressions (LevelSystem/getProgress, False, Wearables payload, HistoryService dup type, PredictionEngine dup helpers)"

python3 - <<'PY'
from pathlib import Path
import re

def write(p: Path, s: str):
  p.parent.mkdir(parents=True, exist_ok=True)
  p.write_text(s, encoding="utf-8")

# -------------------------------------------------------------------
# 1) PredictionEngine.ts: remover const helpers duplicados (arrow fns)
# -------------------------------------------------------------------
pe = Path("src/services/ml/PredictionEngine.ts")
if pe.exists():
  s = pe.read_text(encoding="utf-8")

  # remove "const caloriesKcal = (w: any): number => { ... }" (block)
  s, n1 = re.subn(
    r'(?s)^\s*const\s+caloriesKcal\s*=\s*\(\s*w\s*:\s*any\s*\)\s*:\s*number\s*=>\s*\{\s*.*?\n\}\s*;\s*\n+',
    '',
    s,
    count=1
  )

  # remove "const durationMin = (w: any): number => { ... }" (block)
  s, n2 = re.subn(
    r'(?s)^\s*const\s+durationMin\s*=\s*\(\s*w\s*:\s*any\s*\)\s*:\s*number\s*=>\s*\{\s*.*?\n\}\s*;\s*\n+',
    '',
    s,
    count=1
  )

  # sanity: se ainda houver duplicates, remove quaisquer consts restantes por nome
  s = re.sub(r'(?m)^\s*const\s+(durationMin|caloriesKcal)\s*=.*$', '', s)

  write(pe, s)
  print(f"OK: PredictionEngine dedup const helpers (removed blocks: caloriesKcal={n1}, durationMin={n2})")
else:
  print("SKIP: PredictionEngine.ts não existe")

# -------------------------------------------------------------------
# 2) WearablesPage.tsx: substituir bloco addWorkout por payload limpo
# -------------------------------------------------------------------
wp = Path("src/pages/wearables/WearablesPage.tsx")
if wp.exists():
  s = wp.read_text(encoding="utf-8")

  # bloco canonical: sem chaves duplicadas, com mapping type->WorkoutType
  canonical = r'''
      historyService.addWorkout({
        dateIso: workout.startTime,
        modality:
          workout.type === "running"
            ? "corrida"
            : workout.type === "cycling"
              ? "ciclismo"
              : workout.type === "strength"
                ? "musculacao"
                : "corrida",
        type:
          workout.type === "running"
            ? "corrida"
            : workout.type === "cycling"
              ? "ciclismo"
              : workout.type === "strength"
                ? "musculacao"
                : "corrida",
        title:
          workout.type === "running"
            ? "Treino Wearable — Corrida"
            : workout.type === "cycling"
              ? "Treino Wearable — Ciclismo"
              : workout.type === "strength"
                ? "Treino Wearable — Força"
                : "Treino Wearable — Atividade",
        durationMinutes:
          (workout as any).durationMinutes ??
          (workout as any).durationMin ??
          (typeof (workout as any).durationSec === "number"
            ? Math.round((workout as any).durationSec / 60)
            : undefined),
        distanceMeters: (workout as any).distanceMeters,
        caloriesBurned: (workout as any).caloriesBurned ?? (workout as any).caloriesKcal,
        averageHeartRate: (workout as any).averageHeartRate,
        maxHeartRate: (workout as any).maxHeartRate,
        gpsRoute: (workout as any).gpsRoute,
      });
'''.strip("\n")

  # substitui o primeiro historyService.addWorkout({ ... }); encontrado
  pat = re.compile(r'(?s)historyService\.addWorkout\(\{\s*.*?\}\);\s*', re.M)
  m = pat.search(s)
  if not m:
    raise SystemExit("❌ WearablesPage: não achei historyService.addWorkout({ ... }); para substituir.")
  s2 = s[:m.start()] + canonical + "\n" + s[m.end():]

  # corrige comparações antigas 'workout.type === "corrida"' se sobrar em outros pontos
  s2 = s2.replace('workout.type === "corrida"', 'workout.type === "running"')

  # corrige avgHeartRate -> averageHeartRate se sobrar
  s2 = re.sub(r'\bavgHeartRate\b', 'averageHeartRate', s2)

  write(wp, s2)
  print("OK: WearablesPage addWorkout payload normalized (no dup keys, mapped types, HR field ok)")
else:
  print("SKIP: WearablesPage.tsx não existe")

# -------------------------------------------------------------------
# 3) AchievementsService.ts: False -> false
# -------------------------------------------------------------------
asvc = Path("src/services/gamification/AchievementsService.ts")
if asvc.exists():
  s = asvc.read_text(encoding="utf-8")
  s2, n = re.subn(r'\bFalse\b', 'false', s)
  if n:
    write(asvc, s2)
    print(f"OK: AchievementsService False->false ({n})")
  else:
    print("OK: AchievementsService sem 'False'")
else:
  print("SKIP: AchievementsService.ts não existe")

# -------------------------------------------------------------------
# 4) LevelSystem.ts: garantir singleton levelSystem + getProgress()
# -------------------------------------------------------------------
ls = Path("src/services/gamification/LevelSystem.ts")
if ls.exists():
  s = ls.read_text(encoding="utf-8")

  # garante import achievementsService (para getProgress)
  if "achievementsService" not in s:
    lines = s.splitlines(True)
    ins_at = 0
    for i, ln in enumerate(lines):
      if ln.startswith("import "):
        ins_at = i + 1
    lines.insert(ins_at, 'import { achievementsService } from "@/services/gamification/AchievementsService";\n')
    s = "".join(lines)

  # garante getProgress() dentro da classe
  if "getProgress(" not in s:
    s = re.sub(
      r'(export\s+class\s+LevelSystem\s*\{\s*)',
      r'\1\n  getProgress() {\n    return LevelSystem.getLevelInfo(achievementsService.getTotalXp());\n  }\n\n',
      s,
      count=1
    )

  # garante singleton export
  if "export const levelSystem" not in s:
    s = s.rstrip() + "\n\nexport const levelSystem = new LevelSystem();\n"

  write(ls, s)
  print("OK: LevelSystem ensured (getProgress + levelSystem singleton)")
else:
  print("SKIP: LevelSystem.ts não existe")

# -------------------------------------------------------------------
# 5) HistoryService.ts: remover duplicação de 'type:' no seedDemo
# -------------------------------------------------------------------
hs = Path("src/services/history/HistoryService.ts")
if hs.exists():
  s = hs.read_text(encoding="utf-8").splitlines(True)

  # remove linhas duplicadas de type: isStrength ? ...
  out = []
  seen = False
  pat = re.compile(r'^\s*type:\s*isStrength\s*\?\s*"musculacao"\s*:\s*"corrida"\s*,\s*$')
  for ln in s:
    if pat.match(ln):
      if not seen:
        out.append(ln)
        seen = True
      else:
        # drop duplicates
        continue
    else:
      out.append(ln)

  write(hs, "".join(out))
  print("OK: HistoryService dedup type: (seedDemo)")
else:
  print("SKIP: HistoryService.ts não existe")

PY

echo "==> typecheck + verify"
npx tsc --noEmit
npm run -s verify

git add -A
git commit -m "fix: phase8/9 regressions (levelSystem/getProgress, wearables payload, history dup type, predictionEngine dedup, False)" || true

echo "✅ OK | BUILD VERDE + regressions fixed"
