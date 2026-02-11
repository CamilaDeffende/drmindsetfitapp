#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1

F="src/components/steps/Step2Avaliacao.tsx"
test -f "$F" || { echo "❌ faltando: $F"; exit 2; }

echo "==> backup"
TS="$(date +%Y%m%d_%H%M%S)"
mkdir -p .backups/step2
cp -a "$F" ".backups/step2/Step2Avaliacao.$TS.tsx"

python3 - <<'PY'
from pathlib import Path

p = Path("src/components/steps/Step2Avaliacao.tsx")
s = p.read_text(encoding="utf-8")
lines = s.splitlines(True)

marker = "BLOCO 5A — Frequência semanal"
start = None
for i, ln in enumerate(lines):
    if marker in ln:
        start = i
        break
if start is None:
    raise SystemExit("❌ Não achei o marcador do BLOCO 5A.")

# acha a primeira <div ... p-4> depois do marcador
open_idx = None
for i in range(start, len(lines)):
    if className=mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 in lines[i]:
        open_idx = i
        break
if open_idx is None:
    raise SystemExit("❌ Não achei a abertura do quadro (div mt-6 ... p-4).")

# conta divs até fechar
depth = 0
end = None
for i in range(open_idx, len(lines)):
    ln = lines[i]
    if "<div" in ln:
        depth += ln.count("<div")
    if "</div>" in ln:
        depth -= ln.count("</div>")
        if depth <= 0:
            end = i
            break
if end is None:
    raise SystemExit("❌ Não consegui achar o fechamento do quadro.")

out = lines[:start] + ["\n"] + lines[end+1:]
s2 = "".join(out)

needles = ["BLOCO 5A", "nivelAtividadeSemanal", "Toque para selecionar"]
still = [x for x in needles if x in s2]
if still:
    raise SystemExit("❌ Sanity falhou: ainda sobrou: " + ", ".join(still))

p.write_text(s2, encoding="utf-8")
print(f"✅ removed BLOCO 5A in: {p} (lines {start+1}..{end+1})")
PY

echo "==> sanity preview"
rg -n "BLOCO 5A|nivelAtividadeSemanal|Toque para selecionar" -S "$F" && { echo "❌ ainda sobrou"; exit 3; } || echo "✅ sumiu do Step2Avaliacao"
