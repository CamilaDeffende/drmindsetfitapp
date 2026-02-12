#!/usr/bin/env bash
set -euo pipefail

echo "==> (A) garantir Playwright + config"
npm ls --depth=0 @playwright/test >/dev/null 2>&1 || npm i -D @playwright/test
npx -y playwright install chromium >/dev/null 2>&1 || true

if [ ! -f playwright.config.ts ]; then
cat > playwright.config.ts <<'TS'
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".mf_master/qa",
  timeout: 60000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:8080",
    headless: true,
    viewport: { width: 1280, height: 800 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
TS
echo "✅ criado: playwright.config.ts"
else
echo "ℹ️ playwright.config.ts já existe"
fi

echo
echo "==> (B) scripts npm: test:e2e (idempotente)"
node - <<'NODE'
const fs = require("fs");
const p = "package.json";
const j = JSON.parse(fs.readFileSync(p, "utf8"));
j.scripts ||= {};
const set = (k, v) => { if (!j.scripts[k]) j.scripts[k] = v; };
set("test:e2e", "playwright test");
set("test:e2e:ui", "playwright test --ui");
set("test:e2e:headed", "playwright test --headed");
fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
console.log("✅ scripts garantidos");
NODE

echo
echo "==> (C) helpers QA"
mkdir -p .mf_master/qa/_helpers
cat > .mf_master/qa/_helpers/onboarding.ts <<'TS'
import { expect, Page } from "@playwright/test";

export async function resetMindsetFitState(page: Page) {
  await page.addInitScript(() => {
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        const kl = String(k).toLowerCase();
        if (k.startsWith("mf:") || kl.includes("mindsetfit") || kl.includes("onboarding")) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
  });
}

export async function gotoStep(page: Page, step: number) {
  await page.goto(`/onboarding/step-${step}`);
  await expect(page).toHaveURL(new RegExp(`/onboarding/step-${step}$`));
}

export async function clickPrimary(page: Page) {
  const btn = page.getByTestId("mf-onb-primary");
  await expect(btn).toBeVisible();
  await expect(btn).toBeEnabled();
  await btn.click();
}

export async function expectStep(page: Page, step: number) {
  await expect(page).toHaveURL(new RegExp(`/onboarding/step-${step}$`));
  await expect(page.getByTestId("mf-onb-primary")).toBeVisible();
}
TS
echo "✅ helper criado"

echo
echo "==> (D) patch data-testid no botão primário"
python3 - <<'PY'
import re
from pathlib import Path

root = Path("src")
cands = []
for p in root.rglob("*.tsx"):
    try:
        s = p.read_text(encoding="utf-8")
    except Exception:
        continue
    if re.search(r"/onboarding/step-", s) or re.search(r"Onboarding", s, re.I):
        cands.append(p)
for p in root.rglob("Step*.tsx"):
    if p not in cands:
        cands.append(p)

pat = r'(<button\\b(?![^>]*\\bdata-testid=)[^>]*)(>[\\s\\S]{0,200}?(Continuar|Próximo|Avançar|Finalizar)[\\s\\S]{0,200}?</button>)'
changed = 0
touched = []
for p in cands:
    s = p.read_text(encoding="utf-8")
    if "mf-onb-primary" in s:
        continue
    m = re.search(pat, s, flags=re.I)
    if not m:
        continue
    s2 = s[:m.start(1)] + m.group(1) + ' data-testid="mf-onb-primary"' + s[m.end(1):]
    if s2 != s:
        p.write_text(s2, encoding="utf-8")
        changed += 1
        touched.append(str(p))

print(f"✅ patched files: {changed}")
for t in touched[:80]:
    print(" -", t)
PY

echo
echo "==> (E) spec e2e determinístico"
mkdir -p .mf_master/qa
cat > .mf_master/qa/onboarding.e2e.spec.ts <<'TS'
import { test, expect } from "@playwright/test";
import { resetMindsetFitState, gotoStep, clickPrimary, expectStep } from "./_helpers/onboarding";

test("Onboarding 1-8: fluxo + refresh/resume (determinístico)", async ({ page }) => {
  await resetMindsetFitState(page);

  await gotoStep(page, 1);
  await expectStep(page, 1);

  for (let step = 1; step <= 8; step++) {
    await expectStep(page, step);
    await page.reload();
    await expectStep(page, step);

    await clickPrimary(page);

    if (step < 8) {
      await expect(page).toHaveURL(new RegExp(`/onboarding/step-${step + 1}$`));
    }
  }

  await expect(page).toHaveURL(/dashboard|planos|home/i);
});
TS
echo "✅ spec atualizado"

echo
echo "==> (F) gate (tsc + build + verify)"
npx -s tsc --noEmit
npm run -s build
npm run -s verify

echo
echo "==> commit"
git add -A
git commit -m "test(onboarding): add deterministic e2e + mf-onb-primary testid + QA helpers" || true

echo
echo "✅ DONE"
git status -sb
