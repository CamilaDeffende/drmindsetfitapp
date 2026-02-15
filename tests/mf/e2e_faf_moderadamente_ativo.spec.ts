import { test, expect } from "@playwright/test";

async function mfClickOptionByText(page: any, rx: RegExp) {
  // pega o nó que contém o texto
  const t = page.getByText(rx).first();
  await t.waitFor({ state: "visible", timeout: 20000 });

  // sobe para um alvo clicável real (button / role=button / a / label)
  const clickable = t.locator(
    "xpath=ancestor-or-self::*[self::button or @role='button' or self::a or self::label][1]"
  );

  const target = (await clickable.count().catch(() => 0)) ? clickable.first() : t;

  // tentativa normal
  try {
    await target.click({ timeout: 8000 });
    return;
  } catch (e: any) {
    const msg = String(e && (e.message || e));
    // se houve intercept/camada, tenta force
    try {
      await target.click({ timeout: 8000, force: true });
      return;
    } catch {}
    // fallback final: click via DOM
    try {
      await target.evaluate((el: any) => (el && el.click ? el.click() : null));
      return;
    } catch {}

    throw new Error("MF: falha ao clicar opção por texto " + String(rx) + " | last=" + msg);
  }
}

/**
 * MF E2E — FAF Moderadamente ativo (SSOT)
 * Regra: Persistência em localStorage é OBRIGATÓRIA.
 * Report/rotas internas: NÃO são assertadas (podem ser guarded).
 */

async function mfFindNextButton(page: any) {
  const byTestId = page.getByTestId("onboarding-next");
  if (await byTestId.count().catch(() => 0)) return byTestId.first();

  const byOld = page.getByTestId("mf-next-step");
  if (await byOld.count().catch(() => 0)) return byOld.first();

  // fallback por texto (PT-BR)
  const byText = page.getByRole("button", { name: /continuar|próxima|proxima/i });
  if (await byText.count().catch(() => 0)) return byText.first();

  return null;
}

async function mfClickNext(page: any) {
  const btn = await mfFindNextButton(page);
  if (!btn) {
    // debug básico
    const buttons = await page
      .locator("button")
      .evaluateAll((els: any[]) =>
        els.slice(0, 25).map((e) => ({
          text: (e.textContent || "").trim(),
          testid: e.getAttribute("data-testid"),
          disabled: !!e.disabled,
        }))
      )
      .catch(() => []);
    console.log("MF_DEBUG_URL:", page.url());
    console.log("MF_DEBUG_buttons_top25:", JSON.stringify(buttons, null, 2));
    throw new Error("MF: não encontrei botão onboarding-next/mf-next-step (Continuar/Próxima etapa)");
  }
  await btn.click({ timeout: 15000 });
}

async function mfReachFAF(page: any) {
  // Vai até o step onde existe o select do FAF (mf-faf-select)
  const faf = page.getByTestId("mf-faf-select").first();
  for (let i = 0; i < 10; i++) {
    if (await faf.isVisible().catch(() => false)) return;
    await mfClickNext(page);
    await page.waitForTimeout(350);
  }
  throw new Error("MF: não consegui chegar no passo do FAF (mf-faf-select) após avançar.");
}

async function mfSelectFAFModerado(page: any) {
  // ✅ Seleção correta para <select>: use selectOption (não clicar em <option>)
  // 1) tenta por âncora/testid (se existir no app)
  const directCandidates = [
    page.getByTestId("mf-faf-select"),
    page.getByTestId("nivelAtividadeSemanal"),
    page.getByTestId("onboarding-faf-select"),
  ];

  // 2) tenta localizar um <select> que contenha a opção de "Moderadamente ativo"
  const byOptions = page.locator("select").filter({
    has: page.locator("option", { hasText: /Moderadamente ativo/i }),
  });

  const all = [...directCandidates, byOptions.first()];

  for (const sel of all) {
    try {
      // garante que existe
      const cnt = await sel.count().catch(() => 0);
      if (!cnt) continue;

      // tenta por value (ideal)
      await sel.selectOption({ value: "moderadamente_ativo" }, { timeout: 8000 }).catch(async () => {
        // fallback por label (quando value muda)
        await sel.selectOption({ label: /Moderadamente ativo/i }, { timeout: 8000 });
      });

      // sanity: espera a opção aplicada (best-effort)
      await sel.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
      return;
    } catch {
      // tenta próximo candidato
    }
  }

  // 3) fallback final: encontra select via DOM e força value + change
  const ok = await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll("select"));
    const target = selects.find((s) =>
      Array.from(s.querySelectorAll("option")).some((o) => /moderadamente ativo/i.test(o.textContent || ""))
    );
    if (!target) return false;

    // tenta value conhecido
    const optByValue = Array.from(target.options).find((o) => o.value === "moderadamente_ativo");
    const optByText = Array.from(target.options).find((o) => /moderadamente ativo/i.test(o.textContent || ""));

    const opt = optByValue || optByText;
    if (!opt) return false;

    target.value = opt.value;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  });

  if (!ok) throw new Error("MF: não consegui selecionar FAF Moderadamente ativo (selectOption falhou e fallback DOM não achou select).");
}


