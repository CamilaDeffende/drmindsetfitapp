import { expect, Page } from "@playwright/test";

/**
 * MF Waits — state-based waits (anti-flake)
 * Regra: nunca usar timeout fixo. Sempre esperar um sinal de prontidão.
 */
export async function waitAppBoot(page: Page) {
  // #root marcado pelo boot-check (se existir) OU presença do app shell
  const root = page.locator("#root");
  await expect(root).toBeVisible();
}

export async function waitHydrated(page: Page) {
  // Contrato recomendado: elemento data-testid="mf-hydrated"
  // Se ainda não existir na UI, não falha: apenas retorna.
  const hydrated = page.locator("[data-testid=\\"mf-hydrated\\"]");
  const count = await hydrated.count().catch(() => 0);
  if (count > 0) await expect(hydrated).toBeVisible();
}

export async function clickNext(page: Page) {
  const btn = page.locator("[data-testid=\\"mf-next\\"], button:has-text(\\"Próximo\\"), button:has-text(\\"Avançar\\")").first();
  await expect(btn).toBeVisible();
  await expect(btn).toBeEnabled();
  await btn.click();
}

export async function clickBack(page: Page) {
  const btn = page.locator("[data-testid=\\"mf-back\\"], button:has-text(\\"Voltar\\")").first();
  await expect(btn).toBeVisible();
  await expect(btn).toBeEnabled();
  await btn.click();
}
