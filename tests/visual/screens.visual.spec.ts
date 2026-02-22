import { test, expect } from "@playwright/test";

const routes = ["/", "/metabolismo", "/plano", "/treinos"];

test.describe("MF Visual Lock — snapshots", () => {
  test.beforeEach(async ({ page }) => {
    // reduz flake por animação/subpixel
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const r of routes) {
    test(`snapshot: ${r}`, async ({ page }) => {
      await page.goto(r, { waitUntil: "networkidle" });

      // injeta css de freeze (não altera app em prod)
      await page.addStyleTag({ content: `
        *{ transition: none !important; animation: none !important; }
      `});

      await page.waitForTimeout(300);

      const name =
        "mf-" +
        (r === "/" ? "dashboard" : r.replace(/\\//g, "-").replace(/^-/, "")) +
        ".png";

      await expect(page).toHaveScreenshot([name], {
        fullPage: true,
        maxDiffPixelRatio: 0.001,
      });
    });
  }
});
