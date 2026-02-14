#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/onboarding-next-btn-v3-$TS"
mkdir -p "$BKP"

UI="src/components/onboarding/OnboardingCarouselShell.tsx"
SPEC="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
for f in "$UI" "$SPEC"; do
  if [ -f "$f" ]; then
    mkdir -p "$BKP/$(dirname "$f")"
    cp -a "$f" "$BKP/$f"
  fi
done
echo "✅ backup em: $BKP"

echo "==> [2] patch UI: inject data-testid=mf-next-step near canNext ternary (robusto)"
python3 - <<'PY2'
from __future__ import annotations
from pathlib import Path
import re, sys

UI = Path("src/components/onboarding/OnboardingCarouselShell.tsx")
if not UI.exists():
    print("❌ UI file não encontrado:", UI)
    sys.exit(1)

s = UI.read_text(encoding="utf-8")
orig = s

if 'data-testid="mf-next-step"' in s or "data-testid='mf-next-step'" in s:
    print("ℹ️ UI já contém mf-next-step (skip).")
    sys.exit(0)

# achar o ternário (flexível a espaços/novas linhas)
m = re.search(r"\{\s*canNext\s*\?\s*['\"]Próxima etapa['\"]\s*:\s*['\"]Finalizar['\"]\s*\}", s)
if not m:
    print("❌ Não encontrei o trecho canNext ? \"Próxima etapa\" : \"Finalizar\" no arquivo.")
    sys.exit(1)

anchor_idx = m.start()

# localizar o opening tag mais próximo acima: <Button ...> ou <button ...>
tag_candidates = []
for tag in ["<Button", "<button"]:
    i = s.rfind(tag, 0, anchor_idx)
    if i != -1:
        tag_candidates.append((i, tag))
if not tag_candidates:
    print("❌ Não encontrei <Button> ou <button> acima do ternário.")
    sys.exit(1)

tag_start, tag_name = max(tag_candidates, key=lambda x: x[0])

# achar o fim do opening tag (>) respeitando aspas
def find_tag_end(text: str, start: int) -> int:
    in_s = False
    in_d = False
    esc = False
    for i in range(start, len(text)):
        c = text[i]
        if esc:
            esc = False
            continue
        if c == "\\":
            esc = True
            continue
        if c == "'" and not in_d:
            in_s = not in_s
            continue
        if c == '"' and not in_s:
            in_d = not in_d
            continue
        if c == ">" and not in_s and not in_d:
            return i
    return -1

tag_end = find_tag_end(s, tag_start)
if tag_end == -1:
    print("❌ Não consegui localizar o fim do opening tag do botão.")
    sys.exit(1)

open_tag = s[tag_start:tag_end+1]
if "data-testid" in open_tag:
    print("ℹ️ opening tag já tem data-testid (skip).")
    sys.exit(0)

# inserir antes do fechamento do tag (> ou />)
if open_tag.endswith("/>"):
    open_tag2 = open_tag[:-2] + ' data-testid="mf-next-step" />'
else:
    open_tag2 = open_tag[:-1] + ' data-testid="mf-next-step">'

s2 = s[:tag_start] + open_tag2 + s[tag_end+1:]
UI.write_text(s2, encoding="utf-8")
print(f"✅ injected mf-next-step in {UI} (tag {tag_name})")
PY2

echo "==> [3] patch E2E: garantir click via mf-next-step (idempotente)"
python3 - <<'PY3'
from pathlib import Path
import re, sys

SPEC = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
if not SPEC.exists():
    print("❌ spec não encontrado:", SPEC)
    sys.exit(1)

s = SPEC.read_text(encoding="utf-8")

# garante que o teste usa mf-next-step ao invés de getByRole por texto
s = re.sub(
    r'page\.getByRole\("button",\s*\{\s*name:\s*/próxima\s+etapa/i\s*\}\)',
    'page.getByTestId("mf-next-step")',
    s,
    flags=re.IGNORECASE
)

# se ainda existir um click direto por role/name, troca por testid com wait
s = re.sub(
    r'await\s+page\.getByRole\("button",\s*\{\s*name:\s*/próxima\s+etapa/i\s*\}\)\.click\(\)\s*;',
    'await page.getByTestId("mf-next-step").first().waitFor({ state: "visible", timeout: 15000 });\n  await page.getByTestId("mf-next-step").first().click();',
    s,
    flags=re.IGNORECASE
)

# se não tiver nenhum click do next ainda (caso já removido), injeta após preencher peso
if 'getByTestId("mf-next-step")' not in s:
    anchor = 'await page.getByRole("spinbutton", { name: /peso/i }).fill("70");'
    i = s.find(anchor)
    if i != -1:
        j = i + len(anchor)
        ins = '\n\n  await page.getByTestId("mf-next-step").first().waitFor({ state: "visible", timeout: 15000 });\n  await page.getByTestId("mf-next-step").first().click();\n'
        s = s[:j] + ins + s[j:]

SPEC.write_text(s, encoding="utf-8")
print("✅ ensured E2E uses mf-next-step:", str(SPEC))
PY3

echo "==> [4] verify"
npm run -s verify

echo "==> [5] e2e"
npm run -s test:e2e

echo "==> [6] commit + push"
git add -A
git commit -m "test(e2e): inject mf-next-step on onboarding button + stabilize advance" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
