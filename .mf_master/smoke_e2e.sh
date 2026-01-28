#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p .backups/_rebuild_sprint0
ts="$(date +%Y%m%d_%H%M%S)"
report=".backups/_rebuild_sprint0/smoke_e2e_${ts}.txt"
devlog="/tmp/mf_dev_${ts}.log"
pidfile="/tmp/mf_dev_${ts}.pid"

kill_port () {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local pids
    pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
    if [ -n "${pids}" ]; then
      echo "KILL_PORT_$port: ${pids}"
      kill -9 ${pids} >/dev/null 2>&1 || true
      sleep 0.2
    else
      echo "KILL_PORT_$port: none"
    fi
  else
    echo "KILL_PORT_$port: lsof_not_found"
  fi
}

http_code () {
  local url="$1"
  curl -s -o /dev/null -w "%{http_code}" "$url" || true
}

fetch_html () {
  local url="$1"
  curl -sL "$url" || true
}

contains_any () {
  local hay="$1"; shift
  for pat in "$@"; do
    if printf "%s" "$hay" | rg -q "$pat" 2>/dev/null; then
      echo "HIT:$pat"
      return 0
    fi
  done
  echo "HIT:none"
  return 1
}

{
  echo "==> INFO"
  echo "PWD: $(pwd)"
  echo "NODE: $(node -v)"
  echo "NPM:  $(npm -v)"
  echo "GIT:  $(git rev-parse --short HEAD)"
  echo
  echo "==> VERIFY"
  npm run -s verify
  echo
  echo "==> ENSURE PORT FREE (8080)"
  kill_port 8080
  echo
  echo "==> DEV SERVER (8080)"
  (npm run -s dev -- --host 127.0.0.1 --port 8080 --strictPort >"$devlog" 2>&1 & echo $! > "$pidfile")
  sleep 0.7

  pid="$(cat "$pidfile")"
  echo "PID: $pid"

  ok=0
  for i in $(seq 1 50); do
    if curl -fsS http://127.0.0.1:8080/ >/dev/null 2>&1; then ok=1; break; fi
    sleep 0.2
  done
  echo "DEV_READY: $ok"

  echo
  echo "==> HTTP CHECKS (PUBLIC)"
  for path in / /login /pricing /signup; do
    code="$(http_code "http://127.0.0.1:8080${path}")"
    echo "${path} -> ${code}"
  done

  echo
  echo "==> HTTP CHECKS (PROTECTED, best-effort by content)"
  # Rotas que normalmente exigem login/premium.
  # Em SPA, code tende a ser 200. Então validamos se o HTML parece LOGIN ou APP.
  protected=(/dashboard /planos-ativos /nutrition /edit-diet /report /corrida-pro)
  for path in "${protected[@]}"; do
    url="http://127.0.0.1:8080${path}"
    code="$(http_code "$url")"
    html="$(fetch_html "$url")"

    # Heurísticas: sinais de login vs sinais de app
    login_hit="$(contains_any "$html" "Login" "Entrar" "Continuar" "Esqueceu" || true)"
    app_hit="$(contains_any "$html" "Dashboard" "Planos Ativos" "Onboarding" "Nutrição" "Exportar PDF" || true)"

    echo "${path} -> ${code} | ${login_hit} | ${app_hit}"
  done

  echo
  echo "==> DEV LOG (last 60 lines)"
  tail -n 60 "$devlog" || true

  echo
  echo "==> STOP DEV"
  kill "$pid" >/dev/null 2>&1 || true
  sleep 0.2

  echo
  echo "✅ SMOKE E2E DONE"
} | tee "$report"

echo "REPORT: $report"
