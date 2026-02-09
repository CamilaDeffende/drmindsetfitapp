#!/usr/bin/env bash
set -euo pipefail
cd ~/Desktop/DrMindsetfitapp

echo "==> Patch phase9.sh: add AUTOHEAL V2 (checks private members)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path(".mf_master/phases/phase9.sh")
if not p.exists():
  raise SystemExit("❌ Não encontrei .mf_master/phases/phase9.sh")

s = p.read_text(encoding="utf-8")

marker2 = "## MF_AUTOHEAL_PREDICTIONENGINE_DEFAULTS_V2"
if marker2 in s:
  print("OK: V2 já existe no phase9.sh")
else:
  block = "\n".join([
    "",
    marker2,
    "python3 - <<'PY'",
    "from pathlib import Path",
    "import re",
    "",
    "pe = Path('src/services/ml/PredictionEngine.ts')",
    "if not pe.exists():",
    "  raise SystemExit(0)",
    "",
    "txt = pe.read_text(encoding='utf-8')",
    "has_dur = re.search(r'(?m)^\\s*private\\s+getDefaultDuration\\s*\\(', txt) is not None",
    "has_cal = re.search(r'(?m)^\\s*private\\s+getDefaultCalories\\s*\\(', txt) is not None",
    "if has_dur and has_cal:",
    "  raise SystemExit(0)",
    "",
    "methods = \"\\n\".join([",
    "  '  private getDefaultDuration(type: any): number {',",
    "  '    switch (type) {',",
    "  '      case \"corrida\": return 40;',",
    "  '      case \"ciclismo\": return 50;',",
    "  '      case \"musculacao\": return 55;',",
    "  '      default: return 45;',",
    "  '    }',",
    "  '  }',",
    "  '',",
    "  '  private getDefaultCalories(type: any): number {',",
    "  '    switch (type) {',",
    "  '      case \"corrida\": return 380;',",
    "  '      case \"ciclismo\": return 420;',",
    "  '      case \"musculacao\": return 360;',",
    "  '      default: return 350;',",
    "  '    }',",
    "  '  }',",
    "])",
    "",
    "pat = r'(export\\s+class\\s+PredictionEngine\\s*\\{)'",
    "m = re.search(pat, txt)",
    "if not m:",
    "  raise SystemExit('❌ PredictionEngine class não encontrada')",
    "",
    "out = txt[:m.end()] + \"\\n\" + methods + \"\\n\" + txt[m.end():]",
    "pe.write_text(out, encoding='utf-8')",
    "print('OK: AUTOHEAL V2 injetou defaults como private members')",
    "PY",
    ""
  ])

  # Inserir V2 imediatamente antes do typecheck/verify
  if 'echo "==> typecheck + verify"' in s:
    s = s.replace('echo "==> typecheck + verify"', block + "\n\necho \"==> typecheck + verify\"", 1)
  elif "npx tsc --noEmit" in s:
    s = s.replace("npx tsc --noEmit", block + "\n\nnpx tsc --noEmit", 1)
  else:
    s = s.rstrip() + "\n" + block

  p.write_text(s, encoding="utf-8")
  print("OK: AUTOHEAL V2 inserido no phase9.sh")

PY

echo "==> Run phase9 again (now should heal and go green)"
./.mf_master/bin/mf run .mf_master/phases/phase9.sh

echo "==> Verify final"
npm run -s verify

git add .mf_master/phases/phase9.sh src/services/ml/PredictionEngine.ts
git commit -m "fix: phase9 auto-heal v2 (detect private methods, prevent regression)" || true

echo "✅ OK | Phase 9 idempotente e BUILD VERDE"