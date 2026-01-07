#!/usr/bin/env bash
set -euo pipefail
set +H

echo "==> Sanity: typecheck + build"
npm -s run build

echo ""
echo "==> Git status"
git status --porcelain

echo ""
echo "✅ OK"
