#!/usr/bin/env bash
set -euo pipefail

LOG=".mf_master/logs/lintgate_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

echo "==> pwd: $(pwd)"
echo "==> node: $(node -v 2>/dev/null || true)"
echo "==> npm:  $(npm -v 2>/dev/null || true)"
echo "==> git:  $(git rev-parse --short HEAD 2>/dev/null || true)"
echo

echo "==> (0) sanity: package scripts"
node - <<'NODE'
const fs = require("fs");
const p = "package.json";
const j = JSON.parse(fs.readFileSync(p, "utf8"));
const s = (j && j.scripts) || {};
const need = ["lint","lint:gate","lint:core","lint:full"];
const miss = need.filter(k => !s[k]);
if (miss.length) {
  console.error("❌ package.json scripts missing:", miss.join(", "));
  process.exit(2);
}
console.log("✅ scripts ok:", need.join(", "));
NODE
echo

echo "==> (1) typecheck"
npx tsc --noEmit
echo

echo "==> (2) lint gate"
npm run -s lint
echo

echo "==> (3) verify (build verde)"
npm run -s verify
echo

echo "✅ LINTGATE OK | log: $LOG"
