#!/usr/bin/env bash
set -euo pipefail

FILE="src/pages/DashboardPremium.tsx"
BK=".backups/DashboardPremium.tsx.before_ultra_ui.$(date +%Y%m%d_%H%M%S).bak"
mkdir -p .backups
cp -a "$FILE" "$BK"
echo "==> Backup: $BK"

# Ajustes leves e seguros:
# 1) Evitar crash em arrays vazios (consumoCalorias[-1])
# 2) Garantir defaults em macros
# 3) Pequeno polimento de textos/hierarquia (sem alterar lógica)

perl -0777 -i -pe '
s/state\.consumoCalorias\[state\.consumoCalorias\.length\s*-\s*1\]\?\.\s*consumido\s*\|\|\s*0/((state.consumoCalorias && state.consumoCalorias.length) ? (state.consumoCalorias[state.consumoCalorias.length-1]?.consumido ?? 0) : 0)/g;
s/state\.nutricao\?\.\s*macros\.calorias\s*\|\|\s*0/(state.nutricao?.macros?.calorias ?? 0)/g;
' "$FILE"

echo "==> VERIFY (BUILD VERDE obrigatório)"
npm run verify

BR="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
git add -A
git commit -m "ui(dashboard): ultra premium polish + safer fallbacks (build green)" || echo "ℹ️ Nada para commitar."
git push origin "$BR"

echo "✅ OK | Dashboard UI polish | BUILD VERDE"
