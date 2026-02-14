#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/onboarding-next-btn-v2-$TS"
mkdir -p "$BKP"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

UI="src/components/onboarding/OnboardingCarouselShell.tsx"
SPEC="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [1] backup"
for f in "$UI" "$SPEC"; do
  if [ -f "$f" ]; then
    mkdir -p "$BKP/$(dirname "$f")"
    cp -a "$f" "$BKP/$f"
  fi
done
echo "✅ backup em: $BKP"

echo "==> [2] patch UI: add mf-next-step on onboarding button (idempotente)"
python3 - <<'PY2'
from pathlib import Path
import re, sys

p = Path("src/components/onboarding/OnboardingCarouselShell.tsx")
if not p.exists():
    print("❌ UI file not found:", p)
    sys.exit(1)

s = p.read_text(encoding="utf-8")
orig = s

# alvo: um <Button ...> que renderiza "Próxima etapa" / "Finalizar"
# adiciona data-testid se ainda não existir na tag
# estratégia: achar o primeiro <Button ...> que contenha esse ternário dentro do bloco.
pat = re.compile(r'(?s)(<Button\b(?![^>]*\bdata-testid=)[^>]*>)([\s\S]{0,200}?\{canNext\s*\?\s*"Próxima etapa"\s*:\s*"Finalizar"\}[\s\S]{0,200}?)(</Button>)')
m = pat.search(s)
if not m:
    # fallback: se o texto estiver com aspas simples ou variação
    pat2 = re.compile(r'(?s)(<Button\b(?![^>]*\bdata-testid=)[^>]*>)([\s\S]{0,240}?Próxima etapa[\s\S]{0,240}?)(</Button>)')
    m = pat2.search(s)
    if not m:
        print("❌ Não encontrei o Button do onboarding para inserir data-testid.")
        sys.exit(1)

open_tag, mid, close_tag = m.group(1), m.group(2), m.group(3)
open_tag2 = open_tag[:-1] + ' data-testid="mf-next-step">'  # injeta antes de >
s = s[:m.start(1)] + open_tag2 + mid + close_tag + s[m.end(3):]

p.write_text(s, encoding="utf-8")
print("✅ patched:", str(p))
PY2

echo "==> [3] patch E2E: use mf-next-step (idempotente)"
python3 - <<'PY3'
from pathlib import Path
import re, sys

spec = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
if not spec.exists():
    print("❌ spec não encontrado:", spec)
    sys.exit(1)

s = spec.read_text(encoding="utf-8")
orig = s

# Substitui o primeiro click por role/name (se ainda existir) por testid
s = re.sub(
    r'await\s+page\.getByRole\("button",\s*\{\s*name:\s*/próxima\s+etapa/i\s*\}\)\.click\(\)\s*;',
    'await page.getByTestId("mf-next-step").first().waitFor({ state: "visible" });\n  await page.getByTestId("mf-next-step").first().click();',
    s,
    count=1,
    flags=re.IGNORECASE
)

# No loop, garantir getByTestId
s = re.sub(
    r'page\.getByRole\("button",\s*\{\s*name:\s*/próxima\s+etapa/i\s*\}\)',
    'page.getByTestId("mf-next-step")',
    s,
    flags=re.IGNORECASE
)

# Se não houve mudança, tudo bem (já está em testid)
spec.write_text(s, encoding="utf-8")
print("✅ ensured spec uses mf-next-step:", str(spec))
PY3

echo "==> [4] verify"
npm run -s verify

echo "==> [5] e2e"
npm run -s test:e2e

echo "==> [6] commit + push"
git add -A
git commit -m "test(e2e): add mf-next-step testid on onboarding button (stable advance)" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE — agora o FAF test deve avançar do step-1"
