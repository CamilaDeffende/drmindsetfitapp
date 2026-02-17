#!/usr/bin/env bash
set -euo pipefail
REMOTE="${REMOTE:-origin}"

# precisa existir local
git rev-parse -q --verify refs/tags/freeze-latest >/dev/null || {
  echo "❌ tag local freeze-latest não existe"
  exit 1
}

echo "==> pushing freeze-latest (force refspec)"
git push -f "$REMOTE" refs/tags/freeze-latest:refs/tags/freeze-latest

echo "==> remote check"
git ls-remote --tags "$REMOTE" | grep "refs/tags/freeze-latest$"
echo "✅ OK"
