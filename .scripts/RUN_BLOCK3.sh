#!/usr/bin/env bash
set -euo pipefail

BR="$(git rev-parse --abbrev-ref HEAD)"
echo "==> BRANCH: $BR"
mkdir -p .scripts .backups

cat > .scripts/block3_state_soberano.mjs <<'MJS'
import fs from "node:fs";

const targets = [
  "src/components/treino/WeeklyProtocolActive.tsx",
  "src/features/fitness-suite/engine/workoutGenerator.ts",
  "src/components/steps/Step5Treino.tsx",
];

function stamp(){ return new Date().toISOString().replace(/[:.]/g,"-"); }
function backup(file, tag){
  fs.mkdirSync(".backups", { recursive: true });
  const bk = `.backups/${file.replaceAll("/", "__")}.before_${tag}.${stamp()}.bak`;
  fs.copyFileSync(file, bk);
  console.log("==> Backup:", bk);
}

function ensureImport(content){
  const imp = 'import { getStrengthWeekPlanFromState } from "@/utils/strength/strengthWeekPlanSource";\n';
  if (
    content.includes('from "@/utils/strength/strengthWeekPlanSource"') ||
    content.includes("getStrengthWeekPlanFromState")
  ) return content;
  const m = content.match(/^\s*import\s/m);
  if (m && typeof m.index === "number") return content.slice(0, m.index) + imp + content.slice(m.index);
  return imp + content;
}

function removeImport(content){
  const re = new RegExp(
    '^\\\\s*import\\\\s+\\\\{\\\\s*getStrengthWeekPlanFromState\\\\s*\\\\}\\\\s+from\\\\s+["\\\']@/utils/strength/strengthWeekPlanSource["\\\'];\\\\s*\\\\n',
    "m"
  );
  return content.replace(re, "");
}

for (const file of targets){
  if (!fs.existsSync(file)) { console.log("ℹ️ skip missing:", file); continue; }

  let s = fs.readFileSync(file, "utf8");
  const before = s;

  const hasLoad = /loadWeekPlan\s*\(/.test(s);
  const hasState = /\bstate\b/.test(s);

  if (hasLoad && hasState){
    backup(file, "block3_state_soberano");
    s = ensureImport(s);

    s = s.replace(
      /try\s*\{\s*weekPlan\s*=\s*loadWeekPlan\(\)\s*;?\s*\}\s*catch\s*\{\s*\}/g,
      "try { weekPlan = getStrengthWeekPlanFromState(state); } catch {}"
    );

    s = s.replace(/\bweekPlan\s*=\s*loadWeekPlan\(\)/g, "weekPlan = getStrengthWeekPlanFromState(state)");
    s = s.replace(/\bconst\s+weekPlan\s*=\s*loadWeekPlan\(\)/g, "const weekPlan = getStrengthWeekPlanFromState(state)");
    s = s.replace(/\blet\s+weekPlan\s*=\s*loadWeekPlan\(\)/g, "let weekPlan = getStrengthWeekPlanFromState(state)");
    s = s.replace(/loadWeekPlan\(\)/g, "getStrengthWeekPlanFromState(state)");
  }

  // TS6133 guard: se import entrou mas não há chamada real, remove
  if (s.includes("getStrengthWeekPlanFromState") && !/\bgetStrengthWeekPlanFromState\s*\(/.test(s)) {
    s = removeImport(s);
  }

  if (s !== before) {
    fs.writeFileSync(file, s, "utf8");
    console.log("✅ Patched:", file);
  } else {
    console.log("ℹ️ No changes:", file);
  }
}

console.log("✅ BLOCO 3 patch finalizado.");
MJS

echo "==> Rodar patcher..."
node .scripts/block3_state_soberano.mjs

echo "==> VERIFY (BUILD VERDE obrigatório)..."
npm run verify

echo "==> COMMIT + PUSH..."
git add -A
git commit -m "fix(weekplan): make state the primary source (safe patch) (build green)" || echo "ℹ️ Nada para commitar."
git push origin "$BR"

echo "✅ BLOCO 3 — OK | BUILD VERDE"
