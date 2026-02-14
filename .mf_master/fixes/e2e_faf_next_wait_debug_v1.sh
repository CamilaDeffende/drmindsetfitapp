#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-next-wait-debug-$TS"
SPEC="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup spec"
mkdir -p "$BKP/$(dirname "$SPEC")"
cp -a "$SPEC" "$BKP/$SPEC"
echo "✅ backup em: $BKP"

echo "==> [2] patch spec: wait-for-dom + CSS testid SSOT + forensic debug"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

def upsert_block(fn_name: str, new_block: str) -> bool:
    global s
    pat = rf"async function {re.escape(fn_name)}\([\s\S]*?\n\}}"
    m = re.search(pat, s)
    if not m:
        return False
    s = s[:m.start()] + new_block + s[m.end():]
    return True

# 1) Debug helper (sempre útil)
debug_block = r'''
async function mfDebugOnFail(page: any, label: string) {
  try {
    const url = page.url();
    const buttons = await page.locator("button").evaluateAll((els: any[]) =>
      els.slice(0, 30).map((e) => ({
        text: (e.textContent || "").trim(),
        testid: e.getAttribute?.("data-testid"),
        disabled: (e as any).disabled === true,
        ariaDisabled: e.getAttribute?.("aria-disabled"),
      }))
    ).catch(() => []);

    const hasNextCss = await page.locator('[data-testid="mf-next-step"]').count().catch(() => 0);
    const hasNextByTestId = await page.getByTestId("mf-next-step").count().catch(() => 0);

    const html = await page.content().catch(() => "");
    console.log("MF_DEBUG_FAIL:", label);
    console.log("MF_DEBUG_URL:", url);
    console.log("MF_DEBUG_hasNext_css:", hasNextCss, "hasNext_getByTestId:", hasNextByTestId);
    console.log("MF_DEBUG_buttons_top30:", JSON.stringify(buttons, null, 2));
    console.log("MF_DEBUG_html_head_1400:", String(html).slice(0, 1400));

    // screenshot best-effort
    await page.screenshot({ path: `test-results/mf-debug-${label.replace(/[^a-z0-9]+/gi,"-").slice(0,40)}.png`, fullPage: true }).catch(() => {});
  } catch (e) {
    console.log("MF_DEBUG_FAIL_ERROR:", String(e && (e as any).stack || e));
  }
}
'''.strip("\n")

if "async function mfDebugOnFail" not in s:
    # injeta antes do primeiro test.describe
    m = re.search(r"(?m)^\s*test\.describe\(", s)
    if not m:
        raise SystemExit("❌ Não encontrei test.describe para inserir debug helper.")
    s = s[:m.start()] + debug_block + "\n\n" + s[m.start():]

# 2) mfFindNextButton: agora espera o DOM e usa CSS SSOT
mfFind = r'''
async function mfFindNextButton(page: any, timeout = 20000) {
  // SSOT absoluto: atributo data-testid (não depende de config do Playwright)
  const css = page.locator('[data-testid="mf-next-step"]').first();
  try {
    await css.waitFor({ state: "attached", timeout: Math.min(8000, timeout) });
  } catch {}

  if (await css.count().catch(() => 0)) return css;

  // fallback 1: getByTestId (caso attribute esteja configurado diferente, mas aqui o default deveria ser data-testid)
  const byTestId = page.getByTestId("mf-next-step").first();
  if (await byTestId.count().catch(() => 0)) return byTestId;

  // fallback 2: role/name
  const byRole = page.getByRole("button", { name: /próxima etapa|próxima|finalizar/i }).first();
  if (await byRole.count().catch(() => 0)) return byRole;

  // fallback 3: texto
  const byText = page.locator('button:has-text("Próxima etapa"), button:has-text("Próxima"), button:has-text("Finalizar")').first();
  if (await byText.count().catch(() => 0)) return byText;

  return null;
}
'''.strip("\n")

if not upsert_block("mfFindNextButton", mfFind):
    # se não existe, injeta antes do test.describe
    m = re.search(r"(?m)^\s*test\.describe\(", s)
    if not m:
        raise SystemExit("❌ Não encontrei test.describe para inserir mfFindNextButton.")
    s = s[:m.start()] + mfFind + "\n\n" + s[m.start():]

# 3) mfWaitNextEnabled: espera VISIBLE e checa disabled/aria-disabled; se falhar, debug
mfWait = r'''
async function mfWaitNextEnabled(page: any, timeout = 25000) {
  const btn = await mfFindNextButton(page, timeout);
  if (!btn) {
    await mfDebugOnFail(page, "next-not-found");
    throw new Error("MF: não encontrei botão mf-next-step/Próxima etapa");
  }

  await btn.waitFor({ state: "visible", timeout }).catch(async () => {
    await mfDebugOnFail(page, "next-not-visible");
    throw new Error("MF: botão next existe mas não ficou visível");
  });

  await btn.scrollIntoViewIfNeeded().catch(() => {});

  const start = Date.now();
  while (Date.now() - start < timeout) {
    const disabled = await btn.evaluate((el: any) => {
      const d = (el as any).disabled === true;
      const ad = (el as any).getAttribute?.("aria-disabled");
      return d || ad === "true";
    }).catch(() => false);

    if (!disabled) return btn;
    await page.waitForTimeout(120);
  }

  await mfDebugOnFail(page, "next-stuck-disabled");
  throw new Error("MF: botão next permaneceu desabilitado (canNext/validação travada)");
}
'''.strip("\n")

if not upsert_block("mfWaitNextEnabled", mfWait):
    m = re.search(r"(?m)^\s*test\.describe\(", s)
    if not m:
        raise SystemExit("❌ Não encontrei test.describe para inserir mfWaitNextEnabled.")
    s = s[:m.start()] + mfWait + "\n\n" + s[m.start():]

# 4) mfClickNextAndWaitStep2: click + waitURL robusto + debug se não navegar
pat = r"async function mfClickNextAndWaitStep2\([\s\S]*?\n\}"
m = re.search(pat, s)
if m:
    block = r'''
async function mfClickNextAndWaitStep2(page: any) {
  const btn = await mfWaitNextEnabled(page, 30000);

  await btn.click({ timeout: 25000 }).catch(async () => {
    try { await btn.evaluate((el: any) => (el as any).click()); } catch {}
  });

  // SPA: pequena janela para state + navegação
  await page.waitForTimeout(200);
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(200);

  await page.waitForURL(/step-2|onboarding\/step-2/i, { timeout: 30000 }).catch(async () => {
    await mfDebugOnFail(page, "no-step2-after-click");
    throw new Error("MF: cliquei no next mas não naveguei para step-2");
  });
}
'''.strip("\n")
    s = s[:m.start()] + block + s[m.end():]

if s == orig:
    raise SystemExit("❌ Nenhuma mudança aplicada — o arquivo mudou muito. Me manda o spec inteiro se isso acontecer.")

p.write_text(s, encoding="utf-8")
print("✅ patched:", p)
PY

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e (apenas este spec)"
npx playwright test "$SPEC" --workers=1

echo "==> [5] commit (se passou)"
git add -A
git commit -m "test(e2e): make next-step discovery deterministic (css testid wait + forensic debug)" || echo "ℹ️ nada para commitar"

echo "==> [6] push"
git push -u origin "$BRANCH"

echo "✅ DONE"
