#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/faf-e2e-hotfix4-$TS"
mkdir -p "$BKP"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
for f in \
  src/components/branding/SplashScreen.tsx \
  src/components/steps/Step2Avaliacao.tsx \
  tests/mf/e2e_faf_moderadamente_ativo.spec.ts
do
  if [ -f "$f" ]; then
    mkdir -p "$BKP/$(dirname "$f")"
    cp -a "$f" "$BKP/$f"
  fi
done
echo "✅ backup em: $BKP"

echo "==> [2] patch: SplashScreen (remove hooks) + Step2 (force valid TSX)"
python3 - <<'PY2'
from __future__ import annotations
from pathlib import Path
import re, sys

def read(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="strict")

def write(p: Path, s: str):
    p.write_text(s, encoding="utf-8")

# ---------------------------------------------------------
# A) SplashScreen.tsx
# - Converter useMfE2EBootBypass -> mfE2EBootBypass (função normal)
# - Trocar todas as chamadas para mfE2EBootBypass
# - Unwrap do useEffect dentro do bypass (se existir)
# ---------------------------------------------------------
sp = Path("src/components/branding/SplashScreen.tsx")
if not sp.exists():
    print("❌ SplashScreen.tsx não encontrado.")
    sys.exit(1)

s = read(sp)
orig = s

s = re.sub(r"(?m)^(\s*function\s+)useMfE2EBootBypass(\s*\()",
           r"\1mfE2EBootBypass\2", s)
s = re.sub(r"(?m)^(\s*const\s+)useMfE2EBootBypass(\s*=\s*)",
           r"\1mfE2EBootBypass\2", s)

s = re.sub(r"\buseMfE2EBootBypass\s*\(", "mfE2EBootBypass(", s)

def unwrap_use_effect(block: str) -> str:
    pat = re.compile(r"useEffect\s*\(\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[[\s\S]*?\]\s*\)\s*;?")
    m = pat.search(block)
    if not m:
        pat2 = re.compile(r"useEffect\s*\(\s*\(\s*\)\s*=>\s*\{([\s\S]*?)\}\s*,\s*\[\s*\]\s*\)\s*;?")
        m = pat2.search(block)
    if not m:
        return block
    inner = m.group(1).rstrip()
    repl = "try {\n" + inner + "\n} catch (e) { /* MF_E2E_BYPASS_SAFE */ }\n"
    return block[:m.start()] + repl + block[m.end():]

mfun = re.search(r"(?s)(function\s+mfE2EBootBypass\s*\([^)]*\)\s*\{)([\s\S]*?)(\n\})", s)
if mfun:
    body = mfun.group(2)
    body2 = unwrap_use_effect(body)
    if body2 != body:
        s = s[:mfun.start(2)] + body2 + s[mfun.end(2):]

mconst = re.search(r"(?s)(const\s+mfE2EBootBypass\s*=\s*\([^)]*\)\s*=>\s*\{)([\s\S]*?)(\n\}\s*;)", s)
if mconst:
    body = mconst.group(2)
    body2 = unwrap_use_effect(body)
    if body2 != body:
        s = s[:mconst.start(2)] + body2 + s[mconst.end(2):]

if s != orig:
    write(sp, s)
    print("✅ SplashScreen.tsx: removed hook usage (no rules-of-hooks)")
else:
    print("ℹ️ SplashScreen.tsx: no changes")

# ---------------------------------------------------------
# B) Step2Avaliacao.tsx
# - remover invisíveis + escapes \"
# - garantir SelectTrigger testid
# - FORÇAR a opção moderadamente_ativo para TSX canônico e válido
# ---------------------------------------------------------
st = Path("src/components/steps/Step2Avaliacao.tsx")
if not st.exists():
    print("❌ Step2Avaliacao.tsx não encontrado.")
    sys.exit(1)

s = read(st)
orig = s

for ch in ["\ufeff","\u200b","\u200c","\u200d","\u2060","\u2028","\u2029"]:
    s = s.replace(ch, "")
s = "".join(c for c in s if (ord(c) >= 32) or (c in "\n\t\r"))

s = s.replace('\\"', '"').replace("\\'", "'")

s = re.sub(r'(<SelectTrigger\b(?![^>]*\bdata-testid=)[^>]*)(>)',
           r'\1 data-testid="mf-faf-select"\2', s, count=1)

pat_item = re.compile(r'(?s)<SelectItem\b[^>]*\bvalue="moderadamente_ativo"[^>]*>.*?</SelectItem>')
s = pat_item.sub(
    '<SelectItem value="moderadamente_ativo" data-testid="mf-faf-option-moderadamente-ativo">Moderadamente ativo (1 a 3x/semana)</SelectItem>',
    s,
    count=1
)

if s != orig:
    write(st, s)
    print("✅ Step2Avaliacao.tsx: forced valid TSX for FAF option + cleaned escapes")
else:
    print("ℹ️ Step2Avaliacao.tsx: no changes")
PY2

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e"
npm run -s test:e2e

echo "==> [5] commit + push"
git add -A
git commit -m "fix(e2e): remove hook misuse in SplashScreen + fix Step2 FAF TSX/testids" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
