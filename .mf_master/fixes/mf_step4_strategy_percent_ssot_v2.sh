#!/usr/bin/env bash
set -euo pipefail

F="src/components/steps/Step4Nutricao.tsx"
test -f "$F" || { echo "❌ Arquivo não encontrado: $F"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
mkdir -p .backups
cp "$F" ".backups/Step4Nutricao_before_strategy_ssot_${TS}.tsx"
echo "✅ backup: .backups/Step4Nutricao_before_strategy_ssot_${TS}.tsx"

python3 - <<'PY'
import re
from pathlib import Path

p = Path("src/components/steps/Step4Nutricao.tsx")
s = p.read_text(encoding="utf-8")
orig = s

# 1) Inserir mapper SSOT de estratégia -> percentual (idempotente)
mapper = """
// MF_STEP4_STRATEGY_PERCENT_SSOT_V2
const mfStrategyPercent = (e: string) => {
  switch (e) {
    case "deficit-leve":
      return -10;
    case "deficit-moderado":
      return -20;
    case "deficit-agressivo":
      return -25;
    case "superavit":
      return +15;
    case "manutencao":
    default:
      return 0;
  }
};
"""

if "MF_STEP4_STRATEGY_PERCENT_SSOT_V2" not in s:
    # inserir logo após a linha do useState da estrategia (mais seguro)
    m = re.search(r"(?m)^\s*const\s*\[\s*estrategia\s*,\s*setEstrategia\s*\]\s*=\s*useState<[^>]*>\([^)]*\)\s*$", s)
    if not m:
        # fallback: após helpers de kcal se existirem
        m2 = re.search(r"MF_STEP4_KCAL_(?:ALIGN_)?HELPERS_V1", s)
        if not m2:
            raise SystemExit("❌ Não encontrei onde inserir mfStrategyPercent (useState estrategia / helpers).")
        insert_at = s.find("\n", m2.end()) + 1
        s = s[:insert_at] + mapper + s[insert_at:]
    else:
        insert_at = m.end() + 1
        s = s[:insert_at] + mapper + s[insert_at:]

# 2) Substituir a cadeia antiga de ifs por cálculo percent-based (SSOT)
# alvo: linhas 156-159 que você mostrou
# vamos trocar QUALQUER sequência de "if (estrategia === 'deficit-...') caloriasFinais = calorias * X"
pat_ifs = r"""(?m)^\s*if\s*\(\s*estrategia\s*===\s*'deficit-leve'\s*\)\s*caloriasFinais\s*=\s*calorias\s*\*\s*0\.9\s*\n
\s*if\s*\(\s*estrategia\s*===\s*'deficit-moderado'\s*\)\s*caloriasFinais\s*=\s*calorias\s*\*\s*0\.8\s*\n
\s*if\s*\(\s*estrategia\s*===\s*'deficit-agressivo'\s*\)\s*caloriasFinais\s*=\s*calorias\s*\*\s*0\.75\s*\n
\s*if\s*\(\s*estrategia\s*===\s*'superavit'\s*\)\s*caloriasFinais\s*=\s*calorias\s*\*\s*1\.15\s*$"""
rep = """  // MF_STEP4_CALC_KCAL_BY_PERCENT_V2
  const __mfPctStrategy = mfStrategyPercent(estrategia);
  caloriasFinais = calorias * (1 + __mfPctStrategy / 100);"""

s2 = re.sub(pat_ifs, rep, s)

# Se não bateu exatamente (formatação diferente), tenta uma abordagem mais flexível:
if s2 == s:
    flex = re.compile(r"(?ms)^\s*if\s*\(\s*estrategia\s*===\s*'deficit-leve'[\s\S]*?calorias\s*\*\s*1\.15\s*$")
    m = flex.search(s)
    if m and "MF_STEP4_CALC_KCAL_BY_PERCENT_V2" not in s:
        s2 = s[:m.start()] + rep + s[m.end():]
    else:
        s2 = s

s = s2

# 3) Ajustar o __mfPercent para usar o state SE existir, senão usar a estratégia local
#    (garante que kcal alvo reage ao select mesmo antes de persistir)
# substitui bloco do __mfPercent = Number(__mfPercentRaw) || 0;
s = re.sub(
    r"(?m)^\s*const\s+__mfPercent\s*=\s*Number\(__mfPercentRaw\)\s*\|\|\s*0\s*;\s*$",
    "  const __mfPercentFromStrategy = mfStrategyPercent(estrategia);\n  const __mfPercent = (Number(__mfPercentRaw) || __mfPercentFromStrategy || 0);",
    s,
    count=1
)

# 4) Persistir percentualEstrategia no planejamento quando salva nutricao (updateState)
# local alvo: planejamento object contém "estrategia," em linha 357
# Vamos inserir logo após "estrategia," uma linha percentualEstrategia:
if "percentualEstrategia:" not in s:
    s = re.sub(
        r"(?m)^\s*estrategia\s*,\s*$",
        "      estrategia,\n      percentualEstrategia: mfStrategyPercent(estrategia),",
        s,
        count=1
    )

# 5) Opcional (mas alinhado): persistir também kcalAlvo calculada (SSOT) no planejamento, se existir o __mfKcalAlvo
if "__mfKcalAlvo" in s and "kcalAlvo:" not in s:
    # coloca depois de percentualEstrategia (ou depois de estrategia)
    s = re.sub(
        r"(?m)^\s*percentualEstrategia:\s*mfStrategyPercent\(estrategia\),\s*$",
        "      percentualEstrategia: mfStrategyPercent(estrategia),\n      kcalAlvo: __mfKcalAlvo,",
        s,
        count=1
    )

s = re.sub(r"\n{3,}", "\n\n", s)

if s == orig:
    print("ℹ️ no changes (talvez já aplicado).")
else:
    p.write_text(s, encoding="utf-8")
    print("✅ patched:", str(p))
PY

echo
echo "==> verify (BUILD VERDE)"
npm run -s verify

echo
echo "==> commit"
git add -A
git commit -m "fix(step4): strategy percent SSOT + persist percentualEstrategia (+kcalAlvo)" || echo "ℹ️ nada para commitar"
git status -sb