async function mfAssertFAFPersisted(page: any, expected = "moderadamente_ativo") {
  // Polling SSOT localStorage
  const candidates = [
    { k: "mindsetfit:onboardingProgress:v1", rx: /moderadamente_ativo/ },
    { k: "drmindsetfit_state", rx: /nivelAtividadeSemanal"\s*:\s*"moderadamente_ativo|nivelAtividadeSemanal\\":\\"moderadamente_ativo/ },
    { k: "mf:onboarding:draft:v1", rx: /moderadamente_ativo/ },
    { k: "mf:onboarding:v1", rx: /moderadamente_ativo/ },
  ];

  const deadline = Date.now() + 12000;
  while (Date.now() < deadline) {
    const ok = await page.evaluate((cands: any[]) => {
      try {
        for (const c of cands) {
          const v = localStorage.getItem(c.k) || "";
          if (new RegExp(c.rx).test(v)) return { ok: true, hit: c.k, sample: v.slice(0, 220) };
        }

        // jsonpath extra: mindsetfit:onboardingProgress:v1
        const raw = localStorage.getItem("mindsetfit:onboardingProgress:v1") || "";
        if (raw) {
          try {
            const j = JSON.parse(raw);
            const val = j?.data?.nivelAtividadeSemanal;
            if (String(val) === "moderadamente_ativo") return { ok: true, hit: "mindsetfit:onboardingProgress:v1:json", sample: String(val) };
          } catch {}
        }

        return { ok: false };
      } catch (e: any) {
        return { ok: false, err: String(e && e.message || e) };
      }
    }, candidates);

    if (ok && (ok as any).ok) {
      console.log("✅ MF: FAF persistido OK:", (ok as any).hit, (ok as any).sample || "");
      return;
    }

    await page.waitForTimeout(300);
  }

  // dump forense
  const storage = await page.evaluate(() => {
    const out: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) out[k] = localStorage.getItem(k) || "";
    }
    return out;
  });

  console.log("MF_PERSIST_FAIL_KEYS:", Object.keys(storage));
  for (const k of Object.keys(storage)) {
    console.log("MF_PERSIST_FAIL_SAMPLE:", k, (storage[k] || "").slice(0, 240));
  }

  throw new Error(`MF: FAF NÃO persistiu no localStorage (esperado ${expected}).`);
}

test.describe("FAF", () => {
  test("Moderadamente ativo persiste (SSOT)", async ({ page }) => {
    await page.goto("/onboarding/step-1", { waitUntil: "domcontentloaded" });

    // Step-1 mínimo (baseado nos botões que você logou: Masculino + Hipertrofia + Continuar)
    await mfClickOptionByText(page, /^Masculino$/i);
await mfClickOptionByText(page, /^Hipertrofia$/i);
await mfClickNext(page);

    // Agora avança até o passo onde tem o select do FAF
    await mfReachFAF(page);

    // Seleciona Moderadamente ativo
    await mfSelectFAFModerado(page);

    // Avança mais uma vez para garantir persistência (se o app persistir no onChange, ainda ok)
    await mfClickNext(page).catch(() => {});

    // SSOT obrigatório
    await mfAssertFAFPersisted(page);
    await expect(true).toBeTruthy();
  });
});
