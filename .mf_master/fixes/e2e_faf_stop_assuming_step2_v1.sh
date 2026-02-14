#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-stop-step2-$TS"
SPEC="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup spec"
mkdir -p "$BKP/$(dirname "$SPEC")"
cp -a "$SPEC" "$BKP/$SPEC"
echo "✅ backup em: $BKP"

echo "==> [2] patch: stop assuming step-2; wait for FAF anchor (mf-faf-select)"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

def replace_fn(fn_name: str, body: str):
    global s
    pat = rf"async function {re.escape(fn_name)}\([\s\S]*?\n\}}"
    m = re.search(pat, s)
    if not m:
        raise SystemExit(f"❌ Não encontrei a função {fn_name}() no spec.")
    s = s[:m.start()] + body + s[m.end():]

# 1) substituir mfClickNextAndWaitStep2 por uma versão que espera o FAF por testid (SSOT)
new_click_wait = r'''
async function mfClickNextAndWaitFAF(page: any) {
  const btn = await mfFindNextButton(page);
  if (!btn) {
    await mfDebugOnFail(page, "next-not-found-before-faf");
    throw new Error("MF: não encontrei botão next antes do FAF");
  }

  await btn.waitFor({ state: "visible", timeout: 20000 }).catch(async () => {
    await mfDebugOnFail(page, "next-not-visible-before-faf");
    throw new Error("MF: botão next não ficou visível antes do FAF");
  });

  // click robusto
  await btn.scrollIntoViewIfNeeded().catch(() => {});
  await btn.click({ timeout: 15000 }).catch(async () => {
    try { await btn.evaluate((el: any) => (el as any).click()); } catch {}
  });

  // ✅ Em vez de assumir /step-2, esperamos a âncora REAL do FAF
  // O dump já provou que o app pode ir direto para /step-3
  const faf = page.getByTestId("mf-faf-select").first();
  await faf.waitFor({ state: "visible", timeout: 30000 }).catch(async () => {
    // se ainda não apareceu, tenta avançar mais uma vez (há casos step intermediário)
    const btn2 = await mfFindNextButton(page);
    if (btn2):
      try:
        await btn2.click({ timeout: 8000 })
      except Exception:
        pass
    await faf.waitFor({ state: "visible", timeout: 20000 }).catch(async () => {
      await mfDebugOnFail(page, "faf-not-visible-after-next");
      throw new Error("MF: não cheguei na tela do FAF (mf-faf-select não apareceu)");
    });
  });
}
'''.strip("\n")

# tenta substituir a função antiga se existir, senão injeta uma nova e troca chamada
# 1) se existe mfClickNextAndWaitStep2, substitui por mfClickNextAndWaitFAF (mesmo nome ou alias)
if re.search(r"async function mfClickNextAndWaitStep2\(", s):
    replace_fn("mfClickNextAndWaitStep2", new_click_wait.replace("mfClickNextAndWaitFAF", "mfClickNextAndWaitStep2"))
else:
    # injeta antes do primeiro test.describe
    anchor = re.search(r"\btest\.describe\(", s)
    if not anchor:
        raise SystemExit("❌ Não encontrei test.describe para inserir helper.")
    s = s[:anchor.start()] + new_click_wait + "\n\n" + s[anchor.start():]

# 2) substituir chamadas para mfClickNextAndWaitStep2 -> mfClickNextAndWaitFAF se existir no spec
s = s.replace("await mfClickNextAndWaitStep2(page);", "await mfClickNextAndWaitStep2(page);")

# 3) remover expectativas hardcoded de step-2 (se tiver)
s = re.sub(r"\n\s*await expect\(page\)\.toHaveURL\(/step-2/[\s\S]*?\);\s*", "\n", s)

if s == orig:
    raise SystemExit("❌ Nenhuma mudança aplicada (inesperado).")

p.write_text(s, encoding="utf-8")
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
git commit -m "test(e2e): stop assuming step-2; wait for FAF via mf-faf-select anchor (step-1 -> step-3 safe)" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
