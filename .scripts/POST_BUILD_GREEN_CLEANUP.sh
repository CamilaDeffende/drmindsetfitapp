#!/usr/bin/env bash
set -euo pipefail

BR="$(git rev-parse --abbrev-ref HEAD)"
echo "==> BRANCH: $BR"
mkdir -p .backups

stamp(){ date +"%Y%m%d_%H%M%S"; }

echo "==> (1) Backup scripts atuais..."
BK=".backups/scripts_cleanup_$(stamp).tgz"
tar -czf "$BK" .scripts >/dev/null 2>&1 || true
echo "✅ Backup:", "$BK"

echo "==> (2) Remover scripts/patches que causaram erro (TS syntax / regex quebrada) se existirem..."
rm -f .scripts/block3_patch.mjs .scripts/block3_state_soberano.mjs .scripts/block1_1.mjs 2>/dev/null || true
rm -rf .scripts/patches 2>/dev/null || true

echo "==> (3) Garantir que NÃO existe import inutil de getStrengthWeekPlanFromState nos arquivos que não usam..."
node - <<'NODE'
const fs = require("fs");

const files = [
  "src/components/treino/WeeklyProtocolActive.tsx",
  "src/features/fitness-suite/engine/workoutGenerator.ts",
];

const imp = 'import { getStrengthWeekPlanFromState } from "@/utils/strength/strengthWeekPlanSource";\n';

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let s = fs.readFileSync(f, "utf8");
  const before = s;

  // se tem import mas não tem chamada real, remove
  if (s.includes("getStrengthWeekPlanFromState") && !/getStrengthWeekPlanFromState\s*\(/.test(s)) {
    s = s.replace(imp, "");
    // fallback: remove por regex caso format diferente
    s = s.replace(/^\s*import\s+\{\s*getStrengthWeekPlanFromState\s*\}\s+from\s+["']@\/utils\/strength\/strengthWeekPlanSource["'];\s*\n/m, "");
  }

  if (s !== before) {
    fs.writeFileSync(f, s, "utf8");
    console.log("✅ cleaned unused import:", f);
  } else {
    console.log("ℹ️ ok:", f);
  }
}
NODE

echo "==> (4) VERIFY (BUILD VERDE obrigatório)..."
npm run verify

echo "==> (5) Commit + push (cleanup premium)..."
git add -A
git commit -m "chore(scripts): cleanup broken patch scripts (keep build green)" || echo "ℹ️ Nada para commitar."
git push origin "$BR"

echo "✅ POST CLEANUP OK | BUILD VERDE"
