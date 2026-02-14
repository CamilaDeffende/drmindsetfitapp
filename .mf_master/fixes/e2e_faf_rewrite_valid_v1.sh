#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-rewrite-valid-$TS"
mkdir -p "$BKP"

SPEC="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup spec"
mkdir -p "$BKP/$(dirname "$SPEC")"
cp -a "$SPEC" "$BKP/$SPEC"
echo "✅ backup em: $BKP"

echo "==> [2] rewrite spec (TS válido + next robusto + FAF testid)"
cat > "$SPEC" <<'EOF'
import { test, expect } from "@playwright/test";

async function mfClickNext(page: any) {
  // 1) testid (se existir em alguma tela)
  const byTestId = page.getByTestId("mf-next-step");
  try {
    if (await byTestId.count()) {
      const b = byTestId.first();
      await b.waitFor({ state: "visible", timeout: 8000 });
      await b.scrollIntoViewIfNeeded();
      await b.click();
      return;
    }
  } catch {}

  // 2) botão real com texto "Próxima"
  const byTextBtn = page.locator('button:has-text("Próxima")').first();
  try {
    await byTextBtn.waitFor({ state: "visible", timeout: 8000 });
    await byTextBtn.scrollIntoViewIfNeeded();
    await byTextBtn.click();
    return;
  } catch {}

  // 3) fallback role
  const byRole = page.getByRole("button", { name: /próxima/i }).first();
  await byRole.waitFor({ state: "visible", timeout: 8000 });
  await byRole.scrollIntoViewIfNeeded();
  await byRole.click();
}

test("FAF: Moderadamente ativo persiste e aparece no Report", async ({ page }) => {
  test.setTimeout(120000);

  // Step-1
  await page.goto("/onboarding/step-1");

  await page.getByRole("textbox", { name: /nome completo/i }).fill("Teste CI");
  await page.getByRole("spinbutton", { name: /idade/i }).fill("30");
  await page.getByRole("spinbutton", { name: /altura/i }).fill("170");
  await page.getByRole("spinbutton", { name: /peso/i }).fill("70");

  // Se houver histórico/pode ser obrigatório
  const hp = page.getByRole("textbox", { name: /hist[oó]rico/i });
  if ((await hp.count().catch(() => 0)) > 0) {
    await hp.first().fill("Sem histórico relevante. Fluxo de teste CI.");
  }

  await mfClickNext(page);

  // Step-2
  await expect(page).toHaveURL(/step-2/);

  // FAF via testid estável (já existe no Step2Avaliacao)
  const trigger = page.getByTestId("mf-faf-select").first();
  await trigger.waitFor({ state: "visible", timeout: 15000 });
  await trigger.click();

  const opt = page.getByTestId("mf-faf-option-moderadamente-ativo").first();
  await opt.waitFor({ state: "visible", timeout: 15000 });
  await opt.click();

  await mfClickNext(page);

  // Avança até Report (no máx 10 cliques)
  for (let i = 0; i < 10; i++) {
    const url = page.url();
    if (/\/report/i.test(url)) break;

    // se não existir botão de próxima, para (evita loop infinito)
    const has =
      (await page.locator('button:has-text("Próxima")').count().catch(() => 0)) > 0 ||
      (await page.getByRole("button", { name: /próxima/i }).count().catch(() => 0)) > 0 ||
      (await page.getByTestId("mf-next-step").count().catch(() => 0)) > 0;

    if (!has) break;

    await mfClickNext(page);
    await page.waitForTimeout(150);
  }

  await expect(page).toHaveURL(/report/i);

  const fafLabel = page.getByTestId("mf-faf-label");
  await fafLabel.waitFor({ state: "visible", timeout: 15000 });
  await expect(fafLabel).toContainText(/Moderadamente ativo/i);
});
EOF

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e"
npm run -s test:e2e

echo "==> [5] commit + push"
git add -A
git commit -m "test(e2e): rewrite FAF spec with robust next-step + valid TS" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
