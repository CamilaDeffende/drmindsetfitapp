import { test, expect } from "@playwright/test";

const STEPS = [1,2,3,4,5,6,7,8];

test.describe("MF › onboarding UI contract (anti-regressão)", () => {
  for (const n of STEPS) {
    test(`contract: /onboarding/step-${n}`, async ({ page }) => {
      await page.goto(`/onboarding/step-${n}`, { waitUntil: "domcontentloaded" });

      await expect(page.locator("#root")).toHaveCount(1);
      await expect.poll(async () => (await page.locator("#root").innerHTML()).length, { timeout: 6000 })
        .toBeGreaterThan(200);

      const root = page.locator('[data-testid="mf-step-root"]');
      await expect(root).toHaveCount(1);

      const next = page.locator('[data-testid="mf-next"]');
      if (await next.count()) await expect(next.first()).toBeEnabled();

      const back = page.locator('[data-testid="mf-back"]');
      if (await back.count()) await expect(back.first()).toBeEnabled();
    });
  }

  test("persistência SSOT mínima: step-1 preenche nomeCompleto e persiste após reload", async ({ page }) => {
    await page.goto("/onboarding/step-1", { waitUntil: "domcontentloaded" });

    const nome = page.locator('input[name="nomeCompleto"]');
    await expect(nome).toHaveCount(1);
    await nome.fill("MF QA Contract");

    const next = page.locator('[data-testid="mf-next"]');
    if (await next.count()) await next.click();

    const key = "mindsetfit:onboardingProgress:v1";
    await expect.poll(async () => {
      return await page.evaluate((k) => localStorage.getItem(k) || "", key);
    }, { timeout: 6000 }).not.toBe("");

    await page.reload({ waitUntil: "domcontentloaded" });

    const after = await page.evaluate((k) => localStorage.getItem(k) || "", key);
    expect(after.length).toBeGreaterThan(0);
  });
});
