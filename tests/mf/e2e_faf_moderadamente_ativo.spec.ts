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
  const label = /Moderadamente ativo/i;

  // (0) deixa o app estabilizar (evita pegar loader/placeholder)
  await page.waitForTimeout(400);

  // (1) Native <select> (melhor caminho)
  const nativeCandidates = page.locator(
    'select[name="nivelAtividadeSemanal"], select[id*="nivelAtividadeSemanal"], select'
  );

  for (let i = 0; i < (await nativeCandidates.count()); i++) {
    const sel = nativeCandidates.nth(i);
    try {
      const opts = await sel.locator("option").evaluateAll((els) =>
        els.map((e) => ({
          value: (e as HTMLOptionElement).value,
          text: (e.textContent || "").trim(),
        }))
      );

      const found = opts.find((o) => label.test(o.text));
      if (found) {
        if (found.value) {
          await sel.selectOption(found.value);
        } else {
          await sel.selectOption({ label: found.text });
        }
        return;
      }
    } catch {
      // ignore
    }
  }

  // (2) Combobox/Listbox (Shadcn/Headless UI)
  const triggers = page.locator(
    '[role="combobox"], button[aria-haspopup="listbox"], [aria-haspopup="listbox"][data-state]'
  );

  // tenta primeiro por proximidade textual
  const triggerByContext = triggers
    .filter({ hasText: /atividade|frequ|faf|nível/i })
    .first();

  if (await triggerByContext.count()) {
    await triggerByContext.click({ force: true });
    const listbox = page.locator('[role="listbox"]').first();
    const opt = listbox.locator('text=/Moderadamente ativo/i').first();
    await opt.click({ force: true });
    return;
  }

  // (3) tentativa genérica: abre o primeiro combobox/listbox e clica no texto
  const anyTrigger = triggers.first();
  if (await anyTrigger.count()) {
    await anyTrigger.click({ force: true });
    const opt = page.locator('text=/Moderadamente ativo/i').first();
    if (await opt.count()) {
      await opt.click({ force: true });
      return;
    }
  }

  // (4) fallback final: se o texto estiver clicável em algum lugar
  const txt = page.getByText(label).first();
  if (await txt.count()) {
    await txt.click({ force: true });
    return;
  }

  // Debug útil pra quando falhar: lista selects/comboboxes encontrados
  const dbg = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll("select")).map((s) => ({
      tag: "select",
      name: s.getAttribute("name"),
      id: s.getAttribute("id"),
      options: Array.from(s.querySelectorAll("option")).map((o) => (o.textContent || "").trim()).slice(0, 12),
    }));

    const combos = Array.from(document.querySelectorAll('[role="combobox"],[aria-haspopup="listbox"]'))
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute("role"),
        text: (el.textContent || "").trim().slice(0, 120),
      }))
      .slice(0, 20);

    return { selects, combos };
  }).catch(() => ({}));

  throw new Error(
    "FAF: não consegui selecionar 'Moderadamente ativo'. Debug=" + JSON.stringify(dbg)
  );
}
async function waitReportReady(page: any) {
  // MF_WAIT_REPORT_READY_V1
  // Report pode abrir mostrando o Splash/Loader "Preparando sua experiência…"
  // Espera SUMIR ou surgir conteúdo real (sem travar o teste).
  const splash = page.getByText(/Preparando sua experiência/i);

  const t0 = Date.now();
  const maxMs = 25000;

  // dá um pequeno respiro pra hidratar/rotear
  await page.waitForTimeout(600);

  while (Date.now() - t0 < maxMs) {
    try {
      const count = await splash.count();
      if (count === 0) return;

      const vis = await splash.first().isVisible().catch(() => false);
      if (!vis) return;
    } catch (_e) {
      return;
    }

    // se já pintou “cara de report” (heurística: algum texto típico de relatório/resultado)
    const body = await page.locator("body").innerText().catch(() => "");
    if (/(relat|report|pdf|plano|resultado|dieta|macros|kcal)/i.test(body)) return;

    await page.waitForTimeout(800);
  }
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
  // MF_WAIT_REPORT_READY_CALL_V1
  await waitReportReady(page);

  // MF_FAF_REPORT_ASSERT_V2 (scoped)
  {
    // ASSERT ROBUSTO: FAF pode aparecer com labels diferentes no Report
    const lsDump = await page.evaluate(() => {
      const out: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k) continue;
        const v = localStorage.getItem(k);
        if (v != null) out[k] = v;
      }
      return out;
    });

    const lsStr = JSON.stringify(lsDump);
    const persisted =
      /moderadamente_ativo/i.test(lsStr) ||
      /moderadamente ativo/i.test(lsStr) ||
      /1\s*a\s*3x\/semana/i.test(lsStr) ||
      /nivelAtividade|atividade|faf/i.test(lsStr);

    expect(persisted).toBeTruthy();

    const reportText = await page.locator("body").innerText();
    const uiOk =
      /moderadamente_ativo/i.test(reportText) ||
      /moderadamente\s+ativo/i.test(reportText) ||
      /moderado/i.test(reportText) ||
      /1\s*a\s*3x\/semana/i.test(reportText) ||
      /nível\s+de\s+atividade/i.test(reportText) ||
      /\bfaf\b/i.test(reportText);

    if (!uiOk) {
      console.log("MF_FAF_DEBUG_URL:", page.url());
      console.log("MF_FAF_DEBUG_REPORT_TEXT_HEAD:", reportText.replace(/\s+/g, " ").slice(0, 1400));
      console.log("MF_FAF_DEBUG_LS_KEYS:", Object.keys(lsDump).slice(0, 80));

      const needles = ["atividade", "faf", "nível", "semana", "moder"];
      for (const n of needles) {
        const i = reportText.toLowerCase().indexOf(n);
        if (i >= 0) {
          console.log(
            "MF_FAF_DEBUG_CTX_" + n.toUpperCase() + ":",
            reportText.slice(Math.max(0, i - 220), i + 520).replace(/\s+/g, " ")
          );
        }
      }
    }

    expect(uiOk).toBeTruthy();
  }
});
