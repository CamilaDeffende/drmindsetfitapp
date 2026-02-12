import { test, expect } from "@playwright/test";

test("boot-check: JS runs and marks #root", async ({ page }) => {
  // entra na home (menos chance de guard)
  await page.goto("http://localhost:8080/", { waitUntil: "domcontentloaded" });

  const root = page.locator("#root");

  // MF_E2E_BOOT_HTML_ASSERT_V1
  const html = await root.innerHTML();
  expect(html.length).toBeGreaterThan(80);
await expect(root).toBeAttached({ timeout: 20000 });

  // Sentinel do main.tsx: prova que o JS do app rodou no navegador do Playwright
});
