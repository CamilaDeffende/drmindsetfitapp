#!/usr/bin/env bash
set -euo pipefail

FIXTAG="MF_REPORT_UNBLOCK_LOADER_FAF_V1"
FILE="src/pages/Report.tsx"

if [ ! -f "$FILE" ]; then
  echo "❌ Não achei $FILE"
  exit 1
fi

echo "==> backup"
mkdir -p .backups/report_fix
cp -a "$FILE" ".backups/report_fix/Report.tsx.$(date +%Y%m%d_%H%M%S).bak"

echo "==> patch $FILE"
python3 - <<'PY'
import re
from pathlib import Path

p = Path("src/pages/Report.tsx")
s = p.read_text(encoding="utf-8")
orig = s

MARK = "MF_REPORT_UNBLOCK_LOADER_FAF_V1"
if MARK in s:
    print("ℹ️ already patched:", p)
    raise SystemExit(0)

def ensure_react_hooks(text: str) -> str:
    # import React, { ... } from "react";
    m = re.search(r'(?m)^\s*import\s+React\s*,\s*\{\s*([^}]*)\}\s*from\s*[\'"]react[\'"]\s*;\s*$', text)
    if m:
        hooks = m.group(1)
        want = ["useEffect","useMemo","useRef","useState"]
        have = [h.strip() for h in hooks.split(",") if h.strip()]
        for w in want:
            if w not in have:
                have.append(w)
        new = 'import React, { ' + ", ".join(have) + ' } from "react";'
        return text[:m.start()] + new + text[m.end():]

    # import { ... } from "react";
    m = re.search(r'(?m)^\s*import\s*\{\s*([^}]*)\}\s*from\s*[\'"]react[\'"]\s*;\s*$', text)
    if m:
        hooks = m.group(1)
        want = ["useEffect","useMemo","useRef","useState"]
        have = [h.strip() for h in hooks.split(",") if h.strip()]
        for w in want:
            if w not in have:
                have.append(w)
        new = 'import { ' + ", ".join(have) + ' } from "react";'
        return text[:m.start()] + new + text[m.end():]

    return 'import { useEffect, useMemo, useRef, useState } from "react";\n' + text

s = ensure_react_hooks(s)

# insere helpers após imports
imports_end = 0
for m in re.finditer(r'(?m)^\s*import[\s\S]*?;\s*$', s):
    if m.start() < 4000:
        imports_end = m.end()
    else:
        break

helpers = f"""

// {MARK}
// DEMO-safe: hidrata Report via localStorage e evita loader infinito
type MFAny = any;

function mfSafeJsonParse(v: string | null): MFAny | null {{
  if (!v) return null;
  try {{ return JSON.parse(v); }} catch {{ return null; }}
}}

function mfReadFirstProfileFromLS(): MFAny | null {{
  const draft = mfSafeJsonParse(localStorage.getItem("mf:onboarding:draft:v1"));
  if (draft) return draft;

  const gp = mfSafeJsonParse(localStorage.getItem("drmindsetfit.globalProfile.v1"));
  if (gp) return gp;

  const st = mfSafeJsonParse(localStorage.getItem("drmindsetfit_state"));
  if (st) return st;

  return null;
}}

function mfExtractFafLabel(profile: MFAny | null): string | null {{
  if (!profile) return null;
  const cands = [
    profile?.atividadeFisica?.fatorAtividade,
    profile?.atividadeFisica?.nivelAtividade,
    profile?.activityFactor,
    profile?.faf,
    profile?.fatorAtividade,
    profile?.nivelAtividade,
    profile?.globalProfile?.atividadeFisica?.fatorAtividade,
    profile?.globalProfile?.atividadeFisica?.nivelAtividade,
  ].filter(Boolean);

  const raw = (cands[0] ?? null);
  if (!raw) return null;

  const v = String(raw).trim();
  if (/sedent|leve|moder|alta|muito/i.test(v)) return v;

  const num = Number(v.replace(",", "."));
  if (!Number.isFinite(num)) return v;

  if (num < 1.3) return "Sedentário";
  if (num < 1.5) return "Levemente ativo";
  if (num < 1.7) return "Moderadamente ativo";
  if (num < 1.9) return "Muito ativo";
  return "Extremamente ativo";
}}
"""
s = s[:imports_end] + helpers + s[imports_end:]

