#!/usr/bin/env bash
set -euo pipefail

# MF_RUNNER_SAFE_REPO_V1
# Runner versionado (anti-zsh). Cole patches dentro do bloco PATCH.

echo "==> repo: $(pwd)"
git status -sb
echo

echo "==> [PATCH] cole aqui"
# ---- PATCH BEGIN ----
true
# ---- PATCH END ----

echo
echo "==> verify (BUILD VERDE)"
npm run -s verify
