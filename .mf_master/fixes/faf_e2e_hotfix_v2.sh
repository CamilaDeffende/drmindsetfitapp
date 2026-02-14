#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/faf-e2e-hotfix2-$TS"
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

echo "==> [2] patch SplashScreen + Step2Avaliacao (idempotente)"
python3 - <<'PY2'
from __future__ import annotations
from pathlib import Path
import re, sys

def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")

def write(p: Path, s: str):
    p.write_text(s, encoding="utf-8")

# ---------------------------------------------------------
# A) Step2Avaliacao.tsx — corrigir TSX inválido
#   1) trocar data-testid=\"...\" por data-testid="..."
#   2) mover data-testid da opção moderadamente_ativo para dentro da tag
# ---------------------------------------------------------
st = Path("src/components/steps/Step2Avaliacao.tsx")
if not st.exists():
    print("❌ Step2Avaliacao.tsx não encontrado.")
    sys.exit(1)

s = read(st)
orig = s

# 1) remove escapes " especificamente em data-testid
s = s.replace('data-testid=\"', 'data-testid="').replace('\">', '">').replace('\"', '"')

# 2) consertar o caso quebrado:
# <SelectItem value="moderadamente_ativo"> data-testid="...">Moderadamente ...
s = re.sub(
    r'(<SelectItem\b[^>]*\bvalue="moderadamente_ativo"[^>]*>)\s*data-testid="mf-faf-option-moderadamente-ativo">\s*',
    r'\1',
    s
)
# garantir atributo dentro da tag de moderadamente_ativo
s = re.sub(
    r'(<SelectItem\b[^>]*\bvalue="moderadamente_ativo"(?![^>]*\bdata-testid=)[^>]*)(>)',
    r'\1 data-testid="mf-faf-option-moderadamente-ativo"\2',
    s,
    count=1
)

# também garantir SelectTrigger com aspas normais
s = re.sub(
    r'(<SelectTrigger\b[^>]*\bdata-testid=)"([^"]+)"',
    r'\1"\2"',
    s
)

if s != orig:
    write(st, s)
    print("✅ fixed Step2Avaliacao.tsx (TSX valid + testids)")
else:
    print("ℹ️ Step2Avaliacao.tsx já ok (no changes)")

# ---------------------------------------------------------
# B) SplashScreen.tsx — hook não pode ser chamado em callback
# Estratégia:
#   - capturar a primeira chamada: useMfE2EBootBypass(<args>)
#   - remover TODAS as chamadas existentes (para não ficar dentro de callback)
#   - inserir 1 chamada no topo do componente SplashScreen (corpo)
# ---------------------------------------------------------
sp = Path("src/components/branding/SplashScreen.tsx")
if not sp.exists():
    print("❌ SplashScreen.tsx não encontrado.")
    sys.exit(1)

s = read(sp)
orig = s

calls = list(re.finditer(r'\buseMfE2EBootBypass\s*\(([^)]*)\)\s*;?', s))
args = calls[0].group(1) if calls else ""

# remover todas as chamadas existentes
s = re.sub(r'\n\s*useMfE2EBootBypass\s*\([^)]*\)\s*;\s*', "\n", s)

# localizar o componente principal e inserir chamada no topo
# padrões aceitos:
# 1) function SplashScreen(...) { ... }
m1 = re.search(r'(?m)^(export\s+)?function\s+SplashScreen\s*\([^)]*\)\s*\{', s)
# 2) const SplashScreen = (...) => { ... }
m2 = re.search(r'(?m)^(export\s+)?const\s+SplashScreen\s*=\s*\([^)]*\)\s*=>\s*\{', s)

insert_pos = None
if m1:
    insert_pos = m1.end()
elif m2:
    insert_pos = m2.end()

if insert_pos is None:
    print("❌ Não consegui localizar o componente SplashScreen para inserir o hook no topo.")
    sys.exit(1)

call_line = f'\n  useMfE2EBootBypass({args});\n' if args.strip() else '\n  useMfE2EBootBypass();\n'

# idempotência: só insere se não tiver já no topo (próximas ~30 linhas)
head = s[insert_pos:insert_pos+800]
if "useMfE2EBootBypass(" not in head:
    s = s[:insert_pos] + call_line + s[insert_pos:]

if s != orig:
    write(sp, s)
    print("✅ fixed SplashScreen.tsx (hook called at top-level)")
else:
    print("ℹ️ SplashScreen.tsx já ok (no changes)")
PY2

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e"
npm run -s test:e2e

echo "==> [5] commit + push"
git add -A
git commit -m "fix(e2e): repair SplashScreen hook callsite + fix Step2 FAF testids" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
