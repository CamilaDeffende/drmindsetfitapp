#!/usr/bin/env bash
set -euo pipefail

# MF_RUNNER_SAFE_V2
# Objetivo: executar patches com regex/[]/$(...) sem sofrer com zsh/globbing e com guardrails.
#
# Uso:
#   bash scripts/mf-runner-safe.sh
#
# Variáveis (opcionais):
#   PATCH_FILE=/caminho/patch.sh     -> executa um patch externo (bash) dentro do runner
#   PATCH_CMD="..."                 -> executa um comando único (bash -lc) dentro do runner
#   FOCUSED_E2E=1                   -> roda suite chromium (boot guard + golden path + FAF) antes do verify
#   NO_COMMITS_GUARD=1              -> se não houver diff vs base, sai sem push/PR
#   AUTO_PR=1                       -> cria PR automaticamente (gh) após push
#   BASE=main                       -> base branch (default: main)
#   REMOTE=origin                   -> remote (default: origin)
#
# Observação: este script NÃO cria branch/commit sozinho. Ele é o executor "safe".
# Para fluxo completo (branch+PR), use o wrapper /tmp ou seu runner master.

BASE="${BASE:-main}"
REMOTE="${REMOTE:-origin}"
ROOT="$(pwd)"

echo "==> repo: $ROOT"
echo "==> base: $BASE | remote: $REMOTE"
git status -sb
echo

run_patch_file() {
  local f="$1"
  if [[ ! -f "$f" ]]; then
    echo "❌ PATCH_FILE não existe: $f" >&2
    exit 1
  fi
  echo "==> [PATCH_FILE] $f"
  # shellcheck disable=SC1090
  bash "$f"
}

run_patch_cmd() {
  local cmd="$1"
  echo "==> [PATCH_CMD]"
  bash -lc "$cmd"
}

run_focused_e2e() {
  echo
  echo "==> [E2E] focused chromium (boot guard + golden path + FAF)"
  npx playwright test --list --project=chromium >/dev/null
  npm run -s test:e2e -- --project=chromium --reporter=line \
    tests/e2e/onboarding-boot-guard.spec.ts \
    tests/e2e/onboarding-golden-path.spec.ts \
    tests/mf/e2e_faf_moderadamente_ativo.spec.ts
}

guard_no_commits() {
  if [[ "${NO_COMMITS_GUARD:-0}" == "1" ]]; then
    echo
    echo "==> [GUARD] NO_COMMITS_GUARD=1"
    if git diff --quiet "$BASE"...HEAD; then
      echo "ℹ️ Sem mudanças entre $BASE e HEAD. Encerrando."
      exit 0
    fi
  fi
}

maybe_create_pr() {
  if [[ "${AUTO_PR:-0}" != "1" ]]; then
    return 0
  fi

  if ! command -v gh >/dev/null 2>&1; then
    echo "❌ gh não encontrado (AUTO_PR=1). Instale GitHub CLI." >&2
    exit 1
  fi

  local br
  br="$(git branch --show-current)"
  echo
  echo "==> [PR] create + watch checks (branch: $br)"
  gh pr create --base "$BASE" --head "$br" \
    --title "chore(mf): runner-safe v2 (anti-zsh + flags)" \
    --body "Runner-safe V2: PATCH_FILE/PATCH_CMD, FOCUSED_E2E, NO_COMMITS_GUARD e AUTO_PR. Mantém BUILD VERDE."
  gh pr checks --watch
}

echo "==> [PATCH] begin"
if [[ -n "${PATCH_FILE:-}" ]]; then
  run_patch_file "$PATCH_FILE"
elif [[ -n "${PATCH_CMD:-}" ]]; then
  run_patch_cmd "$PATCH_CMD"
else
  echo "ℹ️ Nenhum PATCH_FILE/PATCH_CMD fornecido. (runner executado sem patch)"
fi
echo "==> [PATCH] end"

if [[ "${FOCUSED_E2E:-0}" == "1" ]]; then
  run_focused_e2e
fi

echo
echo "==> verify (BUILD VERDE)"
npm run -s verify

guard_no_commits
maybe_create_pr

echo
echo "✅ runner-safe V2 OK"
