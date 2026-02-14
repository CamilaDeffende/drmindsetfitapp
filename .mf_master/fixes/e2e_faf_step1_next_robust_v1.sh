#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-step1-next-robust-$TS"
mkdir -p "$BKP"

SPEC="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
mkdir -p "$BKP/$(dirname "$SPEC")"
cp -a "$SPEC" "$BKP/$SPEC"
echo "✅ backup em: $BKP"

echo "==> [2] patch spec: mfClickNext robusto + preencher historicoPeso se preciso"
python3 - <<'PY2'
from __future__ import annotations
from pathlib import Path
import re, sys

SPEC = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = SPEC.read_text(encoding="utf-8")
orig = s

HELPER = r'''
async function mfClickNext(page: any) {
  // tenta pelo testid (se existir)
  const byTestId = page.getByTestId("mf-next-step");
  try {
    if (await byTestId.count()) {
      const b = byTestId.first();
      await b.waitFor({ state: "visible", timeout: 8000 });
      await b.scrollIntoViewIfNeeded();
      await b.click();
      return;
    }
  } catch {}

  // tenta por texto visível no button (mais fiel ao UX)
  const byTextBtn = page.locator('button:has-text("Próxima")').first();
  try {
    await byTextBtn.waitFor({ state: "visible", timeout: 8000 });
    await byTextBtn.scrollIntoViewIfNeeded();
    await byTextBtn.click();
    return;
  } catch {}

  // fallback final: role/name genérico
  const byRole = page.getByRole("button", { name: /próxima/i }).first();
  await byRole.waitFor({ state: "visible", timeout: 8000 });
  await byRole.scrollIntoViewIfNeeded();
  await byRole.click();
}
'''

# inserir helper após imports (idempotente)
if "async function mfClickNext" not in s:
  m = re.search(r"(?m)^(import[^\n]*\n(?:import[^\n]*\n)*)\n", s)
  if m:
    ins = m.end()
    s = s[:ins] + HELPER + "\n" + s[ins:]
  else:
    s = HELPER + "\n" + s

# 1) garantir que historicoPeso seja preenchido antes de avançar (se existir)
# insere após o fill do peso
anchor = 'await page.getByRole("spinbutton", { name: /peso/i }).fill("70");'
i = s.find(anchor)
if i != -1:
  j = i + len(anchor)
  snippet = r'''
  // Se Step-1 exigir histórico, preenche para não travar validação
  const hp = page.getByRole("textbox", { name: /hist[oó]rico/i });
  try {
    if (await hp.count()) {
      await hp.first().fill("Sem histórico relevante. Fluxo de teste CI.");
    }
  } catch {}
'''
  if "Fluxo de teste CI." not in s:
    s = s[:j] + snippet + s[j:]

# 2) substituir o click atual do mf-next-step (linha 15) por mfClickNext(page)
s = re.sub(
  r'await\s+page\.getByTestId\("mf-next-step"\)\.click\(\)\s*;',
  'await mfClickNext(page);',
  s,
  count=1
)

# 3) substituir o loop de avanço para usar mfClickNext também (mantém determinístico)
s = re.sub(
  r'const\s+next\s*=\s*page\.getByTestId\("mf-next-step"\)\s*;\s*[\s\S]{0,220}?await\s+next\.first\(\)\.click\(\)\s*;\s*',
  'await mfClickNext(page);\n',
  s
)

# fallback: se o loop ainda tiver next.click sem mfClickNext, troca o corpo do loop
s = re.sub(
  r'for\s*\(let i\s*=\s*0;\s*i\s*<\s*5;\s*i\+\+\)\s*\{\s*[\s\S]*?\}',
  r'''for (let i = 0; i < 7; i++) {
    // tenta avançar; se não houver botão visível, para
    const hasNext =
      (await page.getByTestId("mf-next-step").count().catch(() => 0)) > 0 ||
      (await page.locator('button:has-text("Próxima")').count().catch(() => 0)) > 0 ||
      (await page.getByRole("button", { name: /próxima/i }).count().catch(() => 0)) > 0;
    if (!hasNext) break;
    await mfClickNext(page);
  }''',
  s,
  count=1
)

if s == orig:
  print("❌ Nenhuma mudança aplicada no spec (padrões não encontrados).")
  sys.exit(1)

SPEC.write_text(s, encoding="utf-8")
print("✅ patched:", str(SPEC))
PY2

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e"
npm run -s test:e2e

echo "==> [5] commit + push"
git add -A
git commit -m "test(e2e): robust next-step click + avoid Step1 validation lock" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
