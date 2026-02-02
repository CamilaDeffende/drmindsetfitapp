import { test, expect } from "@playwright/test";
import fs from "fs";

test("domprobe step-1 (html + overlays + screenshot)", async ({ page }) => {
  const out = process.env.OUT_DIR || ".scan/_domprobe";
  fs.mkdirSync(out, { recursive: true });

  const logs: string[] = [];
  page.on("console", (msg) => logs.push(`[console:${msg.type()}] ${msg.text()}`));
  page.on("pageerror", (err) => logs.push(`[pageerror] ${String((err as any)?.stack || err)}`));

  await page.goto("http://127.0.0.1:8080/onboarding/step-1", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);

  await page.screenshot({ path: `${out}/step1.png`, fullPage: true });

  const bodyHTML = await page.locator("body").innerHTML().catch(() => "");
  const bodyText = await page.locator("body").innerText().catch(() => "");
  const elCount = await page.locator("*").count().catch(() => -1);

  // overlays comuns (tailwind): fixed inset-0 / absolute inset-0 / z-[9999]
  const overlayFixed = await page.locator("[class*=\"fixed\"][class*=\"inset-0\"], [class*=\"absolute\"][class*=\"inset-0\"], [class*=\"z-[999\"]").count().catch(() => -1);

  fs.writeFileSync(`${out}/browser.log`, logs.join("\n"), "utf8");
  fs.writeFileSync(`${out}/body.html.head.txt`, bodyHTML.slice(0, 2000), "utf8");
  fs.writeFileSync(`${out}/body.text.head.txt`, bodyText.slice(0, 800), "utf8");
  fs.writeFileSync(`${out}/metrics.txt`, `elCount=${elCount}\noverlayCandidates=${overlayFixed}\ntextLen=${bodyText.length}\nhtmlLen=${bodyHTML.length}\n`, "utf8");

  expect(true).toBeTruthy();
});
