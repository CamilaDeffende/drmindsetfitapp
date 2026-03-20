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

async function fillStep1(page: Page) {
  await page.goto("/onboarding/step-1");

  await expect(
    page.getByRole("heading", { name: /objetivo e perfil/i })
  ).toBeVisible();

  await page.getByLabel(/nome completo/i).fill("Teste E2E MindsetFit");
  await fillSexoMasculino(page);
  await page.getByRole("spinbutton", { name: /^idade$/i }).fill("27");
  await page.getByRole("spinbutton", { name: /altura \(cm\)/i }).fill("179");
  await page.getByRole("spinbutton", { name: /peso \(kg\)/i }).fill("82");

  const objetivo = page.getByRole("button", { name: /hipertrofia|performance|emagrecimento/i }).first();
  await objetivo.click();
}

test("Onboarding Step-1: DOM, nomeCompleto, avançar", async ({ page }) => {
  await fillStep1(page);

  const btn = await getStepContinue(page);
  await expect(btn).toBeVisible();
  await expect(btn).toBeEnabled();
  await btn.click();

  await expect(page).toHaveURL(/\/onboarding\/step-2\b/, { timeout: 30000 });
});
