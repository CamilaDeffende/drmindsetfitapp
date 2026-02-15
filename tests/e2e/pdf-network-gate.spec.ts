import { test, expect } from "@playwright/test";

test("PDF chunk must NOT load on initial dashboard render (no user action)", async ({ page }) => {
  const jsRequests: string[] = [];

  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/assets/") && url.endsWith(".js")) jsRequests.push(url);
  });

  // Try dashboard first (if auth blocks it, the app will redirect)
  await page.goto("http://localhost:8080/dashboard", { waitUntil: "networkidle" });

  // Give a short window for any late prefetches
  await page.waitForTimeout(1500);

  const hit = jsRequests.find((u) => /\/assets\/pdf-.*\.js(\?|$)/.test(u));
  expect(hit, `Found pdf chunk loaded on initial render: ${hit}\nAll JS:\n${jsRequests.join("\n")}`).toBeFalsy();
});
