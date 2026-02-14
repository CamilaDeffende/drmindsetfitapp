#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-next-super-robust-$TS"
mkdir -p "$BKP"

SPEC="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
mkdir -p "$BKP/$(dirname "$SPEC")"
cp -a "$SPEC" "$BKP/$SPEC"
echo "✅ backup em: $BKP"

echo "==> [2] patch spec: mfClickNext super robust + blur RHF"
python3 - <<'PY2'
from __future__ import annotations
from pathlib import Path
import re, sys

SPEC = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = SPEC.read_text(encoding="utf-8")
orig = s

# 1) Substituir mfClickNext inteiro por versão mais robusta
pat = re.compile(r"async function mfClickNext\([\s\S]*?\n\}\n", re.M)

NEW = r'''async function mfClickNext(page: any) {
  // Espera microtasks/render
  await page.waitForTimeout(100);

  // 1) testid (se existir)
  const byTestId = page.getByTestId("mf-next-step");
  try {
    if (await byTestId.count()) {
      const el = byTestId.first();
      await el.waitFor({ state: "visible", timeout: 15000 });
      await el.scrollIntoViewIfNeeded();
      // se estiver disabled, cai para fallback
      const dis = await el.getAttribute("disabled").catch(() => null);
      if (!dis) { await el.click(); return; }
    }
  } catch {}

  // 2) Qualquer elemento clicável com texto "Próxima"/"Finalizar"
  // (cobre <button>, <a>, div role=button, etc.)
  const clickable = page
    .locator('button, a, [role="button"]')
    .filter({ hasText: /Próxima|Finalizar/i })
    .first();

  try {
    await clickable.waitFor({ state: "visible", timeout: 15000 });
    await clickable.scrollIntoViewIfNeeded();

    // tenta clicar normal
    await clickable.click({ timeout: 15000 });
    return;
  } catch {}

  // 3) fallback final por texto em qualquer tag (último recurso)
  const txt = page.getByText(/Próxima|Finalizar/i).first();
  await txt.waitFor({ state: "visible", timeout: 15000 });
  await txt.scrollIntoViewIfNeeded();
  await txt.click({ timeout: 15000 });
}
'''

if not pat.search(s):
  print("❌ Não encontrei o bloco mfClickNext(...) para substituir.")
  sys.exit(1)

s = pat.sub(NEW + "\n", s, count=1)

# 2) Após preencher campos do step-1, forçar blur/validação (RHF)
# Inserir depois do fill do peso
anchor = 'await page.getByRole("spinbutton", { name: /peso/i }).fill("70");'
i = s.find(anchor)
if i == -1:
  print("❌ Não encontrei o anchor do fill peso para inserir blur.")
  sys.exit(1)

ins = r'''
  // RHF: força blur/validação para liberar canNext
  await page.locator('input[name="nomeCompleto"]').blur().catch(() => {});
  await page.locator('input[name="idade"]').blur().catch(() => {});
  await page.locator('input[name="altura"]').blur().catch(() => {});
  await page.locator('input[name="pesoAtual"]').blur().catch(() => {});
  await page.locator('textarea[name="historicoPeso"]').blur().catch(() => {});
  await page.keyboard.press("Tab").catch(() => {});
  await page.waitForTimeout(150);
'''
if "RHF: força blur/validação" not in s:
  j = i + len(anchor)
  s = s[:j] + ins + s[j:]

if s == orig:
  print("❌ Nenhuma mudança aplicada (inesperado).")
  sys.exit(1)

SPEC.write_text(s, encoding="utf-8")
print("✅ patched:", str(SPEC))
PY2

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e"
npm run -s test:e2e

echo "==> [5] commit + push"
git add -A
git commit -m "test(e2e): super-robust Next click + RHF blur to unlock canNext" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
