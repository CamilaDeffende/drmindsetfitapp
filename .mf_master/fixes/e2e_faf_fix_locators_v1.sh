#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-fix-locators-$TS"
SPEC="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup spec"
mkdir -p "$BKP/$(dirname "$SPEC")"
cp -a "$SPEC" "$BKP/$SPEC"
echo "✅ backup em: $BKP"

echo "==> [2] patch spec (quote CSS selectors + harden next button to mf-next-step)"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

# 1) Conserta page.locator(input[name=foo]) -> page.locator('input[name="foo"]')
def fix_unquoted_locator(m: re.Match) -> str:
    tag = m.group(1)
    name = m.group(2)
    return f"page.locator('{tag}[name=\"{name}\"]')"

s = re.sub(r"page\.locator\(\s*(input|textarea)\[name\s*=\s*([A-Za-z0-9_]+)\]\s*\)", fix_unquoted_locator, s)

# 2) Conserta possíveis variações sem aspas no locator('input[name=foo]') -> locator('input[name="foo"]')
s = re.sub(r"locator\(\s*'((?:input|textarea))\[name=([A-Za-z0-9_]+)\]'\s*\)", r"locator('\1[name=\"\2\"]')", s)
s = re.sub(r'locator\(\s*"((?:input|textarea))\[name=([A-Za-z0-9_]+)\]"\s*\)', r"locator('\1[name=\"\2\"]')", s)

# 3) Hardening: mfClickNext deve tentar mf-next-step primeiro (já existe na UI)
# Substitui qualquer tentativa prioritária por texto/role antes do testid
if "mf-next-step" in s:
    # garante que mfNextLocator (se existir) usa testid antes de texto
    s = re.sub(
        r"async function mfNextLocator\([\s\S]*?\n\}",
        """async function mfNextLocator(page: any) {
  // 1) data-testid (fonte de verdade)
  try {
    const byTestId = page.getByTestId("mf-next-step").first();
    if (await byTestId.count().catch(() => 0)) return byTestId;
  } catch {}

  // 2) texto (fallback)
  const byText = page
    .locator('button:has-text("Próxima etapa"), button:has-text("Próxima"), button:has-text("Finalizar")')
    .first();
  if (await byText.count().catch(() => 0)) return byText;

  // 3) role (fallback)
  return page.getByRole("button", { name: /próxima|finalizar/i }).first();
}""",
        s,
        count=1
    )

if s == orig:
    raise SystemExit("❌ Nenhuma mudança aplicada — o arquivo pode já estar corrigido. Abra a linha do erro e confirme.")

p.write_text(s, encoding="utf-8")
print("✅ patched:", p)
PY

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e (apenas este spec)"
npx playwright test "$SPEC" --workers=1

echo "==> [5] e2e (suite completa)"
npm run -s test:e2e

echo "==> [6] commit + push"
git add -A
git commit -m "test(e2e): fix FAF spec selectors quoting + prioritize mf-next-step" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
