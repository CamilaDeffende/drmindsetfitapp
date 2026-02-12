#!/usr/bin/env bash
set -euo pipefail

echo "==> 0) status"
git status -sb || true
echo

echo "==> 1) ignore .mf_devlog.txt (idempotente)"
python3 - <<'PY'
from pathlib import Path
gi = Path(".gitignore")
s = gi.read_text(encoding="utf-8") if gi.exists() else ""
marker = "# MF_IGNORE_LOCAL_LOGS"
line = ".mf_devlog.txt"
if marker not in s:
    s = s.rstrip() + "\n\n" + marker + "\n" + line + "\n"
else:
    if line not in s.splitlines():
        s = s.rstrip() + "\n" + line + "\n"
gi.write_text(s, encoding="utf-8")
print("✅ .gitignore updated")
PY
echo

echo "==> 2) patch Step4 kcal = base (equação/FAF) + estratégia (%)"
python3 - <<'PY'
import re
from pathlib import Path

p = Path("src/components/steps/Step4Nutricao.tsx")
s = p.read_text(encoding="utf-8")
orig = s

TOP = "// MF_STEP4_KCAL_SSOT_V1"
if TOP not in s:
    s = TOP + "\n" + s

helpers_ts = """\n// MF_STEP4_KCAL_SSOT_HELPERS_V1\nconst mfClamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));\n\n/**\n * SSOT de kcal do Step4:\n * - baseKcal vem do metabolismo calculado (GET/TDEE preferencial; fallback: metaDiaria)\n * - estratégia aplica percent (+/-) automaticamente\n * - clamp opcional pela faixa segura (quando disponível), preservando guardrails\n */\nconst mfComputeKcalAlvo = (opts: {\n  baseKcal: number;\n  percent: number; // ex: -15, 0, +10\n  faixa?: { minimo?: number; maximo?: number } | null;\n}) => {\n  const base = Number.isFinite(opts.baseKcal) ? opts.baseKcal : 0;\n  const pct = Number.isFinite(opts.percent) ? opts.percent : 0;\n  const raw = base * (1 + pct / 100);\n  const rounded = Math.round(raw);\n\n  const min = opts.faixa?.minimo;\n  const max = opts.faixa?.maximo;\n\n  if (Number.isFinite(min) && Number.isFinite(max) && (max as number) >= (min as number)) {\n    return mfClamp(rounded, min as number, max as number);\n  }\n  return rounded;\n};\n"""

if "// MF_STEP4_KCAL_SSOT_HELPERS_V1" not in s:
    m = re.search(r"(?m)^(import[^\n]*\n)+", s)
    if not m:
        raise SystemExit("❌ Não encontrei bloco de imports para inserir helpers no Step4Nutricao.tsx")
    s = s[:m.end()] + helpers_ts + s[m.end():]

calc_block = """
  // MF_STEP4_KCAL_SSOT_CALC_V1
  const __mfBaseKcal =
    Number((state as any)?.metabolismo?.get ?? (state as any)?.metabolismo?.GET ?? (state as any)?.metabolismo?.tdee ?? (state as any)?.metabolismo?.metaDiaria ?? 0);

  const __mfPercentRaw =
    (state as any)?.nutricao?.percentualEstrategia ??
    (state as any)?.nutricao?.percentual ??
    (state as any)?.nutricao?.strategyPercent ??
    0;

  const __mfPercent = Number(__mfPercentRaw) || 0;

  const __mfFaixa = (state as any)?.metabolismo?.faixaSegura
    ? { minimo: Number((state as any)?.metabolismo?.faixaSegura?.minimo), maximo: Number((state as any)?.metabolismo?.faixaSegura?.maximo) }
    : null;

  const __mfKcalAlvo = mfComputeKcalAlvo({ baseKcal: __mfBaseKcal, percent: __mfPercent, faixa: __mfFaixa });
"""

if "MF_STEP4_KCAL_SSOT_CALC_V1" not in s:
    ret = re.search(r"(?m)^\s*return\s*\(", s)
    if not ret:
        raise SystemExit("❌ Não encontrei 'return (' no Step4Nutricao.tsx para inserir cálculo SSOT")
    s = s[:ret.start()] + calc_block + "\n" + s[ret.start():]

# troca o número principal por __mfKcalAlvo (tenta padrão comum)
s2 = re.sub(
    r'(?s)(<div[^>]*className="[^"]*text-4xl[^"]*"[^>]*>\s*)(\{[^}]+\}|\d+)(\s*</div>\s*<div[^>]*>\s*calorias\s+por\s+dia\s*</div>)',
    r'\1{__mfKcalAlvo}\3',
    s,
    count=1
)

# fallback se existir literal 2446
if s2 == s and "2446" in s:
    s2 = s.replace("2446", "{__mfKcalAlvo}", 1)

s2 = re.sub(r"\n{3,}", "\n\n", s2)

if s2 == orig:
    print("ℹ️ Step4Nutricao: no changes (padrões diferentes ou já alinhado).")
else:
    p.write_text(s2, encoding="utf-8")
    print("✅ patched:", p)
PY
echo

echo "==> 3) verify (BUILD VERDE)"
npm run -s verify
echo

echo "==> 4) commit"
git add -A
git commit -m "ui(nutrition): align Step4 kcal to metabolism SSOT (strategy %)" || echo "ℹ️ nada para commitar"
git status -sb
