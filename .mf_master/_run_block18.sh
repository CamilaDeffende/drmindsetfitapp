#!/usr/bin/env bash
set -euo pipefail
cd "/Users/luizhenriquealexandrepereira/Desktop/DrMindsetfitapp"

echo "============================================================"
echo "✅ BLOCO 18 (RUNNER) | mf_doctor bash puro + tag freeze"
echo "============================================================"

mkdir -p .mf_master .mf_master/_quarantine .mf_master/_broken

echo "==> Harden .gitignore (quarantine/broken)"
touch .gitignore
if ! rg -n "^# MindsetFit master tooling" .gitignore >/dev/null 2>&1; then
  cat >> .gitignore <<'GITIGNORE'

# MindsetFit master tooling
.mf_master/_quarantine/**
.mf_master/_broken/**
GITIGNORE
fi

echo "==> Criar .mf_master/mf_doctor.sh"
cat > .mf_master/mf_doctor.sh <<'DOCTOR'
#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "============================================================"
echo "🩺 mf_doctor | Guardrails + Scan + Verify"
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

mapfile -t SHS < <(find .mf_master -type f -name "*.sh" \
  -not -path ".mf_master/_quarantine/*" \
  -not -path ".mf_master/_broken/*" \
  -print | sort)

if [ "${#SHS[@]}" -eq 0 ]; then
  echo "ℹ️ Nenhum .sh encontrado em .mf_master (fora quarantine/broken)."
fi

for f in "${SHS[@]}"; do
  if ! bash -n "$f" >/dev/null 2>&1; then
    echo "❌ bash -n FAIL: $f"
    bash -n "$f" || true
    fail=1
  else
    echo "✅ bash -n OK: $f"
  fi
done

echo
echo "[mf_doctor] (3) Detectar vazamento de terminadores de heredoc + lixo de terminal"
markers=(PY NODE TSX BASH EOF)

for f in "${SHS[@]}"; do
  if rg -n "^(heredoc>|pipe dquote>|dquote>|.*\|.*\|.*\|.*dquote>)" "$f" >/dev/null 2>&1; then
    echo "❌ Possível lixo de terminal detectado em: $f"
    rg -n "^(heredoc>|pipe dquote>|dquote>|.*\|.*\|.*\|.*dquote>)" "$f" || true
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
done

if [ "$fail" -ne 0 ]; then
  echo
  echo "🚫 mf_doctor FAIL: script com sintaxe quebrada OU vazamento de gerador/heredoc."
  echo "➡️ Ação: mover para .mf_master/_quarantine/ ou corrigir."
  exit 2
fi

echo
echo "✅ .mf_master OK (bash -n OK + sem vazamento clássico)"
echo

echo "[mf_doctor] (4) VERIFY (BUILD VERDE)"
npm run -s verify
echo "✅ VERIFY OK"
echo

echo "[mf_doctor] ✅ ALL GREEN"
DOCTOR

chmod +x .mf_master/mf_doctor.sh

echo "==> Rodar mf_doctor"
.mf_master/mf_doctor.sh

echo
echo "==> COMMIT + TAG"
git add .gitignore .mf_master/mf_doctor.sh .mf_master/_run_block18.sh || true
git commit -m "chore(block18): mf_doctor bash puro + guardrails + ignore quarantine/broken (build green)" || echo "ℹ️ Nada para commitar."
git push origin main

TAG="freeze-block18-doctor-guardrails-v1.0.1"
git tag -f "$TAG"
git push origin -f "$TAG"

echo
echo "============================================================"
echo "✅ BLOCO 18 OK | BUILD VERDE | TAG $TAG"
echo "============================================================"
