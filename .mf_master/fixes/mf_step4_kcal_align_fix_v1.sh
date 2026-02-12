#!/usr/bin/env bash
set -euo pipefail

F="src/components/steps/Step4Nutricao.tsx"
test -f "$F" || { echo "❌ Arquivo não encontrado: $F"; exit 1; }

TS="$(date +%Y%m%d_%H%M%S)"
mkdir -p .backups
cp "$F" ".backups/Step4Nutricao_before_kcal_fix_${TS}.tsx"
echo "✅ backup: .backups/Step4Nutricao_before_kcal_fix_${TS}.tsx"

python3 - <<'PY'
import re
from pathlib import Path

p = Path("src/components/steps/Step4Nutricao.tsx")
s = p.read_text(encoding="utf-8")
orig = s

# 1) Resolver redeclare: renomear mfClamp dentro do bloco que a gente inseriu
#    (apenas dentro do helper block marcado)
def rename_clamp_in_block(text: str, marker: str) -> str:
    idx = text.find(marker)
    if idx == -1:
        return text

    # pega uma janela suficiente após o marker para fazer replace "local"
    head = text[:idx]
    tail = text[idx:]

    # renomeia somente a primeira definição const mfClamp = (...) dentro do tail
    tail2 = re.sub(r'(?m)^\s*const\s+mfClamp\s*=\s*\(', 'const mfClampSSOT = (', tail, count=1)
    # ajusta chamadas mfClamp( -> mfClampSSOT( somente dentro do tail (evita mexer em outro mfClamp já existente)
    tail2 = re.sub(r'\bmfClamp\s*\(', 'mfClampSSOT(', tail2)

    return head + tail2

for mk in ["// MF_STEP4_KCAL_SSOT_HELPERS_V1", "// MF_STEP4_KCAL_ALIGN_HELPERS_V1"]:
    s = rename_clamp_in_block(s, mk)

# 2) Garantir que __mfKcalAlvo é usado no JSX dentro do Card "Calorias alvo"
# Estratégia:
# - localiza o bloco "Calorias alvo"
# - dentro de ~2500 chars após isso, tenta achar um div com text-4xl/text-5xl e troca o conteúdo por {__mfKcalAlvo}
# - se não achar, tenta troca do primeiro "{algo}" próximo antes de "calorias por dia" / "kcal"
if "{__mfKcalAlvo}" not in s:
    m = re.search(r'(?s)(<CardTitle[^>]*>\s*Calorias\s+alvo\s*</CardTitle>)(.{0,2500})', s)
    if m:
        pre = s[:m.end(1)]
        block = s[m.end(1):m.end(0)]
        post = s[m.end(0):]

        # tenta substituir o valor principal (div grande)
        block2 = re.sub(
            r'(?s)(<div[^>]*className="[^"]*(?:text-4xl|text-5xl|text-3xl)[^"]*"[^>]*>\s*)(\{[^}]+\}|\d+)(\s*</div>)',
            r'\1{__mfKcalAlvo}\3',
            block,
            count=1
        )

        # fallback: substitui a 1ª expressão {..} ou número imediatamente antes de "kcal" ou "calorias por dia"
        if block2 == block:
            mm = re.search(r'(?s)(\{[^}]+\}|\b\d+\b)(?=[\s\S]{0,160}(?:kcal|calorias\s+por\s+dia))', block)
            if mm:
                block2 = block[:mm.start()] + "{__mfKcalAlvo}" + block[mm.end():]

        s = pre + block2 + post

# 3) Sanity: se ainda existir duplicidade "const mfClamp" duas vezes, não quebra, mas avisamos
# (não aborta; o verify vai pegar se ainda tiver)
count_clamp = len(re.findall(r'(?m)^\s*const\s+mfClamp\s*=', s))
if count_clamp > 1:
    print(f"⚠️ ainda existem {count_clamp} 'const mfClamp' no arquivo (verify vai confirmar).")
else:
    print("✅ clamp collision fix aplicado.")

# limpa quebras excessivas
s = re.sub(r"\n{3,}", "\n\n", s)

if s == orig:
    print("ℹ️ no changes (arquivo já estava corrigido).")
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
git commit -m "fix(step4): resolve mfClamp redeclare + bind kcal alvo to SSOT" || echo "ℹ️ nada para commitar"
git status -sb
