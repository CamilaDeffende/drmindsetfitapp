#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TOOLS=".mf_master/_tools"
QA=".mf_master/qa"
JS="$TOOLS/mf_pdf_smoke_v1_runner.js"

mkdir -p "$QA"

OUT="$QA/pdf_smoke_$(date +%Y-%m-%dT%H%M%S)"
mkdir -p "$OUT"
echo "OUT=$OUT"

LOG="$OUT/dev.log"
DEVLOG="$OUT/dev.nohup.log"

echo "==> kill 8080" | tee -a "$LOG"
(lsof -t -iTCP:8080 -sTCP:LISTEN | head -n 1 | xargs -I{} kill -9 {} >/dev/null 2>&1 || true)

echo "==> dev (bg)" | tee -a "$LOG"
nohup npm run -s dev -- --host 127.0.0.1 --port 8080 </dev/null >"$DEVLOG" 2>&1 &
DEV_PID="$!"
echo "DEV_PID=$DEV_PID" | tee -a "$LOG"

cleanup() {
  echo "==> teardown DEV_PID=$DEV_PID" | tee -a "$LOG"
  kill -9 "$DEV_PID" >/dev/null 2>&1 || true
  wait "$DEV_PID" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

echo "==> wait http://127.0.0.1:8080/" | tee -a "$LOG"
node - <<'NODE'
const http = require("http");
const url = "http://127.0.0.1:8080/";
const started = Date.now();
const timeoutMs = 70000;

function tick() {
  http.get(url, (res) => {
    res.resume();
    process.exit(0);
  }).on("error", () => {
    if (Date.now() - started > timeoutMs) {
      console.error("timeout waiting http");
      process.exit(2);
    }
    setTimeout(tick, 250);
  });
}
tick();
NODE

echo "==> run runner" | tee -a "$LOG"
node "$JS" | tee -a "$LOG"

echo
echo "==> PDFs encontrados (no OUT do runner):" | tee -a "$LOG"
LAST_OUT="$(ls -1dt .mf_master/qa/pdf_smoke_* 2>/dev/null | head -n 1 || true)"
echo "LAST_OUT=$LAST_OUT" | tee -a "$LOG"
if [ -n "${LAST_OUT:-}" ]; then
  ls -1 "$LAST_OUT"/*.pdf 2>/dev/null || echo "(nenhum PDF ainda)" | tee -a "$LOG"
fi

# MF_ASSERT_PDF_V2
if [ "${MF_PDF_STRICT:-0}" = "1" ]; then
  # esperamos 4 rotas gerando PDF fallback_render: report, relatorio, relatorio-completo, pdf
  NEED=4
  GOT="$(ls -1 "$LAST_OUT"/*__fallback_render.pdf 2>/dev/null | wc -l | tr -d " ")"

  if [ "${GOT:-0}" -lt "$NEED" ]; then
    echo "❌ STRICT FAIL: esperado >=$NEED PDFs fallback_render, obtido $GOT em $LAST_OUT" | tee -a "$LOG"
    ls -1 "$LAST_OUT"/*__fallback_render.pdf 2>/dev/null | tee -a "$LOG" || true
    exit 41
  fi

  # sanidade: cada arquivo precisa começar com %PDF-
  bad=0
  for fp in "$LAST_OUT"/*__fallback_render.pdf; do
    head -c 5 "$fp" | grep -q "%PDF-" || bad=$((bad+1))
  done
  if [ "$bad" -gt 0 ]; then
    echo "❌ STRICT FAIL: $bad PDF(s) sem header %PDF- (possível arquivo corrompido)" | tee -a "$LOG"
    exit 42
  fi

  echo "✅ STRICT OK: PDFs fallback_render gerados: $GOT (todos com header %PDF-)" | tee -a "$LOG"
fi



