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
