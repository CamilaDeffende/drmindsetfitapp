#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-preview}"          # preview | prod
DEPLOY="${2:-auto}"           # auto | always | never

echo "==> MF OPS — $(date) "
echo "mode: $MODE"
echo "deploy: $DEPLOY"

cd "$(dirname "$0")"

echo "branch: $(git branch --show-current)"
git status -sb || true

# 1) Garantias de higiene
touch .gitignore
for pat in ".env" ".vercel" "node_modules" "dist" ".backups" ".scan" ".mf_bundle" ".mf_cache" ".mf_tmp" ".playwright" "test-results" "playwright-report" "coverage" "*.zip" "*.7z" "*.tar" "*.tar.gz" "*.tgz" "*.mp4" "*.mov" "*.mkv" "*.webm" "*.dmg" "*.iso" "*.psd" "*.blend" "*.fbx" "*.glb" "*.gltf" "*.bin" "*.sqlite" "*.db" "*.log"; do
  grep -qxF "$pat" .gitignore || echo "$pat" >> .gitignore
done

# .env nunca deve estar tracked
if git ls-files --error-unmatch .env >/dev/null 2>&1; then
  git rm --cached .env >/dev/null 2>&1 || true
fi

# 2) Verify (paridade CI)
npm run -s verify

# 3) Commit/push só se tiver mudança real
if ! git diff --quiet || ! git diff --cached --quiet; then
  git add -A
  git commit -m "chore(mf-ops): keep verify green + harden ignores" || true
  git push || true
fi

# 4) Decide se vai deployar
if [ "$DEPLOY" = "never" ]; then
  echo "==> deploy skip (DEPLOY=never)"
  echo "✅ done."
  exit 0
fi

if [ "$DEPLOY" = "auto" ]; then
  # deploy só se HEAD local NÃO estiver igual ao último deploy salvo
  LAST_FILE=".mf_last_deploy_${MODE}.txt"
  CUR="$(git rev-parse HEAD)"
  LAST="$(cat "$LAST_FILE" 2>/dev/null || true)"
  if [ "$CUR" = "$LAST" ]; then
    echo "==> deploy skip (DEPLOY=auto e nenhum commit novo desde último deploy: $CUR)"
    echo "✅ done."
    exit 0
  fi
fi

# 5) Deploy prebuilt
command -v vercel >/dev/null 2>&1 || { echo "❌ vercel CLI não encontrado"; exit 1; }
vercel whoami >/dev/null 2>&1 || { echo "❌ vercel não logado"; exit 1; }

rm -rf .vercel/output || true

if [ "$MODE" = "prod" ]; then
  vercel pull --yes --environment=production >/dev/null
  vercel build --prod >/dev/null
  URL="$(vercel deploy --prebuilt --prod --yes | tail -n 1 || true)"
else
  vercel pull --yes --environment=preview >/dev/null
  vercel build >/dev/null
  URL="$(vercel deploy --prebuilt --yes | tail -n 1 || true)"
fi

# 6) Marca commit deployado (pra DEPLOY=auto)
git rev-parse HEAD > ".mf_last_deploy_${MODE}.txt" || true

echo "✅ deploy ok: ${URL:-"(veja output acima)"}"
echo "✅ done."
