#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-fix-syntax2-$TS"
SPEC="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup spec"
mkdir -p "$BKP/$(dirname "$SPEC")"
cp -a "$SPEC" "$BKP/$SPEC"
echo "✅ backup em: $BKP"

echo "==> [2] patch spec (fix broken locator quoting + robust next helper)"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

# Fix qualquer locator quebrado sem aspas:
# page.locator(button:has-text(Próxima)) -> page.locator('button:has-text("Próxima")')
s = re.sub(
    r"page\.locator\(\s*button:has-text\(\s*([^)]+?)\s*\)\s*\)",
    lambda m: "page.locator('button:has-text(\"%s\")')" % m.group(1).strip().strip("\"'"),
    s,
)

# Normaliza casos específicos malformados
s = s.replace('page.locator("button:has-text(\\"Próxima\\")")', 'page.locator(\'button:has-text("Próxima")\')')
s = s.replace('page.locator("button:has-text(\\"Próxima etapa\\")")', 'page.locator(\'button:has-text("Próxima etapa")\')')

HELPER = """
async function mfNextLocator(page: any) {
  // 1) data-testid (se existir)
  try {
    const byTestId = page.getByTestId("mf-next-step").first();
    if (await byTestId.count().catch(() => 0)) return byTestId;
  } catch {}

  // 2) texto (Próxima etapa / Próxima / Finalizar)
  const byText = page
    .locator('button:has-text("Próxima etapa"), button:has-text("Próxima"), button:has-text("Finalizar")')
    .first();
  if (await byText.count().catch(() => 0)) return byText;

  // 3) role fallback
  return page.getByRole("button", { name: /próxima|finalizar/i }).first();
}
"""

def ensure_helper_and_wire(src: str) -> str:
    out = src

    # injeta helper após último import
    if "async function mfNextLocator" not in out:
        imports = list(re.finditer(r"(?m)^\s*import .*?;\s*$", out))
        if imports:
            ins = imports[-1].end()
            out = out[:ins] + "\n\n" + HELPER.strip("\n") + "\n\n" + out[ins:]
        else:
            out = HELPER.strip("\n") + "\n\n" + out

    # reescreve mfClickNext (se existir). Se não existir, injeta uma versão nova.
    if re.search(r"async function mfClickNext\(", out):
        out = re.sub(
            r"async function mfClickNext\([\s\S]*?\n\}",
            """async function mfClickNext(page: any) {
  const btn = await mfNextLocator(page);
  await btn.waitFor({ state: "visible", timeout: 15000 });
  await btn.scrollIntoViewIfNeeded().catch(() => {});
  await btn.click({ timeout: 15000 }).catch(async () => {
    try { await btn.evaluate((el: any) => (el as any).click()); } catch {}
  });
}""",
            out,
            count=1,
        )
    else:
        # injeta mfClickNext logo após helper
        out = out.replace(HELPER.strip("\n"), HELPER.strip("\n") + "\n\n" + """async function mfClickNext(page: any) {
  const btn = await mfNextLocator(page);
  await btn.waitFor({ state: "visible", timeout: 15000 });
  await btn.scrollIntoViewIfNeeded().catch(() => {});
  await btn.click({ timeout: 15000 }).catch(async () => {
    try { await btn.evaluate((el: any) => (el as any).click()); } catch {}
  });
}""")

    return out

s2 = ensure_helper_and_wire(s)

if s2 == orig:
    raise SystemExit("❌ Nenhuma mudança aplicada (talvez já esteja correto).")

p.write_text(s2, encoding="utf-8")
print("✅ patched:", p)
PY

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e (apenas este spec)"
npx playwright test "$SPEC" --workers=1

echo "==> [5] e2e (suite completa)"
npm run -s test:e2e

echo "==> [6] commit + push"
git add -A
git commit -m "test(e2e): fix FAF spec syntax + robust next locator (proxima/finalizar)" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
