#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
FILE="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-fix-mfSelect-braces-$TS"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
mkdir -p "$BKP/$(dirname "$FILE")"
cp -a "$FILE" "$BKP/$FILE"
echo "✅ backup em: $BKP"

echo "==> [2] patch: rebuild mfSelectFAFModerado block (fix stray braces + remove orphan fallback)"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

# substitui TODO o bloco da função mfSelectFAFModerado até a próxima "async function ..."
pat = r'(?s)^\s*async function mfSelectFAFModerado\([^\)]*\)\s*\{.*?(?=^\s*async function\s|\Z)'
m = re.search(pat, s, flags=re.M)
if not m:
    raise SystemExit("❌ Não encontrei o bloco 'async function mfSelectFAFModerado(...) { ... }' para reconstruir.")

new_fn = r'''
async function mfSelectFAFModerado(page: any) {
  const faf = page.getByTestId("mf-faf-select").first();
  await faf.waitFor({ state: "visible", timeout: 20000 });

  // abre dropdown (pode ser botão/select custom)
  await faf.click({ timeout: 15000 }).catch(async () => {
    try { await faf.evaluate((el: any) => (el as any).click()); } catch {}
  });

  // 1) tenta via role option (Radix/Select)
  const opt = page.getByRole("option", { name: /moderadamente\s+ativo/i }).first();
  if (await opt.count().catch(() => 0)) {
    await opt.click({ timeout: 15000 });
  } else {
    // 2) fallback por texto (dropdown custom)
    const opt2 = page.getByText(/moderadamente\s+ativo/i).first();
    await opt2.waitFor({ state: "visible", timeout: 15000 });
    await opt2.click({ timeout: 15000 });
  }

  // avança (se existir next)
  const btn = await mfFindNextButton(page);
  if (btn && (await btn.count().catch(() => 0))) {
    await btn.waitFor({ state: "visible", timeout: 15000 });
    await btn.scrollIntoViewIfNeeded().catch(() => {});
    await btn.click({ timeout: 15000 }).catch(async () => {
      try { await btn.evaluate((el: any) => (el as any).click()); } catch {}
    });
  }
}
'''.strip("\n") + "\n\n"

s2 = s[:m.start()] + new_fn + s[m.end():]

# remove qualquer "fallback por texto" solto logo depois (sintoma do brace quebrado)
s2 = re.sub(
    r'(?ms)^\s*//\s*fallback\s+por\s+texto[^\n]*\n\s*await\s+page\.(getByText|getByRole)\([^\n]*\)\.first\(\)\.click\([^\)]*\);\s*\n',
    '',
    s2
)

# sanity: não pode existir "await page.getByText(...)" fora de função logo após um "}"
# (heurística: linha começando com await com indent 2 espaços)
if re.search(r'(?m)^\s{0,2}await\s+page\.(getByText|getByRole)\(', s2):
    # não falha sempre; mas se estiver fora de função, geralmente vem sem indent (0-2).
    # Vamos apenas alertar se ainda houver.
    print("⚠️ warning: ainda existe 'await page.getByText/getByRole' com pouca indent. Se e2e falhar por syntax, me manda as linhas ao redor.")
p.write_text(s2, encoding="utf-8")
print("✅ rebuilt mfSelectFAFModerado:", p)
PY

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e (apenas este spec)"
npx playwright test tests/mf/e2e_faf_moderadamente_ativo.spec.ts --workers=1

echo "==> [5] commit + push"
git add -A
git commit -m "test(e2e): rebuild mfSelectFAFModerado (fix stray brace/orphan fallback) for FAF flow" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
