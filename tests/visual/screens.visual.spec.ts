import { test, expect } from "@playwright/test";

const routes = ["/"];

test.describe("MF Visual Lock — snapshots", () => {
  for (const r of routes) {
    test(`snapshot: ${r}`, async ({ page }) => {
      await page.goto(r, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      await expect(page).toHaveScreenshot(["mf-dashboard.png"], { fullPage: true });
    });
  }
});
