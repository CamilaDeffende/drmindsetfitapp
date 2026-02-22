import { test, expect } from "@playwright/test";

const routes = ["/", "/metabolismo", "/plano", "/treinos"];

test.describe("MF Visual Lock — snapshots", () => {
  for (const r of routes) {
    test(`snapshot: ${r}`, async ({ page }) => {
      await page.goto(r, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);

      const name =
        "mf-" +
        (r === "/" ? "dashboard" : r.replace(/\//g, "-").replace(/^-/, "")) +
        ".png";

      await expect(page).toHaveScreenshot([name], {
        fullPage: true,
        maxDiffPixelRatio: 0.001,
      });
    });
  }
});
