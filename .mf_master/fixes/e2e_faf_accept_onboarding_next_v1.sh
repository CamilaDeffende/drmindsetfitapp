#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-accept-onboarding-next-$TS"
SPEC="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup spec"
mkdir -p "$BKP/$(dirname "$SPEC")"
cp -a "$SPEC" "$BKP/$SPEC"
echo "✅ backup em: $BKP"

echo "==> [2] patch mfFindNextButton: Step-1 uses onboarding-next"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

def replace_fn(fn_name: str, body: str):
    global s
    pat = rf"async function {re.escape(fn_name)}\([\s\S]*?\n\}}"
    m = re.search(pat, s)
    if not m:
        raise SystemExit(f"❌ Não encontrei a função {fn_name}() no spec.")
    s = s[:m.start()] + body + s[m.end():]

mfFind = r'''
async function mfFindNextButton(page: any, timeout = 25000) {
  // ✅ Step-1 REAL (evidência do dump): botão "Continuar" com testid onboarding-next
  const step1 = page.locator('[data-testid="onboarding-next"]').first();
  try { await step1.waitFor({ state: "attached", timeout: Math.min(6000, timeout) }); } catch {}
  if (await step1.count().catch(() => 0)) return step1;

  // ✅ Shell/carrossel (Step 2+): mf-next-step
  const css = page.locator('[data-testid="mf-next-step"]').first();
  try { await css.waitFor({ state: "attached", timeout: Math.min(6000, timeout) }); } catch {}
  if (await css.count().catch(() => 0)) return css;

  // fallback: getByTestId (caso config mude)
  const byTestId = page.getByTestId("mf-next-step").first();
  if (await byTestId.count().catch(() => 0)) return byTestId;

  // fallback: role/name
  const byRole = page.getByRole("button", { name: /continuar|próxima etapa|próxima|finalizar/i }).first();
  if (await byRole.count().catch(() => 0)) return byRole;

  // fallback: texto
  const byText = page.locator('button:has-text("Continuar"), button:has-text("Próxima etapa"), button:has-text("Próxima"), button:has-text("Finalizar")').first();
  if (await byText.count().catch(() => 0)) return byText;

  return null;
}
'''.strip("\n")

replace_fn("mfFindNextButton", mfFind)

# hardening: mensagem de erro deve citar onboarding-next também
s = s.replace(
  "MF: não encontrei botão mf-next-step/Próxima etapa",
  "MF: não encontrei botão onboarding-next/mf-next-step (Continuar/Próxima etapa)"
)

if s == orig:
    raise SystemExit("❌ Nenhuma mudança aplicada (inesperado).")

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
git commit -m "test(e2e): accept Step1 onboarding-next as next button (SSOT) + keep mf-next-step for shell" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
