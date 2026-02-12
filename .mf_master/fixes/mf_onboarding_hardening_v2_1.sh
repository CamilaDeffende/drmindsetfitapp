#!/usr/bin/env bash
set -euo pipefail

echo "==> (0) garantir pasta"
mkdir -p .mf_master/qa/_helpers

echo "==> (1) sobrescrever helper onboarding.ts (determinístico + fallback)"
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

export async function expectStep(page: Page, step: number) {
  await expect(page).toHaveURL(new RegExp(`/onboarding/step-${step}$`));
}

export async function clickPrimary(page: Page) {
  // 1) Preferência absoluta: data-testid (determinístico)
  const byTestId = page.getByTestId("mf-onb-primary");
  const n = await byTestId.count().catch(() => 0);
  if (n > 0) {
    await expect(byTestId.first()).toBeVisible();
    await expect(byTestId.first()).toBeEnabled();
    await byTestId.first().click();
    return;
  }

  // 2) Fallback: botão por texto (ainda relativamente estável)
  const byText = page
    .locator("button, [role=\"button\"]")
    .filter({ hasText: /continuar|próximo|avançar|finalizar/i })
    .first();

  await expect(byText).toBeVisible();
  await expect(byText).toBeEnabled();
  await byText.click();
}
TS
echo "✅ helper atualizado: .mf_master/qa/_helpers/onboarding.ts"

echo
echo "==> (2) patch: adicionar data-testid no botão primário via <Button> e <button>"
python3 - <<'PY'
import re
from pathlib import Path

root = Path("src")
files = []

for p in root.rglob("*.tsx"):
    try:
        s = p.read_text(encoding="utf-8")
    except Exception:
        continue
    if re.search(r"/onboarding/step-", s) or re.search(r"Onboarding", s, re.I) or re.search(r"step-\\d", s, re.I):
        files.append(p)

for p in root.rglob("Step*.tsx"):
    if p not in files:
        files.append(p)

TEXT = r"(Continuar|Próximo|Avançar|Finalizar)"
patched = 0
touched = []

def inject(tag: str, s: str) -> str:
    pat = rf'(<{tag}\\b(?![^>]*\\bdata-testid=)[^>]*)(>[\\s\\S]{{0,260}}?{TEXT}[\\s\\S]{{0,260}}?</{tag}>)'
    m = re.search(pat, s, flags=re.I)
    if not m:
        return s
    return s[:m.start(1)] + m.group(1) + ' data-testid="mf-onb-primary"' + s[m.end(1):]

for p in files:
    s = p.read_text(encoding="utf-8")
    if "mf-onb-primary" in s:
        continue

    s2 = inject("Button", s)
    if s2 == s:
        s2 = inject("button", s)

    if s2 != s:
        p.write_text(s2, encoding="utf-8")
        patched += 1
        touched.append(str(p))

print(f"✅ patched files: {patched}")
for t in touched[:120]:
    print(" -", t)
PY

echo
echo "==> (3) gate (tsc + build + verify)"
npx -s tsc --noEmit
npm run -s build
npm run -s verify

echo
echo "==> (4) commit"
git add -A
git commit -m "test(onboarding): v2.1 stable helper + testid patch for <Button>/<button>" || true

echo
echo "✅ DONE"
git status -sb
