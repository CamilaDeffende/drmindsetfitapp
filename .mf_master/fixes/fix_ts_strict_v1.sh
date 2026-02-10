#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

echo "==> fix_ts_strict_v1"

# 1) remove unused React imports
for f in   src/components/charts/WeightChart.tsx   src/components/charts/WorkoutFrequencyChart.tsx   src/pages/progress/ProgressPage.tsx
do
  [[ -f "$f" ]] || continue
  perl -0777 -i -pe 's/^\s*import\s+React\s+from\s+["\x27]react["\x27]\s*;\s*\n//m' "$f"
  perl -0777 -i -pe 's/^\s*import\s+React\s*,\s*\{/import {/m' "$f"
done

# 2) WearablesPage payload
WP="src/pages/wearables/WearablesPage.tsx"
if [[ -f "$WP" ]]; then
  perl -0777 -i -pe 's/\bdate\s*:\s*workout\.startTime\b/dateIso: workout.startTime/g' "$WP"
  perl -0777 -i -pe 's/\baverageHeartRate\b/avgHeartRate/g' "$WP"
  perl -0777 -i -pe 's/historyService\.addWorkout\(\{\s*/historyService.addWorkout({\n        modality: workout.type,\n        type: workout.type,\n        title: workout.type === "corrida" ? "Treino Wearable — Corrida" : "Treino Wearable — Ciclismo",\n        /s' "$WP"
fi

# 3) AdaptiveEngine null-safe + weightKg
AE="src/services/ai/AdaptiveEngine.ts"
if [[ -f "$AE" ]]; then
# MF_HARDEN_FIX_TS_STRICT_V1: disabled (eslint-safe)
#   perl -0777 -i -pe 's/\+\s*w\.durationMinutes\b/ + (w.durationMinutes ?? w.durationMin ?? 0)/g' "$AE"
  perl -0777 -i -pe 's/\.weight\b/.weightKg/g' "$AE"
fi

# 4) HistoryService seedDemo requires type
HS="src/services/history/HistoryService.ts"
if [[ -f "$HS" ]]; then
  perl -0777 -i -pe 's/(modality:\s*isStrength\s*\?\s*"musculacao"\s*:\s*"corrida",)/$1\n          type: isStrength ? "musculacao" : "corrida",/s' "$HS"
fi

# 5) PredictionEngine: dateIso/weightKg + null-safe
PE="src/services/ml/PredictionEngine.ts"
if [[ -f "$PE" ]]; then
# MF_HARDEN_FIX_TS_STRICT_V1: disabled (eslint-safe)
#   perl -0777 -i -pe 's/\bw\.durationMinutes\b/(w.durationMinutes ?? w.durationMin ?? 0)/g' "$PE"
# MF_HARDEN_FIX_TS_STRICT_V1: disabled (eslint-safe)
#   perl -0777 -i -pe 's/\bw\.caloriesBurned\b/(w.caloriesBurned ?? w.caloriesKcal ?? 0)/g' "$PE"
  perl -0777 -i -pe 's/\bdata\[0\]\.date\b/data[0].dateIso/g' "$PE"
  perl -0777 -i -pe 's/\bd\.date\b/d.dateIso/g' "$PE"
  perl -0777 -i -pe 's/\bd\.weight\b/d.weightKg/g' "$PE"
  perl -0777 -i -pe 's/\bw\.date\b/w.dateIso/g' "$PE"
fi

echo "==> tsc --noEmit"
npx tsc --noEmit

echo "==> verify"
npm run -s verify

git add -A
git commit -m "fix: TS strict errors (react imports, wearables payload, ai/ml nullsafe, seedDemo type)" || true

echo "✅ OK | fix_ts_strict_v1 done"
