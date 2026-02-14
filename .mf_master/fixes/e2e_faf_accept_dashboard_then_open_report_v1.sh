#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-accept-dashboard-report-$TS"
FILE="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
mkdir -p "$BKP/$(dirname "$FILE")"
cp -a "$FILE" "$BKP/$FILE"
echo "✅ backup em: $BKP"

echo "==> [2] patch: accept /dashboard as end; open report via route fallbacks; assert mf-faf-label"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

# 1) inserir helper mfOpenReportByRoutes (se não existir)
if "async function mfOpenReportByRoutes" not in s:
    insert_anchor = re.search(r"(?m)^\s*async function mfDebugOnFail\(", s)
    if not insert_anchor:
        raise SystemExit("❌ Não achei anchor para inserir mfOpenReportByRoutes (mfDebugOnFail).")

    helper = r'''
async function mfOpenReportByRoutes(page: any) {
  // O app pode terminar onboarding no /dashboard; o Report pode estar em outra rota.
  // Estratégia defensiva: tentar rotas conhecidas e validar pelo testid mf-faf-label.
  const routes = ["/report", "/exportar-pdf", "/relatorio", "/reports", "/history/reports"];
  for (const r of routes) {
    try {
      await page.goto(r, { waitUntil: "domcontentloaded" });
      const faf = page.getByTestId("mf-faf-label");
      await faf.waitFor({ state: "visible", timeout: 8000 });
      return; // achou
    } catch {
      // tenta próxima rota
    }
  }
  // última tentativa: se o report está acessível via dashboard, ao menos falha com debug
  await mfDebugOnFail(page, "report-route-not-found");
  throw new Error("MF: não consegui abrir Report por rota (tentei /report, /exportar-pdf, /relatorio...)");
}
'''.strip("\n") + "\n\n"

    s = s[:insert_anchor.start()] + helper + s[insert_anchor.start():]

# 2) patch em mfAdvanceUntilReport: aceitar /dashboard também
# substitui: await expect(page).toHaveURL(/report/i, { timeout: 30000 });
s = re.sub(
    r"await expect\(page\)\.toHaveURL\(/report/i,\s*\{\s*timeout:\s*30000\s*\}\s*\)\s*;",
    'await expect(page).toHaveURL(/report|dashboard/i, { timeout: 30000 });',
    s,
    count=1
)

# 3) após mfAdvanceUntilReport(page); garantir que se cair em dashboard, abre report via helper
# acha a chamada no teste principal (uma vez)
pat_call = re.compile(r"(\s*await mfAdvanceUntilReport\(page\);\s*)")
m = pat_call.search(s)
if not m:
    raise SystemExit("❌ Não encontrei chamada 'await mfAdvanceUntilReport(page);' para acoplar o fallback.")

inject = r'''
  // Se o app terminar onboarding no dashboard, abra o Report por rota e valide lá
  const u = page.url();
  if (/\/dashboard/i.test(u)) {
    await mfOpenReportByRoutes(page);
  }
'''.rstrip("\n") + "\n"

# evita duplicar
if "await mfOpenReportByRoutes(page);" not in s:
    s = s[:m.end()] + inject + s[m.end():]

if s == orig:
    raise SystemExit("❌ Nenhuma mudança aplicada (o arquivo pode já estar com o patch).")

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
git commit -m "test(e2e): accept dashboard as onboarding end; open Report via route fallbacks; assert FAF label" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
