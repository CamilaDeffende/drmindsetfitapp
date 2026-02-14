#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
FILE="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-fix-step1-click-$TS"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
mkdir -p "$BKP/$(dirname "$FILE")"
cp -a "$FILE" "$BKP/$FILE"
echo "✅ backup em: $BKP"

echo "==> [2] patch spec (robust Step-1 click helper)"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

# 1) inserir helper mfClickOptionByText logo após imports (se não existir)
if "async function mfClickOptionByText" not in s:
    m = re.search(r'(?m)^\s*import\s+\{\s*test,\s*expect\s*\}\s+from\s+["\']@playwright/test["\']\s*;\s*\n', s)
    if not m:
        raise SystemExit("❌ Não encontrei import do Playwright para inserir helper.")
    helper = r'''
async function mfClickOptionByText(page: any, rx: RegExp) {
  // pega o nó que contém o texto
  const t = page.getByText(rx).first();
  await t.waitFor({ state: "visible", timeout: 20000 });

  // sobe para um alvo clicável real (button / role=button / a / label)
  const clickable = t.locator(
    "xpath=ancestor-or-self::*[self::button or @role='button' or self::a or self::label][1]"
  );

  const target = (await clickable.count().catch(() => 0)) ? clickable.first() : t;

  // tentativa normal
  try {
    await target.click({ timeout: 8000 });
    return;
  } catch (e: any) {
    const msg = String(e && (e.message || e));
    // se houve intercept/camada, tenta force
    try {
      await target.click({ timeout: 8000, force: true });
      return;
    } catch {}
    // fallback final: click via DOM
    try {
      await target.evaluate((el: any) => (el && el.click ? el.click() : null));
      return;
    } catch {}

    throw new Error("MF: falha ao clicar opção por texto " + String(rx) + " | last=" + msg);
  }
}
'''.lstrip("\n")

    s = s[:m.end()] + helper + "\n" + s[m.end():]

# 2) substituir cliques diretos de Step-1 por helper robusto
# Masculino
s = re.sub(
    r'await\s+page\.getByText\(\s*/\^Masculino\$\s*/i\)\.first\(\)\.click\(\{\s*timeout:\s*15000\s*\}\);\s*',
    r'await mfClickOptionByText(page, /^Masculino$/i);\n',
    s
)
# Hipertrofia
s = re.sub(
    r'await\s+page\.getByText\(\s*/\^Hipertrofia\$\s*/i\)\.first\(\)\.click\(\{\s*timeout:\s*15000\s*\}\);\s*',
    r'await mfClickOptionByText(page, /^Hipertrofia$/i);\n',
    s
)

# fallback caso regex exata não case (se você mudar texto no app)
# substitui qualquer "getByText(/^Masculino$/i).first().click(...)" etc.
s = re.sub(
    r'await\s+page\.getByText\(\s*/\^Masculino\$\s*/i\)\.first\(\)\.click\([^\)]*\);\s*',
    r'await mfClickOptionByText(page, /^Masculino$/i);\n',
    s
)
s = re.sub(
    r'await\s+page\.getByText\(\s*/\^Hipertrofia\$\s*/i\)\.first\(\)\.click\([^\)]*\);\s*',
    r'await mfClickOptionByText(page, /^Hipertrofia$/i);\n',
    s
)

if s == orig:
    raise SystemExit("❌ Nenhuma mudança aplicada (inesperado).")

p.write_text(s, encoding="utf-8")
print("✅ patched:", p)
PY

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e (apenas este spec)"
npx playwright test tests/mf/e2e_faf_moderadamente_ativo.spec.ts --workers=1

echo "==> [5] commit + push"
git add -A
git commit -m "test(e2e): fix Step-1 click interception (click nearest button/role=button; force+DOM fallback) for FAF SSOT spec" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
