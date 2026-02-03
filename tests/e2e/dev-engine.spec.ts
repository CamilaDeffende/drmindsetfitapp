import { test, expect } from "@playwright/test";

test("dev engine renders and generates JSON", async ({ page }) => {
  await page.goto("/dev/engine");
  await expect(page.getByText("Dev · Training Engine")).toBeVisible();
  await expect(page.getByText("OK")).toBeVisible();
  await expect(page.locator("pre")).toContainText('"monday"');
});
