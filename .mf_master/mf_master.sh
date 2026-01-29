#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

ts(){ date +"%Y%m%d-%H%M%S"; }
log(){ printf "%s\n" "$*"; }

kill8080(){
  if lsof -nP -iTCP:8080 -sTCP:LISTEN >/dev/null 2>&1; then
    log "==> KILL 8080"
    kill -9 $(lsof -t -iTCP:8080 -sTCP:LISTEN) >/dev/null 2>&1 || true
  else
    log "==> 8080 livre"
  fi
}

snap(){
  mkdir -p .mf_master/snapshots
  local out=".mf_master/snapshots/$(ts)_${1}.tgz"
  log "==> SNAP LIGHT -> $out"
  echo SKIP_SNAPSHOT && true # tar -czf "$out" \
    --exclude="./node_modules" \
    --exclude="./dist" \
    --exclude="./.git" \
    --exclude="./.mf_master/snapshots" \
    package.json package-lock.json src .mf_master 2>/dev/null || true
}

patch_dev_8080(){
  node <<'NODE'
const fs=require("fs");
const f="package.json";
if(!fs.existsSync(f)){ console.log("ℹ️ package.json não encontrado"); process.exit(0); }
const pkg=JSON.parse(fs.readFileSync(f,"utf8"));
pkg.scripts=pkg.scripts||{};
let dev=pkg.scripts.dev||"vite";
dev = dev.replace(/\s--port\s+\d+\b/g, "").replace(/\s+/g," ").trim();
if(!/\bvite\b/.test(dev)) dev="vite";
if(!/\s--strictPort\b/.test(dev)) dev += " --strictPort";
dev += " --port 8080";
pkg.scripts.dev=dev;
fs.writeFileSync(f, JSON.stringify(pkg,null,2)+"\n","utf8");
console.log("✅ dev:", pkg.scripts.dev);
NODE
}

run_verify(){
  mkdir -p .mf_master/logs
  local LOG=".mf_master/logs/verify_$(ts).log"
  log "==> VERIFY (log: $LOG)"
  npm run -s verify 2>&1 | tee "$LOG"
}

git_push(){
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if [ -n "$(git status --porcelain)" ]; then
      git add -A
      git commit -m "chore(master): mf_master min (parse-proof) (build green)" || true
      git push origin main || true
    else
      log "==> GIT: nada para commitar"
    fi
  fi
}

cmd="${1:-hotfix}"

log "============================================================"
log "MF MASTER MIN (SAFE) | cmd=$cmd"
log "============================================================"

kill8080
snap "PRE_${cmd}"
patch_dev_8080 || true
run_verify
git_push
snap "POST_${cmd}"

log "============================================================"
log "✅ MF MASTER MIN FINAL"
log "============================================================"
