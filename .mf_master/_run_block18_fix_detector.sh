#!/usr/bin/env bash
set -euo pipefail
cd "/Users/luizhenriquealexandrepereira/Desktop/DrMindsetfitapp"

echo "============================================================"
echo "✅ BLOCO 18.3 | Fix detector do mf_doctor (evitar falso-positivo)"
echo "============================================================"

cat > .mf_master/mf_doctor.sh <<'DOCTOR'
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "============================================================"
echo "🩺 mf_doctor | Guardrails + Scan + Verify (macOS-safe)"
echo "ROOT: $ROOT"
echo "============================================================"

echo
echo "[mf_doctor] (0) Sanity: repo + branch"
git rev-parse --is-inside-work-tree >/dev/null
git status -sb || true

echo
echo "[mf_doctor] (1) Ensure quarantine exists"
mkdir -p .mf_master/_quarantine .mf_master/_broken

echo
echo "[mf_doctor] (2) Check: bash -n em scripts .sh (somente .mf_master)"
fail=0

# Lista scripts .sh em .mf_master (exclui quarantine/broken)
while IFS= read -r f; do
  [ -z "$f" ] && continue
  if ! bash -n "$f" >/dev/null 2>&1; then
    echo "❌ bash -n FAIL: $f"
    bash -n "$f" || true
    fail=1
  else
    echo "✅ bash -n OK: $f"
  fi
done < <(find .mf_master -type f -name "*.sh" \
  -not -path ".mf_master/_quarantine/*" \
  -not -path ".mf_master/_broken/*" \
  -print | sort)

echo
echo "[mf_doctor] (3) Detectar prompts de terminal colados (somente início de linha) + terminadores vazando"
markers=(PY NODE TSX BASH EOF)

# Detecta apenas prompts reais no começo da linha:
# - "heredoc>"
# - "pipe dquote>"
# - "dquote>"
# (não busca pipes genéricos para evitar falso-positivo)
JUNK_RE='^(heredoc>|pipe dquote>|dquote>)'

# Excluir o próprio mf_doctor e runners (eles contêm padrões de detecção por design)
EXCLUDE_RE='\.mf_master/(mf_doctor\.sh|_run_block18.*\.sh|_run_block18_fix_detector\.sh)$'

while IFS= read -r f; do
  [ -z "$f" ] && continue
  if [[ "$f" =~ $EXCLUDE_RE ]]; then
    continue
  fi

  if rg -n "$JUNK_RE" "$f" >/dev/null 2>&1; then
    echo "❌ Prompt de terminal colado detectado em: $f"
    rg -n "$JUNK_RE" "$f" || true
    fail=1
  fi

  for m in "${markers[@]}"; do
    open_count="$(rg -n "<<" "$f" | rg -c "(<<-?\\s*['\\\"]?$m['\\\"]?\\s*$|<<-?\\s*['\\\"]?$m['\\\"]?)" || true)"
    end_count="$(rg -n "^[[:space:]]*$m[[:space:]]*$" "$f" -c || true)"

    if [ "${end_count:-0}" -gt 0 ] && [ "${open_count:-0}" -eq 0 ]; then
      echo "❌ Vazamento provável: terminador '$m' sem abertura heredoc em $f (end=$end_count open=$open_count)"
      fail=1
    fi

    if [ "${end_count:-0}" -gt "${open_count:-0}" ]; then
      echo "❌ Vazamento provável: '$m' aparece mais vezes que aberturas em $f (end=$end_count open=$open_count)"
      fail=1
    fi
  done
done < <(find .mf_master -type f -name "*.sh" \
  -not -path ".mf_master/_quarantine/*" \
  -not -path ".mf_master/_broken/*" \
  -print | sort)

if [ "$fail" -ne 0 ]; then
  echo
  echo "🚫 mf_doctor FAIL: script com sintaxe quebrada OU prompt colado OU vazamento heredoc."
  echo "➡️ Ação: mover para .mf_master/_quarantine/ ou corrigir."
  exit 2
fi

echo
echo "✅ .mf_master OK (bash -n OK + sem lixo no início de linha + sem vazamento clássico)"
echo

echo "[mf_doctor] (4) VERIFY (BUILD VERDE)"
npm run -s verify
echo "✅ VERIFY OK"
echo

echo "[mf_doctor] ✅ ALL GREEN"
DOCTOR

chmod +x .mf_master/mf_doctor.sh

echo "==> Rodar mf_doctor (detector fixado)"
.mf_master/mf_doctor.sh

echo
echo "==> COMMIT + TAG"
git add .mf_master/mf_doctor.sh .mf_master/_run_block18_fix_detector.sh .gitignore || true
git commit -m "chore(block18): fix mf_doctor false-positive junk detector (build green)" || echo "ℹ️ Nada para commitar."
git push origin main

TAG="freeze-block18-doctor-guardrails-v1.0.3"
git tag -f "$TAG"
git push origin -f "$TAG"

echo
echo "============================================================"
echo "✅ BLOCO 18.3 OK | BUILD VERDE | TAG $TAG"
echo "============================================================"
