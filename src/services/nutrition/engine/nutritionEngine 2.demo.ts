// MF_NUTRITION_ENGINE_DEMO_V1
import { buildNutritionPlan } from "./nutritionEngine";

function demo(label: string, body: any, opts: any) {
  const plan = buildNutritionPlan(body, opts);
  // saída determinística e curta
  console.log("\n==>", label);
  console.log({
    ree: plan.ree_kcal,
    tdee: plan.tdee_kcal,
    alvo: plan.alvo_kcal,
    metodo: plan.metodo_ree,
    atividade: plan.fator_atividade,
    delta: plan.delta_objetivo_kcal,
    macros: plan.macros,
  });
}

demo("MASC | 30y | 80kg | 180cm | moderado | emag | meso", 
  { sexo: "masculino", idade: 30, pesoKg: 80, alturaCm: 180 }, 
  { objetivo: "emagrecimento", biotipo: "mesomorfo", atividade: "moderado" }
);

demo("FEM | 28y | 62kg | 165cm | leve | manut | ecto", 
  { sexo: "feminino", idade: 28, pesoKg: 62, alturaCm: 165 }, 
  { objetivo: "manutencao", biotipo: "ectomorfo", atividade: "leve" }
);

demo("MASC | 40y | 92kg | 175cm | alto | ganho | endo | MM 72kg",
  { sexo: "masculino", idade: 40, pesoKg: 92, alturaCm: 175, massaMagraKg: 72 },
  { objetivo: "ganho", biotipo: "endomorfo", atividade: "alto" }
);
