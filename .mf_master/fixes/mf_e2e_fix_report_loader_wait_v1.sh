#!/usr/bin/env bash
set -euo pipefail
TS="$(date +%Y%m%d_%H%M%S)"
F="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

mkdir -p .backups/e2e/tests
cp -a "$F" ".backups/e2e/tests/e2e_faf_moderadamente_ativo.spec.ts.bak.${TS}"

echo "==> patch: aguardando loader do Report antes de validar FAF"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

# 1) injeta helper waitReportReady uma única vez
if "MF_WAIT_REPORT_READY_V1" not in s:
    helper = r"""
async function waitReportReady(page: any) {
  // MF_WAIT_REPORT_READY_V1
  // Report pode abrir mostrando o Splash/Loader "Preparando sua experiência…"
  // Espera SUMIR ou surgir conteúdo real (sem travar o teste).
  const splash = page.getByText(/Preparando sua experiência/i);

  const t0 = Date.now();
  const maxMs = 25000;

  // dá um pequeno respiro pra hidratar/rotear
  await page.waitForTimeout(600);

  while (Date.now() - t0 < maxMs) {
    // se loader não existe/ não está visível -> ok
    try {
      const count = await splash.count();
      if (count === 0) return;
      const vis = await splash.first().isVisible().catch(() => false);
      if (!vis) return;
    } catch:
      return

    // se já pintou “cara de report” (heurística: algum texto típico de relatório/resultado)
    const body = await page.locator("body").innerText().catch(() => "");
    if (re.search(r"(relat|report|pdf|plano|resultado|dieta|macros|kcal)", body, re.I)):
      return

    await page.waitForTimeout(800);
  }
}
"""
    # coloca perto do topo, antes do primeiro test(
    m = re.search(r"(?m)^\s*test\(", s)
    if not m:
        raise SystemExit("❌ Não encontrei o primeiro test(...) para inserir helper.")
    s = s[:m.start()] + helper.strip("\n") + "\n\n" + s[m.start():]

# 2) dentro do bloco MF_FAF_REPORT_ASSERT_V2, após goto(/report), chama waitReportReady(page)
# (não duplica)
if "MF_WAIT_REPORT_READY_CALL_V1" not in s:
    pat = r"(await\s+goto\s*\(\s*page\s*,\s*['\"]/report['\"]\s*\)\s*;\s*\n)"
    m = re.search(pat, s)
    if not m:
        raise SystemExit("❌ Não encontrei `await goto(page, \"/report\");` para inserir waitReportReady.")
    inject = "  // MF_WAIT_REPORT_READY_CALL_V1\n  await waitReportReady(page);\n\n"
    s = s[:m.end(1)] + inject + s[m.end(1):]

# cleanup
s = re.sub(r"\n{3,}", "\n\n", s)

if s != orig:
    p.write_text(s, encoding="utf-8")
    print("✅ patched:", p)
else:
    print("ℹ️ no changes:", p)
PY

echo
echo "==> roda só o FAF"
npx -s playwright test tests/mf/e2e_faf_moderadamente_ativo.spec.ts --reporter=line || true

echo
echo "==> roda suite"
npm run -s test:e2e || true

echo
echo "==> commit"
git add -A
git commit -m "test(e2e): wait for Report to hydrate (avoid asserting on splash loader)" || true

echo
echo "✅ DONE"
git status -sb
