#!/usr/bin/env bash
set -euo pipefail

BRANCH="feat/phases-6-11"
TS="$(date +%Y%m%d_%H%M%S)"
BKP=".backups/e2e-faf-fix-python-to-ts-$TS"
FILE="tests/mf/e2e_faf_moderadamente_ativo.spec.ts"

echo "==> [0] branch guard"
git rev-parse --abbrev-ref HEAD | grep -qx "$BRANCH" || { echo "❌ Você não está na branch $BRANCH"; exit 1; }

echo "==> [1] backup"
mkdir -p "$BKP/$(dirname "$FILE")"
cp -a "$FILE" "$BKP/$FILE"
echo "✅ backup em: $BKP"

echo "==> [2] patch TS: remove python-like block and replace with valid TS"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("tests/mf/e2e_faf_moderadamente_ativo.spec.ts")
s = p.read_text(encoding="utf-8")
orig = s

# 1) Corrigir bloco python-like (if (btn2): try: except ...)
# Troca qualquer bloco com "if (btn2):" até "pass" / "except" por TS válido.
pat = re.compile(r"""
const\s+btn2\s*=\s*await\s+mfFindNextButton\(page\);\s*
\s*if\s*\(btn2\)\s*:\s*
[\s\S]*?
await\s+faf\.waitFor\(
""", re.VERBOSE)

def repl(m):
    return (
        "const btn2 = await mfFindNextButton(page);\n"
        "    if (btn2) {\n"
        "      try {\n"
        "        await btn2.click({ timeout: 8000 });\n"
        "      } catch {\n"
        "        // ignore\n"
        "      }\n"
        "    }\n\n"
        "    await faf.waitFor("
    )

s2, n = pat.subn(repl, s, count=1)

# 2) Se o padrão acima não bater (porque o arquivo mudou um pouco),
# faz uma correção cirúrgica só na sintaxe python encontrada
if n == 0:
    s2 = s
    s2 = s2.replace("if (btn2):", "if (btn2) {")
    s2 = s2.replace("try:", "try {")
    s2 = s2.replace("except Exception:", "} catch {")
    # remove linhas 'pass' comuns
    s2 = re.sub(r"(?m)^\s*pass\s*$", "      // ignore", s2)
    # garante fechamento de chaves antes do await faf.waitFor
    # (se já estiver ok, não muda)
    s2 = re.sub(r"(\}\s*catch\s*\{\s*\n\s*// ignore\s*\n\s*\})(\s*await\s+faf\.waitFor)",
                r"\1\n    }\n\n    \2", s2)

# sanity: não pode sobrar ":" após if/try/except python
if re.search(r"(?m)^\s*if\s*\([^)]+\)\s*:\s*$", s2) or "except Exception" in s2:
    raise SystemExit("❌ Ainda sobrou sintaxe Python no TS. Abra o arquivo e procure por ':' ou 'except'.")

if s2 == orig:
    raise SystemExit("❌ Nenhuma mudança aplicada (o bloco pode já estar corrigido).")

p.write_text(s2, encoding="utf-8")
print("✅ patched:", p)
PY

echo "==> [3] verify"
npm run -s verify

echo "==> [4] e2e (apenas este spec) — caminho fixo (sem depender de \$SPEC)"
npx playwright test tests/mf/e2e_faf_moderadamente_ativo.spec.ts --workers=1

echo "==> [5] e2e (suite completa)"
npm run -s test:e2e

echo "==> [6] commit + push"
git add -A
git commit -m "test(e2e): fix accidental Python syntax in FAF spec + run by fixed path" || echo "ℹ️ nada para commitar"
git push -u origin "$BRANCH"

echo "✅ DONE"
