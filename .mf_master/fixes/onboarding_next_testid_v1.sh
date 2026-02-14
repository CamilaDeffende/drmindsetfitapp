#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/onboarding-next-btn-$TS"
mkdir -p "$BKP"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
for f in \
  src/components/onboarding/OnboardingLayout.tsx \
  src/components/onboarding/OnboardingFooter.tsx \
  src/components/onboarding/OnboardingShell.tsx \
  src/pages/onboarding/OnboardingPage.tsx \
  src/pages/onboarding/StepLayout.tsx \
  tests/mf/e2e_faf_moderadamente_ativo.spec.ts
do
  if [ -f "$f" ]; then
    mkdir -p "$BKP/$(dirname "$f")"
    cp -a "$f" "$BKP/$f"
  fi
done
echo "✅ backup em: $BKP"

echo "==> [2] patch UI: add mf-next-step testid"
python3 - <<'PY2'
from pathlib import Path
import re, sys

CANDIDATES = [
  Path("src/components/onboarding/OnboardingFooter.tsx"),
  Path("src/components/onboarding/OnboardingLayout.tsx"),
  Path("src/components/onboarding/OnboardingShell.tsx"),
  Path("src/pages/onboarding/OnboardingPage.tsx"),
  Path("src/pages/onboarding/StepLayout.tsx"),
]

def read(p: Path) -> str:
  return p.read_text(encoding="utf-8")

def write(p: Path, s: str):
  p.write_text(s, encoding="utf-8")

patched = False

for p in CANDIDATES:
  if not p.exists():
    continue
  s = read(p)
  orig = s

  # Caso 1: <Button ...>Próxima Etapa</Button>
  s2 = re.sub(
    r'(<Button\\b(?![^>]*\\bdata-testid=)[^>]*>)(\\s*Próxima\\s+Etapa\\s*|\\s*Próxima\\s+etapa\\s*)(</Button>)',
    r'\\1 data-testid="mf-next-step">\\2\\3',
    s
  )

  # Caso 2: botão contém "Próxima" em subelementos
  if s2 == s:
    m = re.search(r'(?s)(<Button\\b(?![^>]*\\bdata-testid=)[^>]*>)([\\s\\S]{0,240}?Próxima[\\s\\S]{0,240}?)(</Button>)', s)
    if m:
      open_tag, mid, close_tag = m.group(1), m.group(2), m.group(3)
      open_tag2 = open_tag[:-1] + ' data-testid="mf-next-step">'  # injeta antes de >
      s2 = s[:m.start(1)] + open_tag2 + mid + close_tag + s[m.end(3):]

  if s2 != orig:
    write(p, s2)
    print(f"✅ patched next-step testid in: {p}")
    patched = True
    break

if not patched:
  print("❌ Não consegui localizar o botão Próxima Etapa nos arquivos candidatos.")
  print("➡️ Rode: rg -n \"Próxima Etapa|Próxima etapa\" src/components src/pages -S")
  sys.exit(1)
PY2

echo "==> [3] patch E2E: use mf-next-step"
python3 - <<'PY3'
from pathlib import Path
import re

spec = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = spec.read_text(encoding="utf-8")
orig = s

# troca o primeiro click do botão por texto
s = re.sub(
  r'await\\s+page\\.getByRole\\("button",\\s*\\{\\s*name:\\s*/próxima\\s+etapa/i\\s*\\}\\)\\.click\\(\\)\\s*;',
  'await page.getByTestId("mf-next-step").first().waitFor({ state: "visible" });\\n  await page.getByTestId("mf-next-step").first().click();',
  s,
  count=1,
  flags=re.IGNORECASE
)

# troca o loop para usar testid
s = re.sub(
  r'page\\.getByRole\\("button",\\s*\\{\\s*name:\\s*/próxima\\s+etapa/i\\s*\\}\\)',
  'page.getByTestId("mf-next-step")',
  s,
  flags=re.IGNORECASE
)

if s == orig:
  # se não achar, injeta um click após o preenchimento Step1 (ponto fixo)
  anchor = 'await page.getByRole("spinbutton", { name: /peso/i }).fill("70");'
  i = s.find(anchor)
  if i != -1:
    j = i + len(anchor)
    ins = '\n\n  await page.getByTestId("mf-next-step").first().waitFor({ state: "visible" });\n  await page.getByTestId("mf-next-step").first().click();\n'
    s = s[:j] + ins + s[j:]

spec.write_text(s, encoding="utf-8")
print("✅ patched:", str(spec))
PY3

echo "==> [4] verify"
npm run -s verify

echo "==> [5] e2e"
npm run -s test:e2e

echo "==> [6] commit + push"
git add -A
git commit -m "test(e2e): add mf-next-step testid + stabilize onboarding advance" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
