import { test, expect } from "@playwright/test";

test("Onboarding Step-1: DOM, nomeCompleto, avançar", async ({ page }) => {
  await page.goto("/onboarding/step-1", { waitUntil: "domcontentloaded" });

  await expect(page.locator("#root")).toBeVisible();

  const nome = page.getByTestId("nomeCompleto").or(page.getByLabel("Nome completo"));
  await expect(nome).toBeVisible();
  await nome.fill("Teste E2E MindsetFit");

  const btn = page.getByRole("button", { name: /continuar|próximo|avançar/i });
  await expect(btn).toBeVisible();
  await btn.click();

  await expect(page).not.toHaveURL(/\/onboarding\/step-1/);
});
