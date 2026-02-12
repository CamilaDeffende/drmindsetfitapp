import { test, expect } from "@playwright/test";

test("diagnose /onboarding/step-1: console + pageerror + root html", async ({ page }) => {
  const logs: string[] = [];
  const errors: string[] = [];

  page.on("console", (msg) => {
    logs.push(`[console.${msg.type()}] ${msg.text()}`);
  });

  page.on("pageerror", (err) => {
    errors.push(`[pageerror] ${String(err?.message || err)}`);
  });

  page.on("requestfailed", (req) => {
    errors.push(`[requestfailed] ${req.url()} :: ${req.failure()?.errorText || "unknown"}`);
  });

  await page.goto("http://localhost:8080/onboarding/step-1", { waitUntil: "domcontentloaded" });

  const root = page.locator("#root");
await expect(root).toBeAttached({ timeout: 20000 });

  // Boot sentinel prova que o JS rodou
// dá um tempo pra Router/guards rodarem
  await page.waitForTimeout(1500);

  const html = await root.innerHTML();
  expect(html.length).toBeGreaterThan(80);

  const url = page.url();

  await page.screenshot({ path: "test-results/onboarding-step1-diagnose.png", fullPage: true });

  console.log("=== URL FINAL ===");
  console.log(url);
  console.log("=== root.innerHTML length ===");
  console.log(html.trim().length);

  console.log("=== CONSOLE LOGS (first 60) ===");
  for (const l of logs.slice(0, 60)) console.log(l);

  console.log("=== ERRORS (first 60) ===");
  for (const e of errors.slice(0, 60)) console.log(e);

  // Não falha aqui — é só diagnóstico
  expect(true).toBeTruthy();
});
