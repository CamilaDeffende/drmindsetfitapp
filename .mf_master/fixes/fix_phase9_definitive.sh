#!/usr/bin/env bash
set -euo pipefail
cd ~/Desktop/DrMindsetfitapp

echo "==> PATCH phase9.sh (auto-heal PredictionEngine defaults)"

python3 - <<'PY'
from pathlib import Path
import re

p = Path(".mf_master/phases/phase9.sh")
if not p.exists():
    raise SystemExit("❌ phase9.sh não encontrado")

s = p.read_text(encoding="utf-8")
marker = "## MF_AUTOHEAL_PREDICTIONENGINE_DEFAULTS_V1"

if marker in s:
    print("OK: phase9.sh já contém auto-heal")
else:
    inject_block = "\n".join([
        "",
        marker,
        "python3 - <<'PY'",
        "from pathlib import Path",
        "import re",
        "",
        "pe = Path('src/services/ml/PredictionEngine.ts')",
        "if not pe.exists():",
        "    raise SystemExit(0)",
        "",
        "txt = pe.read_text(encoding='utf-8')",
        "has_dur = 'getDefaultDuration' in txt",
        "has_cal = 'getDefaultCalories' in txt",
        "if has_dur and has_cal:",
        "    raise SystemExit(0)",
        "",
        "methods = '\\n'.join([",
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
        "    raise SystemExit('❌ PredictionEngine class não encontrada')",
        "",
        "out = txt[:m.end()] + '\\n' + methods + '\\n' + txt[m.end():]",
        "pe.write_text(out, encoding='utf-8')",
        "print('OK: auto-heal aplicou defaults no PredictionEngine')",
        "PY",
        ""
    ])

    if "echo \"==> typecheck + verify\"" in s:
        s = s.replace(
            "echo \"==> typecheck + verify\"",
            inject_block + "\n\necho \"==> typecheck + verify\"",
            1
        )
    else:
        s = s.rstrip() + inject_block

    p.write_text(s, encoding="utf-8")
    print("OK: auto-heal injetado no phase9.sh")

PY

echo "==> RUN phase9 (idempotente)"
./.mf_master/bin/mf run .mf_master/phases/phase9.sh

echo "==> VERIFY final"
npm run -s verify

git add .mf_master/phases/phase9.sh src/services/ml/PredictionEngine.ts
git commit -m "fix: phase9 idempotent auto-heal (no shell parse errors)" || true

echo "✅ OK | Phase 9 definitivo e estável"