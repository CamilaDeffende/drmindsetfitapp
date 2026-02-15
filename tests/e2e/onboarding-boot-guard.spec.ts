import { test, expect } from "@playwright/test";
import { mfClearStorage, mfWaitAppReady } from "../mf/_lib/mf-pw";

test("boot guard: /onboarding/step-1 renders interactive UI (not stuck loading)", async ({ page }) => {
  await mfClearStorage(page);
  await page.goto("/onboarding/step-1", { waitUntil: "domcontentloaded" });
  await mfWaitAppReady(page, { timeout: 45_000 });

  const root = page.locator("#root");
  const html = await root.innerHTML();
  expect(html.length).toBeGreaterThan(250);
  const txt = await root.innerText().catch(() => "");
  expect(txt).not.toMatch(/carregando\.\.\./i);
});
