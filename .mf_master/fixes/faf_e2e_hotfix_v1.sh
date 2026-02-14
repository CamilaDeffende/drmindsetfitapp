#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/faf-e2e-hotfix-$TS"
mkdir -p "$BKP"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
for f in     src/components/branding/SplashScreen.tsx     src/components/steps/Step2Avaliacao.tsx     tests/mf/e2e_faf_moderadamente_ativo.spec.ts
do
  if [ -f "$f" ]; then
    mkdir -p "$BKP/$(dirname "$f")"
    cp -a "$f" "$BKP/$f"
  fi
done
echo "✅ backup em: $BKP"

echo "==> [2] patch hooks + sanitize + E2E fallback"
python3 - <<'PY2'
from __future__ import annotations
from pathlib import Path
import re, sys

def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")

def write(p: Path, s: str):
    p.write_text(s, encoding="utf-8")

# A) SplashScreen.tsx: rules-of-hooks (mfE2EBootBypass -> useMfE2EBootBypass)
sp = Path("src/components/branding/SplashScreen.tsx")
if sp.exists():
    s = read(sp); orig = s

    s = re.sub(r"(?m)^(\s*function\s+)mfE2EBootBypass(\s*\()",
               r"\1useMfE2EBootBypass\2", s)
    s = re.sub(r"(?m)^(\s*const\s+)mfE2EBootBypass(\s*=\s*)",
               r"\1useMfE2EBootBypass\2", s)
    s = re.sub(r"\bmfE2EBootBypass\s*\(", "useMfE2EBootBypass(", s)

    if s != orig:
        write(sp, s)
        print(f"✅ fixed hooks naming: {sp}")
    else:
        print(f"ℹ️ no changes: {sp}")
else:
    print("⚠️ SplashScreen.tsx não encontrado (skip).")

# B) Step2Avaliacao.tsx: remove caracteres inválidos e garante testids
st = Path("src/components/steps/Step2Avaliacao.tsx")
if st.exists():
    s = read(st); orig = s

    # remove BOM + zero width + line/para separators
    for ch in ["\ufeff","\u200b","\u200c","\u200d","\u2060","\u2028","\u2029"]:
        s = s.replace(ch, "")

    # remove control chars (exceto \n \t \r)
    s = "".join(c for c in s if (ord(c) >= 32) or (c in "\n\t\r"))

    # garante testid no trigger do Select (primeira ocorrência)
    s = re.sub(r"(<SelectTrigger\b(?![^>]*\bdata-testid=)[^>]*)(>)",
               r"\1 data-testid=\"mf-faf-select\"\2", s, count=1)

    # garante testid no combobox (primeira ocorrência)
    s = re.sub(r"(<button\b(?![^>]*\bdata-testid=)(?=[^>]*\brole\s*=\s*\"combobox\")[^>]*)(>)",
               r"\1 data-testid=\"mf-faf-select\"\2", s, count=1)

    # garante testid na opção "Moderadamente ativo ..." (SelectItem / CommandItem)
    s = re.sub(
        r"(<SelectItem\b(?![^>]*\bdata-testid=)[^>]*>)(\s*Moderadamente ativo[^\n<]*)(</SelectItem>)",
        r"\1 data-testid=\"mf-faf-option-moderadamente-ativo\">\2\3",
        s
    )
    s = re.sub(
        r"(<CommandItem\b(?![^>]*\bdata-testid=)[^>]*>)(\s*Moderadamente ativo[^\n<]*)(</CommandItem>)",
        r"\1 data-testid=\"mf-faf-option-moderadamente-ativo\">\2\3",
        s
    )

    if s != orig:
        write(st, s)
        print(f"✅ sanitized + ensured FAF testids: {st}")
    else:
        print(f"ℹ️ no changes: {st}")
else:
    print("⚠️ Step2Avaliacao.tsx não encontrado (skip).")

# C) E2E spec: fallback por texto deve aceitar sufixo
spec = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
if spec.exists():
    s = read(spec); orig = s
    s = s.replace(
        'page.getByText("Moderadamente ativo", { exact: true })',
        'page.getByText(/Moderadamente ativo/i)'
    )
    if s != orig:
        write(spec, s)
        print(f"✅ adjusted E2E fallback: {spec}")
    else:
        print(f"ℹ️ no changes: {spec}")
else:
    print("⚠️ E2E spec não encontrado (skip).")
PY2

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e"
npm run -s test:e2e

echo "==> [5] commit + push"
git add -A
git commit -m "fix(e2e): hooks naming + Step2 sanitize + FAF testids" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
