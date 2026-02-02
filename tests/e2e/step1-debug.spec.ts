import { test, expect } from "@playwright/test";
import fs from "fs";

test("step-1 debug", async ({ page }) => {
  const out = process.env.OUT_DIR || ".scan/step1_debug_tmp";
  fs.mkdirSync(out, { recursive: true });

  const logs: string[] = [];
  page.on("console", (m) => logs.push(`[console:${m.type()}] ${m.text()}`));
  page.on("pageerror", (err) => logs.push(`[pageerror] ${String((err as any)?.stack || err)}`));

  await page.goto("http://127.0.0.1:8080/onboarding/step-1", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  await page.screenshot({ path: `${out}/step1.png`, fullPage: true });

  const html = await page.locator("body").innerHTML().catch(() => "");
  const text = await page.locator("body").innerText().catch(() => "");
  const elCount = await page.locator("*").count().catch(() => -1);

  fs.writeFileSync(`${out}/browser.log`, logs.join("\n"), "utf8");
  fs.writeFileSync(`${out}/body.html.head.txt`, html.slice(0, 4000), "utf8");
  fs.writeFileSync(`${out}/body.text.head.txt`, text.slice(0, 1200), "utf8");
  fs.writeFileSync(`${out}/metrics.txt`, `elCount=${elCount}\ntextLen=${text.length}\nhtmlLen=${html.length}\n`, "utf8");

  expect(true).toBeTruthy();
});
