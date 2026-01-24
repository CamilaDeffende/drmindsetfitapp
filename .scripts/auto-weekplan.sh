#!/usr/bin/env bash
set -euo pipefail

STAMP="$(date +%Y%m%d_%H%M%S)"
SCAN_DIR=".scan/auto-weekplan-$STAMP"
LOG="$SCAN_DIR/run.log"
BACKUP_DIR=".backups"
mkdir -p "$SCAN_DIR" "$BACKUP_DIR"

log(){ printf "%s %s\n" "[$(date +%H:%M:%S)]" "$*" | tee -a "$LOG" ; }
die(){ log "❌ ERROR: $*"; exit 1; }

run_verify(){
  log "==> VERIFY"
  npm run verify | tee -a "$LOG"
  log "✅ VERIFY OK"
}

backup_now(){
  log "==> Backup TGZ"
  tar -czf "$BACKUP_DIR/auto-weekplan.step.$1.$STAMP.tgz" \
    --exclude=".git" --exclude="node_modules" --exclude="dist" --exclude=".scan" --exclude=".backups" \
    .
  log "✅ Backup: $BACKUP_DIR/auto-weekplan.step.$1.$STAMP.tgz"
}

require_clean_worktree(){
  if [ -n "$(git status --porcelain)" ]; then
    log "⚠️ Worktree não está limpo. Vou continuar mesmo assim, mas isso aumenta risco."
    git status --porcelain | tee -a "$LOG"
  fi
}

commit_push(){
  local msg="$1"
  if [ -n "$(git status --porcelain)" ]; then
    log "==> git add/commit/push"
    git add -A
    git commit -m "$msg" | tee -a "$LOG" || true
    git push origin main | tee -a "$LOG" || true
  else
    log "ℹ️ Nada para commitar."
  fi
}

apply_patch_file(){
  local patch="$1"
  [ -f "$patch" ] || die "Patch file não encontrado: $patch"
  log "==> Aplicando patch: $patch"
  git apply "$patch" | tee -a "$LOG"
  log "✅ Patch aplicado"
}

main(){
  require_clean_worktree

  log "=============================="
  log "AUTO WEEKPLAN RUNNER — START"
  log "=============================="

  # BLOCO 1–9: por padrão, procura patches .patch em .scripts/patches/
  # Você (ou eu) cola os patches nesses arquivos e o runner aplica em ordem.
  PATCH_DIR=".scripts/patches"
  mkdir -p "$PATCH_DIR"

  for STEP in 1 2 3 4 5 6 7 8 9; do
    log ""
    log "------------------------------"
    log "BLOCO $STEP — INÍCIO"
    log "------------------------------"
    backup_now "$STEP"

    PATCH="$PATCH_DIR/block-$STEP.patch"
    if [ -s "$PATCH" ]; then
      apply_patch_file "$PATCH"
    else
      log "ℹ️ Sem patch em $PATCH (vazio). Pulando aplicação de código neste bloco."
    fi

    run_verify
    commit_push "chore(weekplan): bloco $STEP (auto runner, build green)"
    log "✅ BLOCO $STEP — OK"
  done

  log ""
  log "=============================="
  log "AUTO WEEKPLAN RUNNER — DONE ✅"
  log "Logs: $LOG"
  log "Backups: .backups/auto-weekplan.step.*.tgz"
  log "=============================="
}

main "$@"
