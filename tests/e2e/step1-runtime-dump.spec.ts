import { test, expect } from "@playwright/test";

test("dump runtime of /onboarding/step-1 (what is really rendered)", async ({ page }) => {
  await page.goto("http://localhost:8080/onboarding/step-1", { waitUntil: "domcontentloaded" });

  // SPA-safe: garante que root existe
  const root = page.locator("#root");
  await root.waitFor({ state: "attached", timeout: 20000 });

  // dá tempo de hidratar / montar o step
  await page.waitForTimeout(1200);

  // tenta detectar headings típicos do Step1Perfil
  const h1 = page.locator("h1").first();
  const h2 = page.locator("h2").first();

  const dump = await page.evaluate(() => {
    const pickText = (sel: string) => {
      const el = document.querySelector(sel);
      return (el?.textContent || "").trim().slice(0, 140);
    };

    const headings = Array.from(document.querySelectorAll("h1,h2"))
      .slice(0, 8)
      .map((el) => (el.textContent || "").trim().slice(0, 140));

    const fields = Array.from(document.querySelectorAll("input, textarea")).map((el) => {
      const e = el as HTMLInputElement;
      return {
        tag: el.tagName.toLowerCase(),
        type: (e as any).type || null,
        name: e.getAttribute("name"),
        id: e.getAttribute("id"),
        placeholder: e.getAttribute("placeholder"),
        ariaLabel: e.getAttribute("aria-label"),
        testid: e.getAttribute("data-testid"),
        disabled: (e as any).disabled ?? null,
        readOnly: (e as any).readOnly ?? null,
      };
    });

    const root = document.querySelector("#root") as HTMLElement | null;
    const rootHtmlPreview = (root?.innerHTML || "").replace(/\s+/g, " ").trim().slice(0, 1200);

    return {
      url: location.href,
      title: document.title,
      bodyHiddenAttr: document.body?.getAttribute("hidden"),
      headings,
      fieldsCount: fields.length,
      fields,
      rootHtmlPreview,
      mainTextPreview: (document.body?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 400),
    };
  });

  console.log("=== STEP1 RUNTIME DUMP ===");
  console.log(JSON.stringify(dump, null, 2));

  // screenshot ajuda no relatório
  await page.screenshot({ path: "test-results/step1-runtime-dump.png", fullPage: true });

  // assert mínimo (não falhar por nada)
  await expect(page).toHaveURL(/onboarding/);
});
