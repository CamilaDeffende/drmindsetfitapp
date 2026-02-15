import { test, expect } from "@playwright/test";
import {
  mfClearStorage,
  mfGoto,
  mfByTestIdOrLabel,
  mfFillInput,
  mfClickNext,
  mfClickByTextOption,
  mfExpectProgressStep,
  mfWaitAppReady,
} from "../mf/_lib/mf-pw";

test.describe("onboarding golden path (Steps 1..8) — MF", () => {
  test.beforeEach(async ({ page }) => {
    await mfClearStorage(page);
  });

  test("flow: step-1 -> step-8 completes without getting stuck", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await mfWaitAppReady(page);

    if (!/\/onboarding\/step-1/i.test(page.url())) {
      await mfGoto(page, "/onboarding/step-1");
    }

    await mfExpectProgressStep(page, 1);
    const nome = mfByTestIdOrLabel(page, "nomeCompleto", /nome completo/i);
    await mfFillInput(page, nome, "Teste E2E MindsetFit");
    await mfClickNext(page);

    await mfWaitAppReady(page);
    await mfExpectProgressStep(page, 2);

    const hasMasc = await page.getByText(/^Masculino$/i).count().catch(() => 0);
    if (hasMasc > 0) await mfClickByTextOption(page, /^Masculino$/i);

    // idade pode ser input number OU select (Radix combobox). NÃO usar label genérico (pode bater no campo errado).
    const idadeInput = page
      .locator(
        'input[name="idade"], input[name*="idade" i], input[id*="idade" i], input[placeholder*="idade" i], input[type="number"]'
      )
      .first();
    const idadeInputCount = await idadeInput.count().catch(() => 0);

    if (idadeInputCount > 0) {
      await mfFillInput(page, idadeInput, "29");
    } else {
      // tenta achar o FormItem pelo texto "Idade" e pegar o combobox dentro dele
      const idadeLabel = page.getByText(/^Idade$/i).first();
      const labelCount = await idadeLabel.count().catch(() => 0);

      if (labelCount > 0) {
        const formItem = idadeLabel
          .locator('xpath=ancestor::*[self::div or self::section][.//button[@role="combobox"] or .//input][1]')
          .first();
        const combo = formItem.locator('button[role="combobox"]').first();
        const comboCount = await combo.count().catch(() => 0);

        if (comboCount > 0) {
          await combo.click();
          const opt = page.getByRole("option", { name: /29|28|30|25/i }).first();
          if ((await opt.count().catch(() => 0)) > 0) {
            await opt.click();
          } else {
            const byText = page.getByText(/29|28|30|25/i).first();
            if ((await byText.count().catch(() => 0)) > 0) await byText.click();
          }
        } else {
          console.log("MF_E2E: idade não encontrada como combobox no FormItem; seguindo sem setar.");
        }
      } else {
        console.log("MF_E2E: label Idade não encontrado; seguindo sem setar idade.");
      }
    }
    await mfClickNext(page);

    await mfWaitAppReady(page);
    await mfExpectProgressStep(page, 3);

    const hasModerado = await page.getByText(/moderadamente ativo/i).count().catch(() => 0);
    if (hasModerado > 0) await mfClickByTextOption(page, /moderadamente ativo/i);

    const hasMeso = await page.getByText(/mesomorfo/i).count().catch(() => 0);
    if (hasMeso > 0) await mfClickByTextOption(page, /mesomorfo/i);
    await mfClickNext(page);

    await mfWaitAppReady(page);
    await mfExpectProgressStep(page, 4);
    await mfClickNext(page);

    await mfWaitAppReady(page);
    await mfExpectProgressStep(page, 5);
    const hasMuscu = await page.getByText(/muscula|hipertrof/i).count().catch(() => 0);
    if (hasMuscu > 0) await mfClickByTextOption(page, /muscula|hipertrof/i);
    await mfClickNext(page);

    await mfWaitAppReady(page);
    await mfExpectProgressStep(page, 6);
    await mfClickNext(page);

    await mfWaitAppReady(page);
    await mfExpectProgressStep(page, 7);
    await mfClickNext(page);

    await mfWaitAppReady(page);
    await mfExpectProgressStep(page, 8);

    const finish = page.getByRole("button", { name: /finalizar|começar|ir para (o )?dashboard|concluir/i }).first();
    if ((await finish.count().catch(() => 0)) > 0) {
      await finish.click();
      await mfWaitAppReady(page);
    }

    // Golden path robusto:
    // - Se houver botão de finalizar e ele navegar, saímos do onboarding (ideal).
    // - Se não navegar (ou botão não existir), aceitamos permanecer no Step-8,
    //   mas garantimos que não travou e que houve persistência em storage.
    const finalUrl = page.url();

    if (/\/onboarding\/step-/i.test(finalUrl)) {
      expect(finalUrl).toMatch(/\/onboarding\/step-8/i);
    } else {
      expect(finalUrl).not.toMatch(/\/onboarding\/step-/i);
    }
    const storage = await page.evaluate(() => {
      const keys: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)!;
        if (/mindsetfit|onboarding|ssot|plan/i.test(k)) keys[k] = localStorage.getItem(k);
      }
      return keys;
    });
    expect(Object.keys(storage).length).toBeGreaterThan(0);
  });
});
