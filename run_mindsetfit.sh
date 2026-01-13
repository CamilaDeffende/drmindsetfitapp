#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> (0) Contexto: $(pwd)"
echo "==> (1) Limpando caches/artefatos..."
rm -rf dist .vercel .vite node_modules/.vite 2>/dev/null || true

echo "==> (2) Liberando portas comuns (8080/8081/5173)..."
for p in 8080 8081 5173; do
  if command -v lsof >/dev/null 2>&1; then
    lsof -ti tcp:$p | xargs -r kill -9 2>/dev/null || true
  fi
done

echo "==> (3) Instalando dependências (npm)..."
npm install

echo "==> (4) Garantindo BUILD VERDE (type-check + build)..."
npm run type-check
npm run build

echo "==> (5) Subindo DEV (host 0.0.0.0 em porta fixa 8080)..."
IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [ -z "${IP}" ]; then IP="$(ipconfig getifaddr en1 2>/dev/null || true)"; fi
if [ -z "${IP}" ]; then IP="127.0.0.1"; fi

echo ""
echo "✅ ABRIR NO CELULAR (mesmo Wi-Fi): http://${IP}:8080/"
echo "ℹ️ Se não abrir: desative VPN no celular/PC e permita firewall para Node/Vite."
echo ""

exec npm run dev -- --host 0.0.0.0 --port 8080
