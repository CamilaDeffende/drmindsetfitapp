import { test, expect } from "@playwright/test";

async function assertRootRenders(page: any, url: string) {
  await page.goto(url, { waitUntil: "domcontentloaded" });

  const root = page.locator("#root");
await expect(root).toBeAttached({ timeout: 20000 });
// “root vazio” = React renderizou null (ou algum Provider acima retornou null)
  const html = await root.innerHTML();
  expect(html.length).toBeGreaterThan(80);

  console.log("URL:", url);
  console.log("root.innerHTML length:", html.length);

  // screenshot para evidência
  const safe = url.replace(/[^a-z0-9]+/gi, "_").toLowerCase();
  await page.screenshot({ path: `test-results/root-${safe}.png`, fullPage: true });

  // assert: precisa ter algum HTML dentro do root
  expect(html.trim().length).toBeGreaterThan(0);
}

test("root renders something on /", async ({ page }) => {
  await assertRootRenders(page, "http://localhost:8080/");
});

test("root renders something on /onboarding/step-1", async ({ page }) => {
  await assertRootRenders(page, "http://localhost:8080/onboarding/step-1");
});
