import { test, expect } from "@playwright/test";

test("dev engine renders and generates JSON", async ({ page }) => {
  await page.goto("/dev/engine");

  await expect(
    page.getByRole("heading", { name: "Dev · Training Engine" })
  ).toBeVisible();

  await expect(page.getByText("Resultado")).toBeVisible();
  await expect(page.getByText(/"monday"/)).toBeVisible();
});
