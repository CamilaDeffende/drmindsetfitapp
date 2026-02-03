import fs from "fs";
import path from "path";
import { generateRunningWeek, toPrettyJSON } from "../src/modules/running";

const outDir = process.argv[2] ?? "public/mindsetfit/running";
const combos: Array<[any, any, any]> = [
  ["INICIANTE","5K",3], ["INICIANTE","10K",4],
  ["INTERMEDIARIO","10K",4], ["INTERMEDIARIO","21K",5],
  ["AVANCADO","21K",5], ["AVANCADO","42K",6],
];

fs.mkdirSync(outDir, { recursive: true });

for (const [level, goal, daysPerWeek] of combos) {
  const plan = generateRunningWeek({ level, goal, daysPerWeek, hasStrength: true, weekIndex: 1 });
  const filename = `week1_${level}_${goal}_${daysPerWeek}x.json`.replace(/[^a-zA-Z0-9_.-]/g,"_");
  const file = path.join(outDir, filename);
  fs.writeFileSync(file, toPrettyJSON(plan), "utf8");
  console.log("✅ export:", file);
}
