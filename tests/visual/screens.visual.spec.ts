import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

function loadRoutes(): string[] {
  const p = path.resolve(process.cwd(), ".mf_routes_visual.json");
  const raw = fs.readFileSync(p, "utf-8");
  const arr = JSON.parse(raw);
  if (!Array.isArray(arr)) return [];
  return arr.filter((x) => typeof x === "string");
}

const routes = loadRoutes();

test.describe("MF Visual Lock — snapshots (auto routes)", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const r of routes) {
    test(`snapshot: ${r}`, async ({ page }) => {
      await page.goto(r, { waitUntil: "networkidle" });

      await page.addStyleTag({
        content: `*{ transition: none !important; animation: none !important; }`,
      });

      await page.waitForTimeout(350);

      const safe = r === "/" ? "root" : r.split("/").filter(Boolean).join("-");
      const name = `mf-${safe}.png`;

      await expect(page).toHaveScreenshot([name], {
        fullPage: true,
        maxDiffPixelRatio: 0.001,
      });
    });
  }
});
