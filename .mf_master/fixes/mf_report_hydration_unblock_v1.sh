#!/usr/bin/env bash
set -euo pipefail
TS="$(date +%Y%m%d_%H%M%S)"

mkdir -p .backups/report

echo "==> localizar Report (tentativa: src/pages/Report*.tsx)"
CAND="$(ls -1 src/pages/Report*.tsx 2>/dev/null | head -n 1 || true)"
if [ -z "${CAND}" ]; then
  echo "❌ Não achei src/pages/Report*.tsx. Rode: ls -la src/pages | rg -i 'report' e me mande."
  exit 1
fi
echo "==> target:", "$CAND"

cp -a "$CAND" ".backups/report/$(basename "$CAND").bak.${TS}"

echo "==> patch: adicionar debug + fallback SSOT p/ sair do loader"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/pages")  # base
# acha arquivo Report*.tsx de novo aqui dentro
files = sorted(Path("src/pages").glob("Report*.tsx"))
if not files:
    raise SystemExit("❌ Não encontrei src/pages/Report*.tsx")
f = files[0]
s = f.read_text(encoding="utf-8")
orig = s

TOP = "// MF_REPORT_HYDRATION_UNBLOCK_V1"
if TOP not in s.splitlines()[:40]:
    s = TOP + "\n" + s

# 1) Injetar helper de debug+fallback (não quebra se não usado)
helper = r"""
// MF_REPORT_HYDRATION_HELPERS_V1
function mfReadAllLocalStorage(): Record<string, string> {
  try {
    const out: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      out[k] = localStorage.getItem(k) || "";
    }
    return out;
  } catch {
    return {};
  }
}

function mfPickFAF(ls: Record<string, string>): string | null {
  const needles = ["moderadamente_ativo", "sedentario", "leve", "muito_ativo", "extremamente_ativo"];
  for (const k of Object.keys(ls)) {
    const v = ls[k] || "";
    for (const n of needles) {
      if (v.includes(n)) return n;
    }
  }
  return null;
}
"""

if "MF_REPORT_HYDRATION_HELPERS_V1" not in s:
    # coloca depois dos imports (após último import)
    m = list(re.finditer(r"(?m)^\s*import\s.+?;\s*$", s))
    if m:
        last = m[-1].end()
        s = s[:last] + "\n" + helper + "\n" + s[last:]
    else:
        s = helper + "\n" + s

# 2) Detectar loader "Carregando..." e adicionar log/escape.
# Heurística: procurar return com "Carregando" ou splash
# Vamos inserir um bloco de debug no início do componente (primeiro "{")
# tentando achar "function Report" ou "const Report"
comp = re.search(r"(?s)(function\s+Report\w*\s*\([^)]*\)\s*\{)", s) or re.search(r"(?s)(const\s+Report\w*\s*=\s*\([^)]*\)\s*=>\s*\{)", s)
if comp and "MF_REPORT_DEBUG_ONCE_V1" not in s:
    insert_at = comp.end(1)
    inject = r"""
  // MF_REPORT_DEBUG_ONCE_V1
  const __mfReportLogged = (globalThis as any).__mfReportLogged;
  if (!__mfReportLogged) {
    try {
      (globalThis as any).__mfReportLogged = true;
      const ls = mfReadAllLocalStorage();
      const faf = mfPickFAF(ls);
      console.warn("MF_REPORT_DEBUG: boot", { url: location.href, faf, keys: Object.keys(ls).slice(0, 30) });
    } catch {}
  }

"""
    s = s[:insert_at] + inject + s[insert_at:]

# 3) Se existir condição tipo "if (loading) return <...Carregando...>"
# vamos tentar converter para "espera curta" + fallback (não travar infinito).
# Heurística: encontrar bloco com Carregando... e inserir um timeout guard.
if "MF_REPORT_LOADER_GUARD_V1" not in s:
    # acha um "Carregando" no JSX
    if re.search(r"Carregando\.\.\.|Carregando\.\.\.|Carregando", s):
        # injeta um useEffect/useRef básico para não ficar infinito em DEMO
        # apenas se já existir React import/useEffect. Se não, não mexe.
        if "useEffect" in s and "useRef" in s:
            pass

# Não vamos mexer agressivo sem ver a estrutura real do Report.
# Aqui o patch é só instrumentation seguro (debug). Fallback SSOT real eu faço no próximo patch mirando onde o Report lê o FAF.

if s != orig:
    f.write_text(s, encoding="utf-8")
    print("✅ patched:", f)
else:
    print("ℹ️ no changes:", f)
PY

echo
echo "==> verify (BUILD VERDE)"
npm run -s verify

echo
echo "==> commit"
git add -A
git commit -m "debug(report): instrument hydration to diagnose loader (MF_REPORT_DEBUG)" || true

echo
echo "✅ DONE"
git status -sb
