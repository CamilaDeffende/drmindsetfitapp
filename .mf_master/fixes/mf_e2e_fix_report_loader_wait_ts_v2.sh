#!/usr/bin/env bash
set -euo pipefail
TS="$(date +%Y%m%d_%H%M%S)"
F="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

mkdir -p .backups/e2e/tests
cp -a "$F" ".backups/e2e/tests/e2e_faf_moderadamente_ativo.spec.ts.bak.${TS}"

echo "==> patch: consertar waitReportReady (remover sintaxe Python, colocar TS válido)"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

# bloco TS correto
new_fn = r'''
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
    try {
      const count = await splash.count();
      if (count === 0) return;

      const vis = await splash.first().isVisible().catch(() => false);
      if (!vis) return;
    } catch (_e) {
      return;
    }

    // se já pintou “cara de report” (heurística: algum texto típico de relatório/resultado)
    const body = await page.locator("body").innerText().catch(() => "");
    if (/(relat|report|pdf|plano|resultado|dieta|macros|kcal)/i.test(body)) return;

    await page.waitForTimeout(800);
  }
}
'''.strip("\n")

# substitui a função inteira, se existir
pat = r'(?s)async function waitReportReady\s*\(\s*page\s*:\s*any\s*\)\s*\{.*?\n\}\n'
m = re.search(pat, s)
if not m:
    raise SystemExit("❌ Não encontrei a função waitReportReady(page:any) para substituir. Procure por MF_WAIT_REPORT_READY_V1 no arquivo.")

s2 = s[:m.start()] + new_fn + "\n\n" + s[m.end():]

# cleanup
s2 = re.sub(r"\n{3,}", "\n\n", s2)

if s2 != orig:
    p.write_text(s2, encoding="utf-8")
    print("✅ patched:", p)
else:
    print("ℹ️ no changes:", p)
PY

echo
echo "==> tsc (rápido)"
npx -s tsc --noEmit

echo
echo "==> roda só o FAF"
npx -s playwright test tests/mf/e2e_faf_moderadamente_ativo.spec.ts --reporter=line || true

echo
echo "==> roda suite"
npm run -s test:e2e || true

echo
echo "==> commit"
git add -A
git commit -m "test(e2e): fix waitReportReady helper TS syntax (remove pythonisms)" || true

echo
echo "✅ DONE"
git status -sb
