import fs from "node:fs";

const files = [
  "src/features/fitness-suite/engine/weeklyProtocol.ts",
  "src/features/fitness-suite/engine/sessionPlanner.ts",
];

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
fs.mkdirSync(".backups", { recursive: true });

function backup(p) {
  if (!fs.existsSync(p)) return;
  const bk = `.backups/${p.replaceAll("/", "__")}.before_block1_1.${stamp}.bak`;
  fs.copyFileSync(p, bk);
  console.log("==> Backup:", bk);
}

for (const p of files) backup(p);

// ============ PATCH weeklyProtocol.ts ============
const wp = "src/features/fitness-suite/engine/weeklyProtocol.ts";
if (!fs.existsSync(wp)) {
  console.error("MISSING:", wp);
  process.exit(1);
}

let s = fs.readFileSync(wp, "utf8");
const before = s;

// (1) Remover type local WeeklyWorkoutProtocol (engine antigo) se existir
s = s.replace(
  /export\s+type\s+WeeklyWorkoutProtocol\s*=\s*\{[\s\S]*?\};\s*\n+/m,
  ""
);

// (2) Re-export types do contrato (compat)
const reExportLine =
'export type { WeeklyWorkoutProtocol, WorkoutModality, ActivityLevel, WorkoutStructure } from "@/features/fitness-suite/contracts/weeklyWorkoutProtocol";\n';

if (!s.includes(reExportLine.trim())) {
  if (!s.endsWith("\n")) s += "\n";
  s += "\n" + reExportLine;
}

// (3) Normalizar strings do structureForSession (sem acento, conforme contrato)
const map = [
  [/"força"/g, `"forca"`],
  [/"técnico"/g, `"tecnico"`],
  [/"metabólico"/g, `"metabolico"`],
  [/"resistência"/g, `"resistencia"`],
];

for (const [rx, rep] of map) s = s.replace(rx, rep);

// (4) Fallback: assinatura antiga
s = s.replace(
  /export\s+const\s+buildWeeklyProtocol\s*=\s*\(rawState:\s*any\)\s*:\s*WeeklyWorkoutProtocol\s*=>/m,
  "export const buildWeeklyProtocol = (rawState: any): WeeklyWorkoutProtocolEngine =>"
);

if (s !== before) {
  fs.writeFileSync(wp, s, "utf8");
  console.log("✅ weeklyProtocol.ts corrigido (remove local WeeklyWorkoutProtocol + re-export + strings).");
} else {
  console.log("ℹ️ weeklyProtocol.ts já estava ok.");
}

// ============ PATCH sessionPlanner.ts ============
const sp = "src/features/fitness-suite/engine/sessionPlanner.ts";
if (!fs.existsSync(sp)) {
  console.error("MISSING:", sp);
  process.exit(1);
}

let spc = fs.readFileSync(sp, "utf8");
const spBefore = spc;

spc = spc.replace(
  /import\s+type\s+\{\s*ActivityLevel\s*,\s*WorkoutModality\s*,\s*WorkoutStructure\s*\}\s+from\s+"\.\/weeklyProtocol";/m,
  'import type { ActivityLevel, WorkoutModality, WorkoutStructure } from "@/features/fitness-suite/contracts/weeklyWorkoutProtocol";'
);

if (spc !== spBefore) {
  fs.writeFileSync(sp, spc, "utf8");
  console.log("✅ sessionPlanner.ts import types -> contrato.");
} else {
  console.log("ℹ️ sessionPlanner.ts já estava ok.");
}
