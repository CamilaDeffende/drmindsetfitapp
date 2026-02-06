import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL || "http://127.0.0.1:8080";

async function gotoAndWait(page: any, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("#root")).toBeVisible();
}

async function pickByVisibleText(page: any, triggerTextCandidates: string[], optionText: string) {
  for (const t of triggerTextCandidates) {
    const near = page.getByText(t, { exact: false }).first();
    if (await near.count()) {
      const container = near.locator("..").locator("..");
      const trigger = container
        .locator('button[role="combobox"], button[aria-haspopup="listbox"]')
        .first();

      if (await trigger.count()) {
        await trigger.click({ force: true });

        const opt = page.getByRole("option", { name: optionText }).first();
        if (await opt.count()) {
          await opt.click({ force: true });
          return;
        }

        const item = page.getByText(optionText, { exact: false }).first();
        if (await item.count()) {
          await item.click({ force: true });
          return;
        }
      }
    }
  }

  const anyTrigger = page.locator('button[role="combobox"], button[aria-haspopup="listbox"]').first();
  if (await anyTrigger.count()) {
    await anyTrigger.click({ force: true });
    const item = page.getByText(optionText, { exact: false }).first();
    await item.click({ force: true });
    return;
  }

  throw new Error("Não consegui abrir/select no componente de frequência. Ajustar locators.");
}

test("FAF: Moderadamente ativo persiste e aparece no Report", async ({ page }) => {
  await gotoAndWait(page, "/");
  await page.evaluate(() => localStorage.clear());

  await gotoAndWait(page, "/onboarding/step-1");
  const nome = page
    .locator('input[name="nomeCompleto"], input[placeholder*="Nome"], input[aria-label*="nome" i]')
    .first();
  if (await nome.count()) {
    await nome.fill("Teste MindsetFit");
  }
  const next1 = page.getByRole("button", { name: /continuar|próximo|avançar/i }).first();
  if (await next1.count()) await next1.click({ force: true });

  await gotoAndWait(page, "/onboarding/step-2");
  await pickByVisibleText(
    page,
    ["Frequência de atividade física semanal", "Frequência de atividade", "Atividade física semanal"],
    "Moderadamente ativo"
  );

  const next2 = page.getByRole("button", { name: /continuar|próximo|avançar/i }).first();
  if (await next2.count()) await next2.click({ force: true });

  await gotoAndWait(page, "/onboarding/step-3");

  const lsDump = await page.evaluate(() => JSON.stringify(localStorage));
  expect(lsDump).toContain("moderadamente_ativo");

  await gotoAndWait(page, "/report");
  await expect(page.getByText(/Moderadamente ativo/i)).toBeVisible();
});
