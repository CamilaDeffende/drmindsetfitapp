import { test, expect } from "@playwright/test";
import fs from "fs";

test("probe /onboarding/step-1 blank screen", async ({ page }) => {
  const outDir = process.env.OUT_DIR || ".scan/_probe_out";
  fs.mkdirSync(outDir, { recursive: true });

  const logs: string[] = [];
  page.on("console", (msg) => logs.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => logs.push(`[pageerror] ${String((err as any)?.stack || err)}`));
  page.on("requestfailed", (req) =>
    logs.push(`[requestfailed] ${req.method()} ${req.url()} :: ${req.failure()?.errorText}`)
  );

  await page.goto("http://127.0.0.1:8080/onboarding/step-1", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  await page.screenshot({ path: `${outDir}/step1.png`, fullPage: true });

  const bodyText = (await page.locator("body").innerText().catch(() => "")) || "";
  logs.push(`[bodyText.len] ${bodyText.length}`);

  fs.writeFileSync(`${outDir}/browser.log`, logs.join("\n"), "utf8");
  expect(true).toBeTruthy();
});
