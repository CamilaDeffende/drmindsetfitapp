#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOGDIR="$ROOT/.backups/_mf_master"
mkdir -p "$LOGDIR" "$ROOT/.backups/_rebuild_sprint0/file_backups"

ts(){ date +"%Y%m%d_%H%M%S"; }
log(){ echo "[$(date +"%H:%M:%S")] $*"; }

backup_file(){
  local f="$1"
  [ -f "$ROOT/$f" ] || return 0
  local out="$ROOT/.backups/_rebuild_sprint0/file_backups/$(echo "$f" | sed "s|/|__|g").$(ts).bak"
  cp -a "$ROOT/$f" "$out"
  log "✅ backup: $out"
}

run_verify(){
  log "==> VERIFY"
  (cd "$ROOT" && npm run -s verify) 2>&1 | tee "$LOGDIR/verify_$(ts).log"
}


run_smoke_ui_e2e() {
  if [ -x "$ROOT/.mf_master/smoke_ui_e2e.sh" ]; then
    log "==> SMOKE_UI_E2E"
    (cd "$ROOT" && "$ROOT/.mf_master/smoke_ui_e2e.sh") 2>&1 | tee -a "$LOGDIR/smoke_ui_e2e.log"
  else
    log "WARN: smoke_ui_e2e.sh não encontrado/executável. Pulando."
  fi
}


should_smoke() {
  # Heurística: roda SMOKE em comandos que podem quebrar fluxo / rotas / build
  local cmd="$*"
  case "$cmd" in
    *"npm run -s verify"*|*"npm run verify"*|*"npm run build"*|*"npm run -s build"*|*"npm run preview"*|*"vite build"*|*"pnpm build"*|*"yarn build"*)
      return 0 ;;
    *"node "*".mf_master"*|*"node "*".backups"*|*"python"*".mf_master"*|*"python"*".backups"*)
      return 0 ;;
    *"git commit"*|*"git rebase"*|*"git merge"*|*"git pull"*|*"git push"*)
      return 0 ;;
    *)
      return 1 ;;
  esac
}



fix_app_tsx_routes_invalid_char(){
  local f="$ROOT/src/App.tsx"
  [ -f "$f" ] || return 0

  if ! grep -q '<Routes>\\n' "$f" && ! grep -q 'path=\\\"' "$f"; then
    return 0
  fi

  log "🛠️ autofix: App.tsx com escapes literais (\\\\n / \\\\\") dentro de JSX"
  backup_file "src/App.tsx"

  python3 - << "PYIN"
import re
p="src/App.tsx"
s=open(p,"r",encoding="utf-8",errors="replace").read()

s = s.replace("\\\\n", "\n").replace("\\\\\"", "\"")

if "<Routes>" in s and "<Routes>\n" not in s:
  s = s.replace("<Routes>", "<Routes>\n")

aliases = [
  ("/profile", "/profile-safe"),
  ("/perfil", "/profile-safe"),
  ("/planos", "/planos-ativos"),
]
for a,b in aliases:
  if f'path="{a}"' not in s:
    s = s.replace("<Routes>\n", "<Routes>\n" + f'              <Route path="{a}" element={{<Navigate to="{b}" replace />}} />\n', 1)

lines=s.splitlines(True)
out=[]
seen=0
for line in lines:
  if 'path="/onboarding/step-1"' in line and "Step1Perfil" in line and "<Route" in line:
    seen += 1
    if seen > 1:
      continue
  out.append(line)
s="".join(out)
s=re.sub(r"\n{3,}","\n\n",s)

open(p,"w",encoding="utf-8").write(s)
print("OK: healed App.tsx; removed step-1 duplicates:", max(0,seen-1))
PYIN

  log "✅ healed: src/App.tsx"
}

autoheal(){
  log "==> AUTOHEAL (safe)"
  fix_app_tsx_routes_invalid_char || true
}

run(){
  local cmd="$1"
  local runlog="$LOGDIR/run_$(ts).log"
  log "==> RUN: $cmd"
  set +e
  (cd "$ROOT" && bash -lc "$cmd") 2>&1 | tee "$runlog"
  local code="${PIPESTATUS[0]}"
  set -e
  if [ "$code" -ne 0 ]; then
    log "❌ RUN falhou (exit=$code). AUTOHEAL + VERIFY..."
    autoheal
    run_verify
    log "✅ AUTOHEAL concluído (logs em $LOGDIR)."
    return 1
  fi
  log "✅ RUN OK"
  if should_smoke "$cmd"; then
    log "==> SMOKE_UI_E2E (post-run)"
    run_smoke_ui_e2e || true
  fi
}


case "${1:-}" in
  run) shift; run "${*}" ;;
verify) run_verify; run_smoke_ui_e2e ;;
autoheal) autoheal ;;
  *)
    echo "Uso:"
    echo "  ./.mf_master/mf_master.sh run \"<comando>\""
    echo "  ./.mf_master/mf_master.sh verify"
    echo "  ./.mf_master/mf_master.sh autoheal"
    exit 2
    ;;
esac
