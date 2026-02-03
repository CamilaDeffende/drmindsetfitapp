import { planWeek, type PlannerInput } from "./trainingPlanner.engine";
import { plannerWeekToTreinoPlan } from "./plannerWeekToTreino.adapter";

const input: PlannerInput = {
  level: "intermediario",
  goal: "condicionamento",
  available_days: 3,
  modalities: ["strength", "running", "cycling"], // <- mutável (sem as const)
};

const weekly = planWeek(input);

const treino = plannerWeekToTreinoPlan({
  weekly,
  input,
  daysSelectedPT: ["Seg", "Qua", "Sex"],
});

console.log("✅ divisaoSemanal:", treino.divisaoSemanal);
console.log("✅ freq:", treino.frequencia);
console.log(
  "✅ treinos:",
  (treino.treinos as any[])
    .map((d: any) => `${d.dia}:${d.modalidade}:${d.titulo}:${(d.exercicios || []).length}`)
    .join(" | ")
);
