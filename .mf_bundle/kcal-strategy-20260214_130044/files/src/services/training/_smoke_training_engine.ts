import { pickExercises, getExercisePool } from "./trainingEngine";

function assert(cond: any, msg: string) {
  if (!cond) {
    console.error("❌ SMOKE FAIL:", msg);
    process.exit(2);
  }
}

const groups = ["costas","peito","ombros","biceps","triceps","gluteos","quadriceps","posterior_coxa","panturrilhas"] as const;

for (const g of groups) {
  const pool = getExercisePool(g);
  assert(Array.isArray(pool) && pool.length > 0, `pool vazio: ${g}`);
}

const demo = pickExercises({ group: "costas", count: 2, seed: 123 });
assert(demo.picks.length === 2, "pickExercises não retornou 2 picks");
assert((demo.picks[0].variations?.length ?? 0) === 3, "variations não tem 3 itens");
console.log("✅ SMOKE OK");
console.log("Meta:", demo.meta);
console.log("Picks:", demo.picks.map(x => x.name));
