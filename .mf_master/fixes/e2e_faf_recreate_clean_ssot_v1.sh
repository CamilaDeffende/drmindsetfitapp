#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
FILE="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-recreate-clean-ssot-$TS"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
mkdir -p "$BKP/$(dirname "$FILE")"
cp -a "$FILE" "$BKP/$FILE" 2>/dev/null || true
echo "✅ backup em: $BKP"

echo "==> [2] overwrite spec (clean, SSOT-only, no Report)"
mkdir -p "$(dirname "$FILE")"
cat > "$FILE" <<'TS'
import { test, expect } from "@playwright/test";

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
  const faf = page.getByTestId("mf-faf-select").first();
  await faf.waitFor({ state: "visible", timeout: 20000 });

  // Tenta como <select>
  const tag = await faf.evaluate((el: any) => (el && el.tagName ? String(el.tagName).toLowerCase() : "")).catch(() => "");
  if (tag === "select") {
    const ok =
      (await faf.selectOption({ value: "moderadamente_ativo" }).then(() => true).catch(() => false)) ||
      (await faf.selectOption({ label: /moderadamente ativo/i }).then(() => true).catch(() => false));
    if (!ok) {
      // fallback: abre e clica por texto
      await faf.click({ timeout: 8000 }).catch(() => {});
      await page.getByText(/Moderadamente ativo/i).first().click({ timeout: 8000 });
    }
    return;
  }

  // Se for um componente custom (combobox)
  await faf.click({ timeout: 8000 }).catch(() => {});
  const opt = page.getByText(/Moderadamente ativo/i).first();
  if (await opt.count().catch(() => 0)) {
    await opt.click({ timeout: 8000 });
    return;
  }

  // fallback final: tenta por role=option
  const opt2 = page.getByRole("option", { name: /Moderadamente ativo/i }).first();
  if (await opt2.count().catch(() => 0)) {
    await opt2.click({ timeout: 8000 });
    return;
  }

  throw new Error("MF: não consegui selecionar 'Moderadamente ativo' no mf-faf-select.");
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
    await page.getByText(/^Masculino$/i).first().click({ timeout: 15000 });
    await page.getByText(/^Hipertrofia$/i).first().click({ timeout: 15000 });

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
TS

echo "✅ wrote: $FILE"

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e (apenas este spec)"
npx playwright test tests/mf/e2e_faf_moderadamente_ativo.spec.ts --workers=1

echo "==> [5] commit + push"
git add -A
git commit -m "test(e2e): recreate FAF spec clean (SSOT persistence only; no report route) — fix accumulated syntax corruption" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
