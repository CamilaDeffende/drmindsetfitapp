#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1

F="src/pages/wearables/WearablesPage.tsx"
test -f "$F" || { echo "❌ faltando: $F"; exit 2; }

python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/pages/wearables/WearablesPage.tsx")
s = p.read_text(encoding="utf-8")

# 1) mapTypeToWorkoutType: default -> "outro"
s = re.sub(r'default:\s*return\s*"corrida";', 'default:\n      return "outro";', s)

# 2) Remover campos fora do contrato do HistoryService (maxHeartRate, gpsRoute) e remover "as any"
# Mantém somente: id/dateIso/modality/type/title/durationMin/distanceKm/caloriesKcal/pse/avgHeartRate/notes
s = re.sub(r'\s*maxHeartRate:\s*workout\.maxHeartRate,\s*\n', '', s)
s = re.sub(r'\s*gpsRoute:\s*workout\.gpsRoute,\s*\n', '', s)
s = re.sub(r'\}\s*as\s*any\);', '});', s)

p.write_text(s, encoding="utf-8")
print("✅ fix applied:", p)
PY

echo "==> preview (WearablesPage.tsx)"; sed -n '1,260p' "$F"
