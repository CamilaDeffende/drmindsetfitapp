#!/usr/bin/env bash
set -euo pipefail
REMOTE="${REMOTE:-origin}"

if [ $# -lt 2 ]; then
  echo "Uso: scripts/mf-freeze-and-push.sh <tagname> <message...>"
  echo 'Ex: scripts/mf-freeze-and-push.sh "freeze-onboarding-contract-v2-green-$(date +%Y%m%d_%H%M%S)" "Onboarding contract v2 — BUILD VERDE [..]"'
  exit 2
fi

TAG="$1"; shift
MSG="$*"

# ---- validações (anti-human-error) ----
# regra: tags do projeto começam com freeze-
if [[ "$TAG" != freeze-* ]]; then
  echo "❌ TAG inválida: precisa começar com 'freeze-'"
  exit 2
fi

# proíbe espaços e caracteres que quebram tooling
if echo "$TAG" | rg -q '[\s<>:"'"'"'\\]'; then
  echo "❌ TAG inválida: não use espaços nem caracteres: < > : \" ' \\"
  echo "TAG recebida: $TAG"
  exit 2
fi

# precisa existir HEAD
git rev-parse --verify HEAD >/dev/null

# não pode existir local
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "❌ TAG já existe local: $TAG"
  exit 1
fi

# não pode existir remoto
if git ls-remote --tags "$REMOTE" | awk '{print $2}' | grep -Fxq "refs/tags/$TAG"; then
  echo "❌ TAG já existe no remoto: $TAG"
  exit 1
fi

echo "==> create tag: $TAG"
git tag -a "$TAG" -m "$MSG"

echo "==> move freeze-latest => $TAG"
git tag -f freeze-latest "$TAG"

echo "==> push HEAD"
git push "$REMOTE" HEAD

echo "==> push only the new tag"
git push "$REMOTE" "refs/tags/$TAG:refs/tags/$TAG"

echo "==> push freeze-latest (force refspec)"
scripts/mf-push-freeze-latest.sh

echo "✅ DONE: $TAG"
git show -s --oneline
