#!/usr/bin/env bash
set -euo pipefail

echo "==> MF OPS (GitHub + Vercel) — $(date)"
echo "repo: $(pwd)"
echo "branch: $(git branch --show-current)"
git status -sb || true

# 1) .env hardening
touch .gitignore
grep -qxF ".env" .gitignore || echo ".env" >> .gitignore
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  echo "-> removing .env from git index (keeping local)"
  git rm --cached .env
fi

# 2) verify
npm run -s verify

# 3) commit/push if needed
if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -m "chore(mf-ops): keep verify green + env hardening" || true
  git push
fi

# 4) GH Actions last run main/push
RUN_ID="$(gh run list --branch main --event push --limit 1 --json databaseId --jq ".[0].databaseId")"
echo "RUN_ID=$RUN_ID"
gh run view "$RUN_ID" --json conclusion,status,displayTitle,workflowName,url --jq "{title:.displayTitle, workflow:.workflowName, status:.status, conclusion:.conclusion, url:.url}"

CONCL="$(gh run view "$RUN_ID" --json conclusion --jq ".conclusion")"
if [ "$CONCL" = "failure" ]; then
  echo "==> logs failed:"
  gh run view "$RUN_ID" --log-failed
  exit 1
fi

echo "✅ MF OPS OK"
