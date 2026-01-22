/* eslint-disable */
const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "src/components/steps/Step5Treino.tsx");
let s = fs.readFileSync(file, "utf8");

if (!s.includes('from "@/features/fitness-suite/engine/goalEnergy"')) {
  s = s.replace(
    /from\s+"@\/features\/fitness-suite\/engine\/weeklyProtocol";\s*\n/,
    (m) => m + 'import { computeFinalTargetCalories } from "@/features/fitness-suite/engine/goalEnergy";\n'
  );
}

const needle = "updateState({ workoutProtocolWeekly: __protocol } as any);";
if (!s.includes(needle)) {
  console.error("PATCH_FAIL: anchor not found in Step5Treino.tsx");
  process.exit(1);
}

if (!s.includes("computeFinalTargetCalories(")) {
  s = s.replace(
    needle,
    [
      "    // energia alvo final (GET + ajuste por objetivo + carga semanal)\n",
      "    const getKcal = Number((state as any)?.metabolismo?.get ?? (state as any)?.metabolismo?.caloriasAlvo ?? 0);\n",
      "    const pesoKg = Number((state as any)?.avaliacao?.peso ?? (state as any)?.perfil?.pesoAtual ?? 70);\n",
      "    const nivelAtv = String((state as any)?.metabolismo?.nivelAtividade ?? (state as any)?.perfil?.nivelTreino ?? 'iniciante').toLowerCase();\n",
      "    const level = (nivelAtv.includes('avan') ? 'avancado' : nivelAtv.includes('inter') ? 'intermediario' : 'iniciante');\n",
      "    const goalRaw = (state as any)?.perfil?.objetivo;\n",
      "    const energy = computeFinalTargetCalories({\n",
      "      getKcal: getKcal || 0,\n",
      "      goalRaw,\n",
      "      level,\n",
      "      daysSelected,\n",
      "      planByDay: planByDay as any,\n",
      "      pesoKg,\n",
      "    });\n",
      "\n",
      "    // persistir no state para Nutrição/Relatório (transparência + consistência)\n",
      "    updateState({\n",
      "      metabolismo: {\n",
      "        ...(state as any).metabolismo,\n",
      "        objetivoNormalizado: energy.goal,\n",
      "        treinoKcalSemanalEstimado: energy.treinoKcalSemanal,\n",
      "        treinoKcalDiaMedioEstimado: energy.treinoKcalDiaMedio,\n",
      "        deltaObjetivoKcal: energy.deltaObjetivoKcal,\n",
      "        caloriasAlvo: energy.caloriasAlvoFinal,\n",
      "        caloriasAlvoFinal: energy.caloriasAlvoFinal,\n",
      "      },\n",
      "    } as any);\n",
      "\n",
      needle
    ].join("")
  );
}

fs.writeFileSync(file, s, "utf8");
console.log("PATCH_OK: Step5Treino now computes final target calories (goal+load) and persists in metabolismo.");
