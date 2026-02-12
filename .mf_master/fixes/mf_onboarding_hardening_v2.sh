#!/usr/bin/env bash
set -euo pipefail

echo "==> (1) atualizar helper clickPrimary: testid -> fallback por texto"
python3 - <<'PY'
from pathlib import Path
import re

p = Path(".mf_master/qa/_helpers/onboarding.ts")
s = p.read_text(encoding="utf-8")

pat = r"export async function clickPrimary\\(page: Page\\) \\{[\\s\\S]*?\\n\\}"
m = re.search(pat, s)
if not m:
    raise SystemExit("❌ não encontrei clickPrimary no helper")

rep = """export async function clickPrimary(page: Page) {
  // Preferência absoluta: testid (determinístico)
  const byTestId = page.getByTestId("mf-onb-primary");
  if (await byTestId.count().catch(() => 0)) {
    await expect(byTestId).toBeVisible();
    await expect(byTestId).toBeEnabled();
    await byTestId.click();
    return;
  }

  // Fallback: botão por texto (ainda relativamente estável)
  const byText = page
    .locator("button, [role=\\"button\\"]")
    .filter({ hasText: /continuar|próximo|avançar|finalizar/i })
    .first();

  await expect(byText).toBeVisible();
  await expect(byText).toBeEnabled();
  await byText.click();
}"""

s2 = s[:m.start()] + rep + s[m.end():]
p.write_text(s2, encoding="utf-8")
print("✅ helper atualizado:", str(p))
PY

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

def inject_testid(tag: str, s: str) -> str:
    pat = rf'(<{tag}\\b(?![^>]*\\bdata-testid=)[^>]*)(>[\\s\\S]{{0,240}}?{TEXT}[\\s\\S]{{0,240}}?</{tag}>)'
    m = re.search(pat, s, flags=re.I)
    if not m:
        return s
    head = m.group(1)
    head2 = head + ' data-testid="mf-onb-primary"'
    return s[:m.start(1)] + head2 + s[m.end(1):]

for p in files:
    s = p.read_text(encoding="utf-8")
    if "mf-onb-primary" in s:
        continue

    s2 = inject_testid("Button", s)
    if s2 == s:
        s2 = inject_testid("button", s)

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
git commit -m "test(onboarding): v2 add mf-onb-primary on <Button>/<button> + e2e fallback" || true

echo
echo "✅ DONE"
git status -sb
