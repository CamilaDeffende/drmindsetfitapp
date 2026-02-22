import { test, expect } from "@playwright/test";

const routes = ["/", "/metabolismo", "/plano", "/treinos"];

test.describe("MF Visual Lock — snapshots", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const r of routes) {
    test(`snapshot: ${r}`, async ({ page }) => {
      await page.goto(r, { waitUntil: "networkidle" });

      // freeze extra contra flake
      await page.addStyleTag({
        content: `*{ transition: none !important; animation: none !important; }`,
      });

      await page.waitForTimeout(300);

      const safe = r === "/" ? "dashboard" : r.split("/").filter(Boolean).join("-");
      const name = `mf-${safe}.png`;

      await expect(page).toHaveScreenshot([name], {
        fullPage: true,
        maxDiffPixelRatio: 0.001,
      });
    });
  }
});
