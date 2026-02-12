#!/usr/bin/env bash
set -euo pipefail

FILE="src/pages/Report.tsx"

if [ ! -f "$FILE" ]; then
  echo "❌ Não achei $FILE"
  exit 1
fi

echo "==> backup"
mkdir -p .backups/report_fix
cp -a "$FILE" ".backups/report_fix/Report.tsx.$(date +%Y%m%d_%H%M%S).bak"

echo "==> patch fragment wrapper (apenas se MF_REPORT_FAF_BLOCK_V1 existir)"
python3 - <<'PY'
from pathlib import Path
import re

p = Path("src/pages/Report.tsx")
s = p.read_text(encoding="utf-8")
orig = s

if "MF_REPORT_FAF_BLOCK_V1" not in s:
    print("ℹ️ MF_REPORT_FAF_BLOCK_V1 não encontrado. Nada a fazer.")
    raise SystemExit(0)

# já está com fragment?
if "MF_REPORT_FAF_FRAGMENT_WRAP_V1" in s:
    print("ℹ️ já está embrulhado em fragment (MF_REPORT_FAF_FRAGMENT_WRAP_V1).")
    raise SystemExit(0)

# 1) localizar o 'return (' que precede o bloco FAF
marker = "/* MF_REPORT_FAF_BLOCK_V1 */"
idx = s.find(marker)
if idx < 0:
    raise SystemExit("❌ marker não encontrado (inesperado).")

# achar o return( mais próximo ANTES do marker
before = s[:idx]
mret = list(re.finditer(r'(?m)^\s*return\s*\(\s*$', before))
if not mret:
    # fallback: return ( na mesma linha
    mret = list(re.finditer(r'(?m)^\s*return\s*\(\s*$', before))
if not mret:
    raise SystemExit("❌ Não encontrei `return (` antes do bloco FAF.")

ret = mret[-1]
ret_line_start = ret.start()

# indent do return
ret_line = before[ret.start():before.find("\n", ret.start())]
indent = re.match(r'^\s*', ret_line).group(0)

# 2) inserir "<>" logo após "return ("
# transforma:
# return (
#   {/* MF_REPORT... */}
# em:
# return (
#   <> // MF_REPORT_FAF_FRAGMENT_WRAP_V1
#     {/* MF_REPORT... */}
insert_after = ret.end()
s2 = s[:insert_after] + f"\n{indent}  <>{{/* MF_REPORT_FAF_FRAGMENT_WRAP_V1 */}}\n" + s[insert_after:]

# 3) achar o fechamento do return: a primeira linha ");"
# com indent compatível (mesmo indent do return) depois do return
# e inserir "</>" imediatamente antes.
after_pos = insert_after + len(f"\n{indent}  <>{{/* MF_REPORT_FAF_FRAGMENT_WRAP_V1 */}}\n")
tail = s2[after_pos:]

close_pat = re.compile(rf'(?m)^{re.escape(indent)}\)\s*;\s*$')
mclose = close_pat.search(tail)
if not mclose:
    # fallback: ")\s*;" com indent 0 (em alguns formatos)
    mclose = re.search(r'(?m)^\s*\)\s*;\s*$', tail)
    if not mclose:
        raise SystemExit("❌ Não encontrei linha de fechamento `);` do return para inserir </>.")

close_at = after_pos + mclose.start()

s3 = s2[:close_at] + f"{indent}  </>\n" + s2[close_at:]

# cleanup: reduzir quebras excessivas
s3 = re.sub(r"\n{3,}", "\n\n", s3)

if s3 == orig:
    print("ℹ️ no changes (inesperado)")
else:
    p.write_text(s3, encoding="utf-8")
    print("✅ patched:", p)
PY

echo "==> verify"
npm run -s verify

echo "==> commit"
git add -A
git commit -m "fix(report): wrap return in fragment after FAF injection (TSX parse fix)" || true

echo "✅ DONE"
git status -sb
