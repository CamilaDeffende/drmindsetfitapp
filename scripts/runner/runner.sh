#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

backup_snapshot () {
  mkdir -p .backups
  local out=".backups/${1:-snapshot}_$(date +%Y%m%d_%H%M%S).tgz"
  tar --exclude="./node_modules" --exclude="./dist" --exclude="./.git" --exclude="./.backups" -czf "$out" .
  echo "✅ BACKUP: $out"
}

verify_or_die () {
  echo "==> VERIFY (typecheck + build + lint)"
  npm run -s verify
  echo "✅ VERIFY OK | BUILD VERDE"
}

commit_if_needed () {
  local msg="${1:-chore: checkpoint (build green)}"
  if [[ -n "$(git status --porcelain)" ]]; then
    git add -A
    git commit -m "$msg"
    git push origin main
    echo "✅ COMMIT+PUSH OK"
  else
    echo "ℹ️ Nada para commitar."
  fi
}

run_patcher_if_exists () {
  local patcher="$1"
  if [[ -n "$patcher" && -f "$patcher" ]]; then
    echo "==> RUN PATCHER: $patcher"
    node "$patcher"
  else
    echo "ℹ️ Sem patcher para executar: $patcher"
  fi
}

smoke_check_phase3 () {
  cat <<TXT

✅ SMOKE CHECK (Phase 3 — Nutrição)
1) Login -> Dashboard -> Planos Ativos -> Nutrição
2) Ver "Resumo do dia" (totais + check científico)
3) Clicar "Exportar Nutrição (PDF)" (gera PDF sem erro)
4) Clicar "Copiar plano (texto)" e colar no Notes/WhatsApp
5) Abrir Editar Dieta (se existir) e voltar sem quebrar estado

TXT
}

case "${1:-}" in
  snapshot)
    backup_snapshot "${2:-snapshot}"
    ;;
  verify)
    verify_or_die
    ;;
  phase3e)
    backup_snapshot "phase3E"
    run_patcher_if_exists "scripts/runner/phase3e_master.cjs"
    rg -n "buildDietExportTextPhase3E|copyTextFallbackPhase3E|Copiar plano \\(texto\\)|Phase 3E" \
      src/engine/nutrition/NutritionEngine.ts src/pages/NutritionPlan.tsx || true
    verify_or_die
    commit_if_needed "feat(nutrition): copy editable diet plan text (phase3E build green)"
    smoke_check_phase3
    ;;
  phase3f)
    echo "==> PHASE 3F: UX premium do plano em texto (Dialog + Textarea + Copiar + Baixar .txt)"
    node .backups/phase3f_master.cjs
    ;;

  *)
    cat <<TXT
Runner oficial criado.
Uso:
  bash .backups/_runner.sh snapshot [nome]
  bash .backups/_runner.sh verify
  bash .backups/_runner.sh phase3e
  bash .backups/_runner.sh phase3f
TXT
    ;;

esac
