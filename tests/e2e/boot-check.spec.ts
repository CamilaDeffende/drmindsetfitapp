import { test, expect } from "@playwright/test";

test("boot-check: JS runs and marks #root", async ({ page }) => {
  // entra na home (menos chance de guard)
  await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" });

  const root = page.locator("#root");
  await expect(root).toBeAttached({ timeout: 20000 });

  // Sentinel do main.tsx: prova que o JS do app rodou no navegador do Playwright
  await expect(root).toHaveAttribute("data-mf-boot", "1", { timeout: 20000 });
});
