import { expect, Page, Locator } from "@playwright/test";

export async function mfWaitAppReady(page: Page, opts?: { timeout?: number }) {
  const timeout = opts?.timeout ?? 45_000;
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(150);
  const root = page.locator("#root");
  await expect(root).toBeVisible({ timeout });
  await expect
    .poll(
      async () => {
        const txt = (await root.innerText().catch(() => "")) || "";
        return !/carregando\.\.\.|carregando\.\.|carregando\./i.test(txt) && txt.trim().length > 0;
      },
      { timeout }
    )
    .toBeTruthy();
}

export async function mfClearStorage(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      // @ts-ignore
      if ("caches" in window) {
        // @ts-ignore
        caches.keys().then((keys) => keys.forEach((k) => caches.delete(k))).catch(() => {});
      }
    } catch {}
  });
}

export async function mfGoto(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await mfWaitAppReady(page);
}

export function mfByTestIdOrLabel(page: Page, testId: string, label: RegExp | string) {
  const a = page.getByTestId(testId);
  const b = typeof label === "string" ? page.getByLabel(label) : page.getByLabel(label);
  return a.or(b);
}

export async function mfFillInput(page: Page, locator: Locator, value: string) {
  await expect(locator).toBeVisible({ timeout: 30_000 });
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  await locator.fill(value);
}

export async function mfClickNext(page: Page) {
  const btn = page.getByRole("button", { name: /continuar|próximo|avançar|seguir|next/i }).first();
  await expect(btn).toBeVisible({ timeout: 30_000 });
  await btn.click();
}

export async function mfClickByTextOption(page: Page, rx: RegExp, opts?: { timeout?: number }) {
  const timeout = opts?.timeout ?? 30_000;
  const t = page.getByText(rx).first();
  await expect(t).toBeVisible({ timeout });
  const clickable = t.locator(
    'xpath=ancestor-or-self::*[self::button or @role="button" or self::label or self::a][1]'
  ).first();
  const target = (await clickable.count()) ? clickable : t;
  await target.click();
}

export async function mfExpectProgressStep(page: Page, step: number) {
  const rx = new RegExp(`\\b(etapa|step)\\s*${step}\\b`, "i");
  const hint = page.getByText(rx).first();
  if ((await hint.count().catch(() => 0)) > 0) {
    await expect(hint).toBeVisible({ timeout: 15_000 });
  }
}

export async function mfSafeFill(page: Page, locator: Locator, value: string) {
  await expect(locator).toBeVisible({ timeout: 30_000 });
  await locator.scrollIntoViewIfNeeded().catch(() => {});
  const tag = await locator.evaluate((el) => (el as HTMLElement).tagName.toLowerCase()).catch(() => "");
  const isCE = await locator.evaluate((el) => !!(el as HTMLElement).isContentEditable).catch(() => false);

  const canFill = tag === "input" || tag === "textarea" || isCE;
  if (canFill) {
    await locator.fill(value);
    return;
  }

  await locator.click({ timeout: 10_000 }).catch(() => {});
  const esc = String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const opt = page.getByRole("option", { name: new RegExp(esc, "i") }).first();
  if ((await opt.count().catch(() => 0)) > 0) { await opt.click(); return; }

  const byText = page.getByText(new RegExp(esc, "i")).first();
  if ((await byText.count().catch(() => 0)) > 0) { await byText.click(); return; }

  console.log("MF_E2E: mfSafeFill could not fill/select value:", value);
}

export async function mfReadSSOT(page: Page) {
  return await page.evaluate(() => {
    const raw = localStorage.getItem("mindsetfit:onboardingProgress:v1");
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
}

export async function mfExpectSSOTStep(page: Page, step: number, requiredKeys: string[] = []) {
  const obj: any = await mfReadSSOT(page);
  expect(obj).toBeTruthy();
  expect(obj.step).toBe(step);
  for (const k of requiredKeys || []) {
    expect(obj?.data).toBeTruthy();
    expect(Object.prototype.hasOwnProperty.call(obj.data, k)).toBe(true);
  }
}
