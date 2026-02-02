import { test, expect } from "@playwright/test";

test("onboarding step-1: fill nomeCompleto and advance (robust)", async ({ page }) => {
  await page.goto("http://localhost:8080/onboarding/step-1", { waitUntil: "domcontentloaded" });

  // espera o root nascer
  await page.locator("#root").waitFor({ state: "attached", timeout: 20000 });

  // se existir loader do onboarding/app, espera sumir (não falha se não existir)
  const loading = page.locator('[data-testid="app-loading"]');
  if (await loading.count()) {
    await expect(loading).toBeVisible({ timeout: 20000 });
    await expect(loading).toBeHidden({ timeout: 30000 });
  }

  // selector preferencial: name (RHF + Controller)
  let field = page.locator('input[name="nomeCompleto"]');

  // fallback: placeholder
  if (await field.count() === 0) {
    field = page.getByPlaceholder(/nome completo/i);
  }

  // fallback: first input text-like dentro do root
  if (await field.count() === 0) {
    field = page.locator("#root input").first();
  }

  await expect(field).toBeVisible({ timeout: 30000 });
  await field.fill("Luiz Henrique Alexandre");

  const nextBtn = page.getByRole("button", { name: /continuar|próximo|avançar/i }).first();
  await expect(nextBtn).toBeVisible({ timeout: 30000 });
  await nextBtn.click();

  await expect(page).not.toHaveURL(/\/onboarding\/step-1\b/, { timeout: 30000 });
});
