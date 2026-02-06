import { test, expect } from "@playwright/test";

const BASE = process.env.PW_BASE_URL || "http://127.0.0.1:8080";

async function waitRootAndLoading(page: any) {
  await page.locator("#root").waitFor({ state: "attached", timeout: 20000 });

  const loading = page.locator('[data-testid="app-loading"]');
  if (await loading.count()) {
    await expect(loading).toBeVisible({ timeout: 20000 });
    await expect(loading).toBeHidden({ timeout: 30000 });
  }
}

async function goto(page: any, path: string) {
  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  await waitRootAndLoading(page);
}

async function clickNext(page: any) {
  const nextBtn = page
    .getByRole("button", { name: /continuar|próximo|proximo|avançar|avancar/i })
    .first();
  await expect(nextBtn).toBeVisible({ timeout: 30000 });
  await nextBtn.click();
}

async function pickFafModeradamenteAtivo(page: any) {
  // 1) texto/card clicável
  const txt = page.getByText(/Moderadamente ativo/i).first();
  if (await txt.count()) {
    await txt.click({ force: true });
    return;
  }

  // 2) radio
  const radio = page.getByRole("radio", { name: /Moderadamente ativo/i }).first();
  if (await radio.count()) {
    await radio.click({ force: true });
    return;
  }

  // 3) select/combobox
  const trigger = page.locator('button[role="combobox"], button[aria-haspopup="listbox"]').first();
  if (await trigger.count()) {
    await trigger.click({ force: true });
    const opt = page.getByRole("option", { name: /Moderadamente ativo/i }).first();
    if (await opt.count()) {
      await opt.click({ force: true });
      return;
    }
    const item = page.getByText(/Moderadamente ativo/i).first();
    if (await item.count()) {
      await item.click({ force: true });
      return;
    }
  }

  throw new Error("Não consegui selecionar 'Moderadamente ativo' no Step-2 (UI diferente do esperado).");
}

test("FAF: Moderadamente ativo persiste e aparece no Report", async ({ page }) => {
  // ✅ Seed SSOT do guard (src/lib/onboardingProgress.ts)
  await page.addInitScript(() => {
    try {
      const seed = { step: 1, data: {}, updatedAt: Date.now() };
      localStorage.setItem("mindsetfit:onboardingProgress:v1", JSON.stringify(seed));

      // compat para bridges/fallbacks (não interfere no guard)
      localStorage.setItem(
        "mf:onboardingProgress:v1",
        JSON.stringify({
          modalidades: [],
          atividadesFisicas: [],
          nivel: "iniciante",
          intensidade: "moderada",
          updatedAt: Date.now(),
        })
      );
      localStorage.setItem(
        "mf:onboarding:progress:v1",
        JSON.stringify({
          modalidades: [],
          atividadesFisicas: [],
          nivel: "iniciante",
          intensidade: "moderada",
          updatedAt: Date.now(),
        })
      );
    } catch {}
  });

  // inicia app
  await goto(page, "/onboarding/step-1");

  // se o fallback aparecer, falha imediatamente com msg clara
  await expect(page.getByText(/step não pôde ser renderizado|não pôde ser renderizado/i)).toHaveCount(0);

  // Step-1: nome
  let field = page.locator('input[name="nomeCompleto"]');
  if (await field.count() === 0) field = page.getByPlaceholder(/nome completo/i);
  if (await field.count() === 0) field = page.locator("#root input").first();

  // PROBE Step-1: se não houver input, dumpa HTML + botões visíveis (ajuste de fluxo/locator)
  if (await field.count() === 0) {
    const url = page.url();
    const rootHtml = await page.locator("#root").innerHTML().catch(() => "");
    const buttons = await page
      .locator("button")
      .evaluateAll((els: any[]) =>
        els.slice(0, 25).map((e) => (e.textContent || "").trim()).filter(Boolean)
      )
      .catch(() => []);
    console.log("MF_PROBE_STEP1_URL:", url);
    console.log("MF_PROBE_STEP1_BUTTONS:", JSON.stringify(buttons));
    console.log("MF_PROBE_STEP1_ROOT_HTML_HEAD:", String(rootHtml).slice(0, 1200));
  }



  await expect(field).toBeVisible({ timeout: 30000 });
  await field.fill("Luiz Henrique Alexandre");

  await clickNext(page);

  // Step-2
  if (!/\/onboarding\/step-2\b/i.test(page.url())) {
    await goto(page, "/onboarding/step-2");
  } else {
    await waitRootAndLoading(page);
  }

  await expect(page.getByText(/step não pôde ser renderizado|não pôde ser renderizado/i)).toHaveCount(0);

  await pickFafModeradamenteAtivo(page);
  await clickNext(page);

  // Step-3
  await expect(page).toHaveURL(/\/onboarding\/step-3\b/i, { timeout: 30000 });

  // Assert storage contém value
  const lsDump = await page.evaluate(() => JSON.stringify(localStorage));
  expect(lsDump).toContain("moderadamente_ativo");

  // Report
  await goto(page, "/report");
  await expect(page.getByText(/Moderadamente ativo/i)).toBeVisible();
});
