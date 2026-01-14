import { test, expect } from "@playwright/test";

test("smoke: carrega app e interage com navegação básica", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });

  // baseline: body visível e sem crash imediato
  await expect(page.locator("body")).toBeVisible();

  // tenta encontrar botões comuns (sem falhar se não existirem na rota inicial)
  const next = page.getByRole("button", { name: /próxima etapa|próximo|continuar|avançar/i });
  const back = page.getByRole("button", { name: /voltar/i });

  if (await next.count()) {
    await next.first().click({ timeout: 10_000 });
    await page.waitForTimeout(400);
  }
  if (await back.count()) {
    await back.first().click({ timeout: 10_000 });
    await page.waitForTimeout(400);
  }

  // garante que continua renderizando
  await expect(page.locator("body")).toBeVisible();
});
