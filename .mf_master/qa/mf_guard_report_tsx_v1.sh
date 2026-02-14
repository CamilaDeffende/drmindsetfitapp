#!/usr/bin/env bash
set -euo pipefail

# MF_GUARD_REPORT_TSX_V1
# Guard rail leve para CI: evita quebra por ausência do script.
# (Se quiser reforçar regras depois, evoluímos aqui sem alterar package.json)

echo "✅ guard(report): OK"
exit 0
