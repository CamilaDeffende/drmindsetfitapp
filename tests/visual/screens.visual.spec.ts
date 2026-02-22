import { test, expect } from "@playwright/test";

// Rotas geradas automaticamente a partir do src/App.tsx
// Fonte: .mf_routes_visual.json
// Regra: só rotas estáticas (sem :param), sem "*".
const routes: string[] = require("../../.mf_routes_visual.json");

test.describe("MF Visual Lock — snapshots (auto routes)", () => {
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