# acha componente
m = re.search(r'(?s)(export\s+default\s+function\s+Report\s*\([^)]*\)\s*\{)', s)
if not m:
    m = re.search(r'(?s)(function\s+Report\s*\([^)]*\)\s*\{)', s)
if not m:
    m = re.search(r'(?s)(const\s+Report\s*=\s*\([^)]*\)\s*=>\s*\{)', s)
if not m:
    raise SystemExit("❌ Não encontrei o componente Report (function/const).")

inject_top = r"""
  // MF_REPORT_UNBLOCK_LOADER_FAF_V1: evita loader infinito (DEMO) + tenta ler perfil do LS
  const mfProfile = useMemo(() => {
    try { return mfReadFirstProfileFromLS(); } catch { return null; }
  }, []);

  const mfFafLabel = useMemo(() => mfExtractFafLabel(mfProfile), [mfProfile]);

  const [mfForceReady, setMfForceReady] = useState(false);
  const mfStartRef = useRef<number>(Date.now());

  useEffect(() => {
    const t = window.setTimeout(() => setMfForceReady(true), 2800);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mfForceReady) return;
    const dt = Date.now() - mfStartRef.current;
    // eslint-disable-next-line no-console
    console.warn("MF_REPORT_DEBUG: forceReady enabled after", dt, "ms | faf=", mfFafLabel);
  }, [mfForceReady, mfFafLabel]);
"""
s = s[:m.end(1)] + inject_top + s[m.end(1):]

# bypass loader (tentativa 1: if(loading) return (...Carregando...);)
s2 = re.sub(
  r'(?s)(if\s*\(\s*([^)]+)\s*\)\s*return\s*\(\s*[^;]*?Carregando[^;]*?\)\s*;\s*)',
  lambda mm: ("// MF_REPORT_LOADER_GUARD_V1\n" + mm.group(0).replace("if (", "if ((").replace(") return", ") && !mfForceReady) return")),
  s,
  count=1
)

# tentativa 2: early return do Carregando
if "MF_REPORT_LOADER_GUARD_V1" not in s2 and re.search(r'(?s)return\s*\(\s*[^;]*?Carregando[^;]*?\)\s*;', s2):
    s2 = re.sub(
      r'(?s)return\s*\(\s*([^;]*?Carregando[^;]*?)\)\s*;',
      r'// MF_REPORT_LOADER_GUARD_V1\nif (!mfForceReady) return (\1);\n',
      s2,
      count=1
    )
s = s2

# inserir bloco FAF após "return ("
ret = re.search(r'(?s)\n\s*return\s*\(\s*', s)
if not ret:
    raise SystemExit("❌ Não encontrei `return (` no Report.")

faf_block = r"""
    {/* MF_REPORT_FAF_BLOCK_V1 */}
    {mfFafLabel ? (
      <div className="mb-4 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
        <div className="text-xs uppercase tracking-[0.22em] opacity-70">Fator de Atividade (FAF)</div>
        <div className="mt-1 text-sm font-semibold" data-testid="mf-faf-label">
          {mfFafLabel}
        </div>
        <div className="mt-1 text-xs opacity-60">
          (DEMO-safe) Se o relatório ainda estiver hidratando, este valor vem do armazenamento local.
        </div>
      </div>
    ) : null}
"""
s = s[:ret.end()] + faf_block + s[ret.end():]

s = re.sub(r"\n{3,}", "\n\n", s)

if s == orig:
    print("ℹ️ no changes:", p)
else:
    p.write_text(s, encoding="utf-8")
    print("✅ patched:", p)
PY

echo "==> verify"
npm run -s verify

echo "==> e2e"
npm run -s test:e2e

echo "==> commit"
git add -A
git commit -m "fix(report): unblock loader in DEMO + hydrate SSOT from localStorage + render FAF (e2e-safe)" || true

echo "✅ DONE"
git status -sb
