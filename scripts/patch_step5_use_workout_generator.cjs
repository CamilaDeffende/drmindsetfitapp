/* eslint-disable */
const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "src/components/steps/Step5Treino.tsx");
let s = fs.readFileSync(file, "utf8");

// imports
if (!s.includes('from "@/features/fitness-suite/engine/workoutGenerator"')) {
  // insere logo após imports de engine existentes (melhor esforço)
  const importBlockMatch = s.match(/(import[\s\S]*?\n)\nexport function Step5Treino/m);
  if (!importBlockMatch) {
    console.error("PATCH_FAIL: could not locate import block");
    process.exit(1);
  }
  const insert = 'import { generateWeeklyWorkout } from "@/features/fitness-suite/engine/workoutGenerator";\n';
  s = s.replace(importBlockMatch[1], importBlockMatch[1] + insert);
}

// anchor: onde já salvamos workoutProtocolWeekly
const anchor = "updateState({ workoutProtocolWeekly: __protocol } as any);";
if (!s.includes(anchor)) {
  console.error("PATCH_FAIL: anchor not found: workoutProtocolWeekly update");
  process.exit(1);
}

// injeta 1x
if (!s.includes("generateWeeklyWorkout({")) {
  s = s.replace(anchor, [
    "    // Treino inteligente (individualizado + variações por seed)\n",
    "    const treinoPlan = generateWeeklyWorkout({ state, daysSelected, planByDay: (planByDay as any) });\n",
    "    updateState({ treino: treinoPlan } as any);\n",
    "\n",
    anchor
  ].join(""));
}

// opcional: garantir que __protocol carregue os treinos (para Planos Ativos usar protocolo também)
if (!s.includes("__protocol.treinoPlan =")) {
  // tenta anexar próximo do anchor (antes do updateState do protocol)
  s = s.replace(anchor, [
    "    // anexar ao protocolo semanal (fallback p/ telas que leem workoutProtocolWeekly)\n",
    "    try { (__protocol as any).treinoPlan = treinoPlan; } catch (e) {}\n",
    "    \n",
    anchor
  ].join(""));
}

fs.writeFileSync(file, s, "utf8");
console.log("PATCH_OK: Step5Treino now uses workoutGenerator (treinoPlan) + persists treino + attaches to workoutProtocolWeekly.");
