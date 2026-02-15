#!/usr/bin/env bash
set -euo pipefail

echo "==> [0] status"
git status -sb || true

TS="$(date +%Y%m%d_%H%M%S)"
BKP=".mf_master/backups/fix-step4-hooks-order-v6-$TS"
mkdir -p "$BKP"
cp -a src/components/steps/Step4Nutricao.tsx "$BKP/" 2>/dev/null || true
echo "backup at: $BKP"

echo
echo "==> [1] Step4Nutricao: fix React import + move gamification hook/effect below state"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/components/steps/Step4Nutricao.tsx")
s = p.read_text(encoding="utf-8")
orig = s

# A) Fix React import (React unused)
s = re.sub(
    r'(?m)^import\s+React\s*,\s*\{\s*useEffect\s*\}\s*from\s*["\']react["\']\s*;\s*$',
    'import { useEffect } from "react";',
    s
)

# Also handle if it was exactly: import React, { useEffect } from "react";
s = re.sub(
    r'(?m)^import\s+React\s*,\s*\{\s*useEffect\s*\}\s*from\s*["\']react["\']\s*;\s*$',
    'import { useEffect } from "react";',
    s
)

# B) Remove the v5 blocks wherever they are
# Remove hook bind marker + line
s = re.sub(
    r'(?s)\n\s*//\s*MF_STEP4_GAMIFICATION_BIND_V5\s*\n\s*const\s*\{\s*actions\s*:\s*__mfGActions\s*\}\s*=\s*useGamification\(\)\s*;\s*\n',
    "\n",
    s
)

# Remove effect marker block
s = re.sub(
    r'(?s)\n\s*//\s*MF_STEP4_GAMIFICATION_EFFECT_V5[\s\S]*?\n\s*\]\s*\);\s*\n',
    "\n",
    s
)

# C) Re-insert after the useDrMindSetfit line (state is declared there)
m = re.search(r'(?m)^\s*const\s*\{\s*state\s*,\s*updateState\s*,\s*nextStep\s*\}\s*=\s*useDrMindSetfit\([^)]*\)\s*.*$', s)
if not m:
    raise SystemExit("❌ Não achei a linha do useDrMindSetfit() (const { state, updateState, nextStep } = useDrMindSetfit()).")

insert_after = m.end()

hook_block = """
  // MF_STEP4_GAMIFICATION_BIND_V6
  const { actions: __mfGActions } = useGamification();

  // MF_STEP4_GAMIFICATION_EFFECT_V6
  useEffect(() => {
    try {
      const kcal = Number((state as any)?.nutricao?.kcalAlvo ?? (state as any)?.nutrition?.kcalAlvo ?? 0);
      if (!kcal || kcal <= 0) return;
      const hasAudit = Boolean((state as any)?.nutricao?.audit || (state as any)?.nutrition?.audit);
      __mfGActions.onNutritionPlanSet(hasAudit);
    } catch {}
  }, [
    __mfGActions,
    (state as any)?.nutricao?.kcalAlvo,
    (state as any)?.nutricao?.macros?.calorias,
    (state as any)?.nutrition?.kcalAlvo,
  ]);
"""

if "MF_STEP4_GAMIFICATION_BIND_V6" not in s:
    s = s[:insert_after] + "\n" + hook_block + s[insert_after:]

# D) Ensure no React.useEffect leftovers
s = s.replace("React.useEffect", "useEffect")

# tidy
s = re.sub(r"\n{3,}", "\n\n", s)

if s != orig:
    p.write_text(s, encoding="utf-8")
    print("✅ patched:", p)
else:
    print("ℹ️ no changes:", p)
PY

echo
echo "==> [2] verify (BUILD VERDE)"
npm run -s verify

echo
echo "==> [3] commit + freeze"
git add -A
git commit -m "fix(step4): hook/effect after state + remove unused React import (v6)" || echo "ℹ️ nada para commitar"

TS2="$(date +%Y%m%d_%H%M%S)"
TAG="freeze-retention-bind-events-fix-hooks-v6-$TS2"
git tag -a "$TAG" -m "BUILD VERDE — bind events fix hooks v6 [$TS2]"
git tag -f freeze-latest "$TAG"

echo
echo "==> [4] status"
git status -sb
echo "✅ DONE: $TAG"
