#!/usr/bin/env bash
set -euo pipefail

FILE="src/components/steps/Step5Treino.tsx"
BR="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
BK=".backups/Step5Treino.tsx.before_muscle_groups_dedup_v2.$(date +%Y%m%d_%H%M%S).bak"

mkdir -p .backups
cp -a "$FILE" "$BK"

echo "==> BRANCH: $BR"
echo "==> Backup: $BK"

node - <<'NODE'
const fs = require("fs");

const file = "src/components/steps/Step5Treino.tsx";
let s = fs.readFileSync(file, "utf8");
const before = s;

// 1) Remover bloco duplicado no PREVIEW usando marcador estável
const marker = "/* Grupamentos da semana (apenas Musculação) */";
const idx = s.indexOf(marker);

if (idx !== -1) {
  const nextCardTitle = s.indexOf("<CardTitle", idx);
  if (nextCardTitle !== -1) {
    const chunk = s.slice(idx, nextCardTitle);
    if (chunk.includes("<StrengthMuscleGroupsPicker")) {
      s = s.slice(0, idx) + s.slice(nextCardTitle);
    }
  }
}

// 2) Fallback: se ainda houver 2 ocorrências, remove a última
const needle = "<StrengthMuscleGroupsPicker />";
const first = s.indexOf(needle);
const last = s.lastIndexOf(needle);
if (first !== -1 && last !== -1 && first !== last) {
  s = s.slice(0, last) + s.slice(last).replace(needle, "");
}

// 3) Normalizar check com acento (proteção)
s = s.split('includes("musculação")').join('includes("musculacao")');
if (s === before) {
  console.log("ℹ️ Nenhuma mudança aplicada (provavelmente já estava deduplicado).");
} else {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Dedup aplicado: removido picker duplicado do preview e mantido bloco 1.5 condicional.");
}
NODE

echo "==> VERIFY (BUILD VERDE obrigatório)..."
npm run verify

echo "==> Commit + push..."
git add -A
git commit -m "fix(musculacao): remove duplicate muscle-groups picker from preview (build green)" || echo "ℹ️ Nada para commitar."
git push origin "$BR"

echo "==> CHECK: ocorrências do picker (deve ficar 1x no bloco 1.5)"
rg -n "<StrengthMuscleGroupsPicker" "$FILE" || true

echo "✅ HOTFIX OK | BUILD VERDE"
