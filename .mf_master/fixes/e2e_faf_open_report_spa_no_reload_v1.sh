#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-open-report-spa-$TS"
FILE="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
mkdir -p "$BKP/$(dirname "$FILE")"
cp -a "$FILE" "$BKP/$FILE"
echo "✅ backup em: $BKP"

echo "==> [2] patch: open report via SPA (no reload) to preserve memory state"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

def insert_before(fn_name: str, block: str):
    global s
    m = re.search(rf"(?m)^\s*async function {re.escape(fn_name)}\(", s)
    if not m:
        raise SystemExit(f"❌ Não encontrei async function {fn_name}(")
    s = s[:m.start()] + block.rstrip() + "\n\n" + s[m.start():]

# 1) helper SPA navigate (sem reload)
if "async function mfSpaNavigate" not in s:
    block = r'''
async function mfSpaNavigate(page: any, path: string) {
  // Navegação SPA (sem reload) para não perder estado/hidratação.
  await page.evaluate((p: string) => {
    try {
      history.pushState({}, "", p);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (e) {
      // fallback: tenta setar location hash (não deve ser necessário, mas é defensivo)
      try { (window as any).location.hash = p; } catch {}
    }
  }, path);
  await page.waitForTimeout(150);
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForTimeout(150);
}
'''.strip("\n")
    # inserir perto do topo: antes de mfDebugOnFail (geralmente existe)
    anchor = "mfDebugOnFail"
    if re.search(r"(?m)^\s*async function mfDebugOnFail\(", s):
        insert_before(anchor, block)
    else:
        # fallback: insere antes do primeiro test.describe
        m2 = re.search(r"(?m)^\s*test\.describe\(", s)
        if not m2:
            raise SystemExit("❌ Não encontrei ponto seguro para inserir mfSpaNavigate.")
        s = s[:m2.start()] + block + "\n\n" + s[m2.start():]

# 2) reescrever mfOpenReportByRoutes para usar mfSpaNavigate e NÃO usar page.goto
m = re.search(r"(?s)async function mfOpenReportByRoutes\s*\(page: any\)\s*\{.*?\n\}", s)
if not m:
    raise SystemExit("❌ Não encontrei mfOpenReportByRoutes(page) para reescrever.")

new_fn = r'''
async function mfOpenReportByRoutes(page: any) {
  // IMPORTANTÍSSIMO: NÃO usar page.goto aqui (reload) — isso pode resetar estado e voltar pro step-1.
  // Em vez disso, navegamos via SPA (history.pushState) e procuramos pelo mf-faf-label.

  const routes = ["/report", "/exportar-pdf", "/relatorio", "/reports", "/history/reports"];

  for (const r of routes) {
    try {
      await mfSpaNavigate(page, r);
      const faf = page.getByTestId("mf-faf-label");
      await faf.waitFor({ state: "visible", timeout: 6000 });
      return;
    } catch {
      // tenta a próxima rota
    }
  }

  // Fallback 1: clicar por UI (sem saber a rota) — procura botões/links comuns
  const candidates = [
    page.getByRole("link", { name: /relat|report|pdf|export/i }).first(),
    page.getByRole("button", { name: /relat|report|pdf|export/i }).first(),
    page.locator('a:has-text("Relatório"), a:has-text("Report"), a:has-text("PDF")').first(),
    page.locator('button:has-text("Relatório"), button:has-text("Report"), button:has-text("PDF")').first(),
  ];

  for (const c of candidates) {
    try {
      if (await c.count().catch(() => 0)) {
        await c.click({ timeout: 8000 }).catch(() => {});
        const faf = page.getByTestId("mf-faf-label");
        await faf.waitFor({ state: "visible", timeout: 8000 });
        return;
      }
    } catch {
      pass
    }
  }

  await mfDebugOnFail(page, "report-route-not-found");
  throw new Error("MF: não consegui abrir Report sem reload (SPA routes + UI fallback falharam).");
}
'''.strip("\n")

# Corrige "pass" (python) caso editor substitua — garantia
new_fn = new_fn.replace("\n      pass\n", "\n      // ignore\n")

s = s[:m.start()] + new_fn + s[m.end():]

# 3) reforçar debug: dump localStorage keys (forense)
if "MF_DEBUG_localStorage_keys" not in s:
    dbg = re.search(r"(?s)async function mfDebugOnFail\s*\(page: any, label: string\)\s*\{.*?\n\}", s)
    if dbg:
        body = dbg.group(0)
        if "localStorage" not in body:
            inject = r'''
    try {
      const ls = await page.evaluate(() => {
        try {
          const keys = Object.keys(localStorage || {});
          const sample: Record<string, string> = {};
          for (const k of keys.slice(0, 60)) {
            const v = String(localStorage.getItem(k) ?? "");
            sample[k] = v.length > 180 ? v.slice(0, 180) + "…" : v;
          }
          return { keys, sample };
        } catch (e) {
          return { keys: [], sample: {} };
        }
      });
      console.log("MF_DEBUG_localStorage_keys:", ls.keys);
      console.log("MF_DEBUG_localStorage_sample:", JSON.stringify(ls.sample, null, 2));
    } catch {}
'''.rstrip("\n")
            # injeta antes do fechamento do mfDebugOnFail
            body2 = re.sub(r"(?s)\n\}\s*$", "\n" + inject + "\n}\n", body)
            s = s[:dbg.start()] + body2 + s[dbg.end():]

# sanity mínima
if "page.goto(" in re.search(r"(?s)async function mfOpenReportByRoutes.*?\n\}", s).group(0):
    raise SystemExit("❌ Sanity falhou: mfOpenReportByRoutes ainda contém page.goto (reload).")

if s == orig:
    raise SystemExit("❌ Nenhuma mudança aplicada — o arquivo pode já estar com a versão SPA.")

p.write_text(s, encoding="utf-8")
print("✅ patched:", p)
PY

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e (apenas este spec)"
npx playwright test tests/mf/e2e_faf_moderadamente_ativo.spec.ts --workers=1

echo "==> [5] e2e (suite completa)"
npm run -s test:e2e

echo "==> [6] commit + push"
git add -A
git commit -m "test(e2e): open Report via SPA navigation (no reload) to preserve onboarding state + forensic localStorage dump" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
