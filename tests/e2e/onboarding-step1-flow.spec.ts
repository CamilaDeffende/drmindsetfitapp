import { test, expect, type Page, type Locator } from "@playwright/test";

async function fillSexoMasculino(page: Page) {
  const ok = await page.locator("select").evaluateAll((els) => {
    for (const node of els) {
      const el = node as HTMLSelectElement;
      const options = Array.from(el.options || []);
      const hasMasc = options.some(
        (o) => /masculino/i.test(o.text) || String(o.value).toLowerCase() === "masculino"
      );
      if (hasMasc) {
        el.value = "masculino";
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
    }
    return false;
  });

  if (!ok) {
    const trigger = page.getByRole("combobox", { name: /sexo biológico/i }).first();
    await trigger.click();
    await page.getByRole("option", { name: /masculino/i }).first().click();
  }
}

async function getStepContinue(page: Page): Promise<Locator> {
  const scoped = page
    .getByTestId("mf-step-root")
    .getByRole("button", { name: /continuar|próximo|avançar/i })
    .first();

  if (await scoped.count()) return scoped;

  return page.getByTestId("onboarding-next");
}

test("onboarding step-1: fill nomeCompleto and advance (robust)", async ({ page }) => {
  await page.goto("/onboarding/step-1");

  await page.getByLabel(/nome completo/i).fill("Luiz Henrique Alexandre");
  await fillSexoMasculino(page);
  await page.getByRole("spinbutton", { name: /^idade$/i }).fill("27");
  await page.getByRole("spinbutton", { name: /altura \(cm\)/i }).fill("179");
  await page.getByRole("spinbutton", { name: /peso \(kg\)/i }).fill("82");

  await page.getByRole("button", { name: /hipertrofia|performance|emagrecimento/i }).first().click();

  const nextBtn = await getStepContinue(page);
  await expect(nextBtn).toBeEnabled();
  await nextBtn.click();

  await expect(page).not.toHaveURL(/\/onboarding\/step-1\b/, { timeout: 30000 });
  await expect(page).toHaveURL(/\/onboarding\/step-2\b/, { timeout: 30000 });
});
