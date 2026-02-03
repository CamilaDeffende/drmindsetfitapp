import { generateRunningWeek, toPrettyJSON } from "../src/modules/running";

const args = process.argv.slice(2);
const level = (args[0] ?? "INICIANTE") as any;
const goal = (args[1] ?? "5K") as any;
const daysPerWeek = Number(args[2] ?? 4) as any;
const hasStrength = (args[3] ?? "true") === "true";

const plan = generateRunningWeek({ level, goal, daysPerWeek, hasStrength, weekIndex: 1 });
console.log(toPrettyJSON(plan));
