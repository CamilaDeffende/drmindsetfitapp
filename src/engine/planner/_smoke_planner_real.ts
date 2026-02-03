import { planWeek } from "./trainingPlanner.engine";

const out = planWeek({
  level: "intermediario",
  goal: "condicionamento",
  available_days: 5,
  modalities: ["running","cycling","strength"]
});

console.log("✅ planner output keys:", Object.keys(out));
console.log("monday:", out.monday);
console.log("tuesday:", out.tuesday);
console.log("wednesday:", out.wednesday);
