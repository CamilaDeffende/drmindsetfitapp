#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-force-next-testid-$TS"
SPEC="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup spec"
mkdir -p "$BKP/$(dirname "$SPEC")"
cp -a "$SPEC" "$BKP/$SPEC"
echo "✅ backup em: $BKP"

echo "==> [2] patch spec: force mf-next-step as SSOT"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

# 1) Garante que QUALQUER função mfFindNextButton / mfWaitNextEnabled use testid primeiro.
# Estratégia: substituir o corpo de mfFindNextButton e mfWaitNextEnabled (se existirem) por versões determinísticas.

def replace_fn(name: str, body: str) -> bool:
    global s
    # tenta pegar: async function name(...) { ... }
    pat = rf"async function {re.escape(name)}\([\s\S]*?\n\}}"
    m = re.search(pat, s)
    if not m:
        return False
    s2 = s[:m.start()] + body + s[m.end():]
    s = s2
    return True

mfFindNextButton_body = """async function mfFindNextButton(page: any) {
  // SSOT: botão do footer do onboarding
  const byTestId = page.getByTestId("mf-next-step").first();
  if (await byTestId.count().catch(() => 0)) return byTestId;

  // fallback 1: role
  const byRole = page.getByRole("button", { name: /próxima etapa|próxima|finalizar/i }).first();
  if (await byRole.count().catch(() => 0)) return byRole;

  // fallback 2: texto
  const byText = page.locator('button:has-text("Próxima etapa"), button:has-text("Próxima"), button:has-text("Finalizar")').first();
  if (await byText.count().catch(() => 0)) return byText;

  return null;
}"""

mfWaitNextEnabled_body = """async function mfWaitNextEnabled(page: any, timeout = 20000) {
  const btn = await mfFindNextButton(page);
  if (!btn) throw new Error("MF: não encontrei botão mf-next-step/Próxima etapa");

  await btn.waitFor({ state: "visible", timeout });
  await btn.scrollIntoViewIfNeeded().catch(() => {});

  // hardening: aguarda não estar disabled/aria-disabled
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const disabled = await btn.evaluate((el: any) => {
      const d = (el as any).disabled === true;
      const ad = (el as any).getAttribute?.("aria-disabled");
      return d || ad === "true";
    }).catch(() => False)
    if not disabled:
      break
    await page.waitForTimeout(120);
  }
  return btn;
}"""

# mfWaitNextEnabled_body acima tem um trecho python acidental se eu não cuidar.
# Vou montar corretamente em JS sem misturar sintaxe.

mfWaitNextEnabled_body = """async function mfWaitNextEnabled(page: any, timeout = 20000) {
  const btn = await mfFindNextButton(page);
  if (!btn) throw new Error("MF: não encontrei botão mf-next-step/Próxima etapa");

  await btn.waitFor({ state: "visible", timeout });
  await btn.scrollIntoViewIfNeeded().catch(() => {});

  // hardening: aguarda não estar disabled/aria-disabled
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const disabled = await btn
      .evaluate((el: any) => {
        const d = (el as any).disabled === true;
        const ad = (el as any).getAttribute?.("aria-disabled");
        return d || ad === "true";
      })
      .catch(() => false);

    if (!disabled) break;
    await page.waitForTimeout(120);
  }

  return btn;
}"""

changed = False
if replace_fn("mfFindNextButton", mfFindNextButton_body):
    changed = True

if replace_fn("mfWaitNextEnabled", mfWaitNextEnabled_body):
    changed = True

# 2) Se o arquivo não tiver essas funções, injeta versões no topo após imports (fallback)
if not changed:
    anchor = re.search(r"(?m)^\s*test\.describe\(", s)
    if not anchor:
        raise SystemExit("❌ Não encontrei ponto de inserção (test.describe).")
    ins = mfFindNextButton_body + "\n\n" + mfWaitNextEnabled_body + "\n\n"
    s = s[:anchor.start()] + ins + s[anchor.start():]
    changed = True

# 3) Força mfClickNextAndWaitStep2 (se existir) a usar mfWaitNextEnabled + clique com fallback JS
pat_click = r"async function mfClickNextAndWaitStep2\([\s\S]*?\n\}"
m = re.search(pat_click, s)
if m:
    block = """async function mfClickNextAndWaitStep2(page: any) {
  const btn = await mfWaitNextEnabled(page, 25000);

  await btn.click({ timeout: 25000 }).catch(async () => {
    try { await btn.evaluate((el: any) => (el as any).click()); } catch {}
  });

  // aguarda navegação real (pode ser SPA)
  await page.waitForTimeout(200);
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(200);
  await page.waitForURL(/step-2|onboarding\/step-2/i, { timeout: 25000 });
}"""
    s = s[:m.start()] + block + s[m.end():]
    changed = True

if s == orig:
    raise SystemExit("❌ Nenhuma mudança aplicada — o padrão do arquivo mudou. Me manda o trecho do spec (funções helper).")

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
git commit -m "test(e2e): use mf-next-step as SSOT for onboarding next + harden waits" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
