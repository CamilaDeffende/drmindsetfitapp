#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-preview}" # preview | prod
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "==> MF OPS — $(date)"
echo "mode: $MODE"
echo "branch: $(git branch --show-current)"
git status -sb || true

# harden ignores
touch .gitignore
for pat in ".env" ".vercel" "node_modules" "dist" ".backups" ".scan" ".mf_bundle" "test-results" "playwright-report" "coverage" "*.zip" "*.tgz" "*.tar.gz"; do
  grep -qxF "$pat" .gitignore || echo "$pat" >> .gitignore
done

cat > .vercelignore <<'EOF'
# MF_VERCELIGNORE_V2
node_modules
dist
.backups
.scan
.mf_bundle
.mf_cache
.mf_tmp
.playwright
test-results
playwright-report
coverage
*.zip
*.7z
*.tar
*.tar.gz
*.tgz
*.mp4
*.mov
*.mkv
*.webm
*.dmg
*.iso
*.psd
*.blend
*.fbx
*.glb
*.gltf
*.bin
*.sqlite
*.db
*.log
.env
EOF

# ensure .env not tracked
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  git rm --cached .env
fi

# verify (CI parity)
npm run -s verify

# commit/push if needed
if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -m "chore(mf-ops): keep verify green + harden ignores" || true
  git push || true
fi

# deploy via vercel prebuilt
if ! command -v vercel >/dev/null 2>&1; then
  echo "❌ vercel CLI não encontrado"
  exit 1
fi
vercel whoami >/dev/null 2>&1 || { echo "❌ vercel não logado"; exit 1; }

rm -rf .vercel/output

if [ "$MODE" = "prod" ]; then
  vercel pull --yes --environment=production >/dev/null
  vercel build --prod >/dev/null
  vercel deploy --prebuilt --prod --yes
else
  vercel pull --yes --environment=preview >/dev/null
  vercel build >/dev/null
  vercel deploy --prebuilt --yes
fi

echo "✅ done."
