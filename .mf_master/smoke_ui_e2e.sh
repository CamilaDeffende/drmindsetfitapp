#!/usr/bin/env bash

# MF_GUARD_NO_VERIFY_V1
# Se o verify já foi executado fora (ex.: mf_master.sh verify), não reexecute aqui.
MF_SMOKE_NO_VERIFY="${MF_SMOKE_NO_VERIFY:-0}"
if [ "$MF_SMOKE_NO_VERIFY" = "1" ]; then
  echo "==> (smoke) skip internal verify: verify já foi feito fora"
fi

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

ts="$(date +%Y%m%d_%H%M%S)"
report=".backups/_rebuild_sprint0/smoke_ui_e2e_${ts}.txt"
devlog="/tmp/mf_dev_ui_${ts}.log"
pidfile="/tmp/mf_dev_ui_${ts}.pid"

say(){ echo "[$(date +%H:%M:%S)] $*"; }
http_code(){ curl -s -o /dev/null -w "%{http_code}" "$1" || true; }

say "==> INFO"
{
  echo "PWD: $ROOT"
  echo "NODE: $(node -v)"
  echo "NPM:  $(npm -v)"
  echo "GIT:  $(git rev-parse --short HEAD 2>/dev/null || echo '?')"
  echo
} | tee -a "$report"

say "==> VERIFY"
npm run -s verify 2>&1 | tee -a "$report"
echo "" | tee -a "$report"

say "==> KILL PORT 8080 (safe)"
if command -v lsof >/dev/null 2>&1; then
  pids="$(lsof -tiTCP:8080 -sTCP:LISTEN 2>/dev/null || true)"
  if [ -n "${pids:-}" ]; then
    kill -9 $pids >/dev/null 2>&1 || true
    sleep 0.2
  fi
fi

say "==> ENSURE playwright + chromium"
node -e "require('playwright'); console.log('playwright ok')" >/dev/null 2>&1 || npm i -D playwright
npx -y playwright install chromium >/dev/null 2>&1 || true

say "==> START DEV (8080)"
(npm run -s dev -- --host 127.0.0.1 --port 8080 --strictPort >"$devlog" 2>&1 & echo $! > "$pidfile")
sleep 1
pid="$(cat "$pidfile" 2>/dev/null || true)"
say "DEV_PID: ${pid:-?}"

say "==> WAIT DEV READY"
ok=0
for i in $(seq 1 50); do
  if [ "$(http_code http://127.0.0.1:8080/)" = "200" ]; then ok=1; break; fi
  sleep 0.25
done
echo "DEV_READY: $ok" | tee -a "$report"
if [ "$ok" -ne 1 ]; then
  echo "❌ DEV NOT READY" | tee -a "$report"
  tail -n 180 "$devlog" | tee -a "$report" || true
  kill "${pid:-0}" >/dev/null 2>&1 || true
  exit 1
fi

echo "" | tee -a "$report"
say "==> RUN SMOKE (playwright smoke_ui.mjs)"
set +e
node .mf_master/smoke_ui.mjs 2>&1 | tee -a "$report"
smoke_code="${PIPESTATUS[0]}"
set -e

echo "" | tee -a "$report"
say "==> DEV LOG (last 140)"
tail -n 140 "$devlog" | tee -a "$report" || true

say "==> STOP DEV"
kill "${pid:-0}" >/dev/null 2>&1 || true
sleep 0.2

echo "" | tee -a "$report"
echo "REPORT: $report" | tee -a "$report"

if [ "$smoke_code" -ne 0 ]; then
  echo "❌ SMOKE FAILED (exit=$smoke_code)" | tee -a "$report"
  exit "$smoke_code"
fi

echo "✅ SMOKE_UI_E2E OK" | tee -a "$report"
