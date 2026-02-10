#!/usr/bin/env bash
set -euo pipefail
cd ~/Desktop/DrMindsetfitapp

echo "==> fix_phase8_9_types_and_dupes_v1 (types align + remove dupes + LevelInfo return)"

python3 - <<'PY'
from pathlib import Path
import re

# ---------------------------------------------------------------------
# A) PredictionEngine.ts: alinhar tipos com o que o código retorna/consome
#    + remover duplicatas de safeDateIso (e remover função se ficar unused)
# ---------------------------------------------------------------------
pe = Path("src/services/ml/PredictionEngine.ts")
if not pe.exists():
  raise SystemExit("❌ PredictionEngine.ts não encontrado")

s = pe.read_text(encoding="utf-8")

# 1) Remover TODAS as funções safeDateIso duplicadas (não precisamos delas)
#    (remove blocos "function safeDateIso(...) { ... }")
s2, n_safe = re.subn(
  r'(?s)\n?function\s+safeDateIso\s*\(\s*x\s*:\s*any\s*\)\s*:\s*string\s*\{\s*.*?\n\}\s*\n',
  "\n",
  s
)
s = s2

# 2) Atualizar bloco de tipos exportados para refletir o uso real:
#    - WorkoutPrediction: suggestedDurationMin / suggestedCaloriesKcal / suggestedDistanceKm / confidence01 / bestHour
#    - WeightPrediction: slopeKgPerDay / r2 / projectedKg7d / projectedKg30d / predictedKg30d (alias compat) / points opcional
types_block = r'''
export type WorkoutPrediction = {
  type: WorkoutType;
  suggestedDurationMin: number;
  suggestedCaloriesKcal: number;
  suggestedDistanceKm?: number;
  confidence01: number; // 0..1
  bestHour?: number; // 0..23
};

export type WeightPrediction = {
  slopeKgPerDay: number;
  r2: number; // 0..1
  projectedKg7d?: number;
  projectedKg30d?: number;
  predictedKg30d?: number; // alias compat
  bestWeighInHour?: number; // 0..23
  points?: { dateIso: string; weightKg: number }[];
};
'''.lstrip()

# substitui se já existir, senão injeta após imports
if "export type WorkoutPrediction" in s and "export type WeightPrediction" in s:
  s, n_types = re.subn(
    r'(?s)export\s+type\s+WorkoutPrediction\s*=\s*\{.*?\};\s*\n\s*export\s+type\s+WeightPrediction\s*=\s*\{.*?\};\s*\n',
    types_block + "\n",
    s,
    count=1
  )
  if n_types == 0:
    # fallback: substitui cada um separadamente
    s = re.sub(r'(?s)export\s+type\s+WorkoutPrediction\s*=\s*\{.*?\};\s*\n', '', s, count=1)
    s = re.sub(r'(?s)export\s+type\s+WeightPrediction\s*=\s*\{.*?\};\s*\n', '', s, count=1)
    # injeta após imports
    lines = s.splitlines(True)
    ins = 0
    for i, ln in enumerate(lines):
      if ln.startswith("import "):
        ins = i + 1
    lines.insert(ins, "\n" + types_block + "\n")
    s = "".join(lines)
else:
  # injeta após imports
  lines = s.splitlines(True)
  ins = 0
  for i, ln in enumerate(lines):
    if ln.startswith("import "):
      ins = i + 1
  lines.insert(ins, "\n" + types_block + "\n")
  s = "".join(lines)

# 3) Garantir que qualquer retorno "predictWeight" com poucos dados tenha campos mínimos do tipo
#    (evita erro TS2353 de "unknown props" e garante shape)
# Se existir "return { slopeKgPerDay: 0, r2: 0 }", expandir com projectedKg7d/30d defaults
s = re.sub(
  r'return\s*\{\s*slopeKgPerDay\s*:\s*0\s*,\s*r2\s*:\s*0\s*\}\s*;',
  'return { slopeKgPerDay: 0, r2: 0, projectedKg7d: undefined, projectedKg30d: undefined, predictedKg30d: undefined, points: [] };',
  s
)

# 4) Compat: se o código calcula projectedKg30d mas alguém espera predictedKg30d, podemos preencher (sem quebrar)
#    (apenas se existir return final com projectedKg30d e não tiver predictedKg30d)
#    -> injeta predictedKg30d: projectedKg30d,
if "projectedKg30d:" in s and "predictedKg30d:" not in s:
  s = re.sub(
    r'(projectedKg30d\s*:\s*[^,\n\}]+)(\s*[,}\n])',
    r'\1,\n      predictedKg30d: projectedKg30d\2',
    s,
    count=1
  )

pe.write_text(s, encoding="utf-8")
print(f"✅ OK: PredictionEngine.ts types aligned + safeDateIso removed (removed={n_safe})")

# ---------------------------------------------------------------------
# B) LevelSystem.ts: garantir que getLevelInfo return contém xp + nextLevelXp
# ---------------------------------------------------------------------
ls = Path("src/services/gamification/LevelSystem.ts")
if not ls.exists():
  print("ℹ️ SKIP: LevelSystem.ts não encontrado")
  raise SystemExit(0)

t = ls.read_text(encoding="utf-8")

# 1) Garantir LevelInfo contém xp/nextLevelXp
if "export type LevelInfo" in t and ("xp:" not in t or "nextLevelXp" not in t):
  t2, n = re.subn(
    r'(?s)(export\s+type\s+LevelInfo\s*=\s*\{.*?)(\n\};)',
    r'\1\n  xp: number; // alias: total XP\n  nextLevelXp: number; // alias: XP do próximo level\2',
    t,
    count=1
  )
  if n:
    t = t2

# 2) Dentro de getLevelInfo(...), achar "return { ... }" e injetar xp/nextLevelXp se faltarem
m = re.search(r'(?s)static\s+getLevelInfo\s*\(.*?\)\s*:\s*LevelInfo\s*\{.*?return\s*\{(.*?)\n\s*\};', t)
if m:
  block = m.group(1)
  if "xp:" not in block or "nextLevelXp:" not in block:
    # injeta antes do fechamento do objeto return
    def repl(mm):
      inner = mm.group(1)
      add = ""
      if "xp:" not in inner:
        add += "\n      xp: xp,"
      if "nextLevelXp:" not in inner:
        add += "\n      nextLevelXp: next.xp,"
      return "return {" + inner + add + "\n    };"
    t, nret = re.subn(
      r'(?s)return\s*\{(.*?)\n\s*\};',
      repl,
      t,
      count=1
    )
else:
  # fallback: injetar em qualquer return { ... } do arquivo (primeiro) se faltar (idempotente)
  def repl2(mm):
    inner = mm.group(1)
    if "xp:" in inner and "nextLevelXp:" in inner:
      return mm.group(0)
    add = ""
    if "xp:" not in inner:
      add += "\n      xp: xp,"
    if "nextLevelXp:" not in inner:
      add += "\n      nextLevelXp: next.xp,"
    return "return {" + inner + add + "\n    };"
  t, _ = re.subn(r'(?s)return\s*\{(.*?)\n\s*\};', repl2, t, count=1)

ls.write_text(t, encoding="utf-8")
print("✅ OK: LevelSystem getLevelInfo return now includes xp + nextLevelXp")

PY

echo "==> typecheck + verify"
npx tsc --noEmit
npm run -s verify

git add src/services/ml/PredictionEngine.ts src/services/gamification/LevelSystem.ts || true
git commit -m "fix: align phase8/9 prediction types + remove dupes + fill LevelInfo xp fields" || true

echo "✅ OK | BUILD VERDE"
