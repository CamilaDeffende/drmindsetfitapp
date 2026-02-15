#!/usr/bin/env bash
set -euo pipefail

echo "==> [0] status"
git status -sb || true

TS="$(date +%Y%m%d_%H%M%S)"
BKP=".mf_master/backups/fix-step4-hooks-v5-$TS"
mkdir -p "$BKP"
cp -a src/components/steps/Step4Nutricao.tsx "$BKP/" 2>/dev/null || true
echo "backup at: $BKP"

echo
echo "==> [1] Step4Nutricao: move hooks from __mfBuildNutritionInputs -> Step4Nutricao component"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/components/steps/Step4Nutricao.tsx")
s = p.read_text(encoding="utf-8")
orig = s

# --- A) Remove hook/effect blocks from helper __mfBuildNutritionInputs ---
mh = re.search(r"(?s)(function\s+__mfBuildNutritionInputs\b[\s\S]*?\n\})", s)
if not mh:
    raise SystemExit("❌ Não achei function __mfBuildNutritionInputs no Step4Nutricao.tsx")

helper = mh.group(1)
helper2 = helper

# remove the hook bind line
helper2 = re.sub(
    r'(?m)^\s*//\s*MF_STEP4_GAMIFICATION_BIND_V2\s*\n\s*const\s*\{\s*actions\s*:\s*__mfGActions\s*\}\s*=\s*useGamification\(\)\s*;\s*\n?',
    "",
    helper2
)

# remove the entire effect block (the one currently inside helper)
helper2 = re.sub(
    r"(?s)\n\s*//\s*MF_STEP4_GAMIFICATION_EFFECT_V1[\s\S]*?\]\s*\);\s*\n",
    "\n",
    helper2
)

# remove eslint-disable line if still present
helper2 = re.sub(r"(?m)^\s*//\s*eslint-disable-next-line\s+react-hooks/exhaustive-deps\s*$\n?", "", helper2)

# remove any remaining React.useEffect/useEffect inside helper defensively
helper2 = re.sub(r"(?s)^\s*(?:React\.)?useEffect\([\s\S]*?\);\s*$", "", helper2, flags=re.M)

# tidy
helper2 = re.sub(r"\n{3,}", "\n\n", helper2)

if helper2 != helper:
    s = s[:mh.start()] + helper2 + s[mh.end():]

# --- B) Ensure Step4Nutricao component has hook + effect ---
mcomp = re.search(r"(?m)^export\s+function\s+Step4Nutricao\s*\([^)]*\)\s*\{", s)
if not mcomp:
    raise SystemExit("❌ Não achei 'export function Step4Nutricao(...) {'")

brace = s.find("{", mcomp.end()-1)
if brace == -1:
    raise SystemExit("❌ Não achei '{' do Step4Nutricao")

hook_marker = "MF_STEP4_GAMIFICATION_BIND_V5"
effect_marker = "MF_STEP4_GAMIFICATION_EFFECT_V5"
hook_line = "const { actions: __mfGActions } = useGamification();"

if hook_marker not in s:
    s = s[:brace+1] + f"\n  // {hook_marker}\n  {hook_line}\n" + s[brace+1:]

if effect_marker not in s:
    idx = s.find(hook_line)
    if idx == -1:
        raise SystemExit("❌ hook_line não encontrado após inserir no componente.")
    eol = s.find("\n", idx)
    eff = f"""
  // {effect_marker}
  useEffect(() => {{
    try {{
      const kcal = Number((state as any)?.nutricao?.kcalAlvo ?? (state as any)?.nutrition?.kcalAlvo ?? 0);
      if (!kcal || kcal <= 0) return;
      const hasAudit = Boolean((state as any)?.nutricao?.audit || (state as any)?.nutrition?.audit);
      __mfGActions.onNutritionPlanSet(hasAudit);
    }} catch {{}}
  }}, [
    __mfGActions,
    (state as any)?.nutricao?.kcalAlvo,
    (state as any)?.nutricao?.macros?.calorias,
    (state as any)?.nutrition?.kcalAlvo,
  ]);
"""
    s = s[:eol+1] + eff + s[eol+1:]

# --- C) Ensure we are not using React.useEffect anymore anywhere ---
s = s.replace("React.useEffect", "useEffect")

# --- D) Final tidy ---
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
git commit -m "fix(step4): move gamification hooks into Step4Nutricao component (rules-of-hooks, v5)" || echo "ℹ️ nada para commitar"

TS2="$(date +%Y%m%d_%H%M%S)"
TAG="freeze-retention-bind-events-fix-hooks-v5-$TS2"
git tag -a "$TAG" -m "BUILD VERDE — bind events fix hooks v5 [$TS2]"
git tag -f freeze-latest "$TAG"

echo
echo "==> [4] status"
git status -sb
echo "✅ DONE: $TAG"
