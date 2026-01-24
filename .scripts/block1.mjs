import fs from "node:fs";

const file = "src/features/fitness-suite/engine/weeklyProtocol.ts";
if (!fs.existsSync(file)) {
  console.error("MISSING:", file);
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const bk = `.backups/weeklyProtocol.ts.before_block1.${stamp}.bak`;
fs.mkdirSync(".backups", { recursive: true });
fs.copyFileSync(file, bk);
console.log("==> Backup:", bk);

let s = fs.readFileSync(file, "utf8");
const before = s;

// (A) spinning -> bike_indoor (compat)
s = s.replace(/\bspinning\b/g, "bike_indoor");

// (B) remove tipos locais (se existirem)
s = s.replace(
  /export\s+type\s+WorkoutModality[\s\S]*?;\s*\n\s*\nexport\s+type\s+ActivityLevel[\s\S]*?;\s*\n\s*\nexport\s+type\s+WorkoutStructure[\s\S]*?\};\s*\n+/m,
  ""
);

// (C) adiciona import do contrato no topo
const contractImport =
`// ✅ CONTRATO ÚNICO (fonte da verdade)
import type {
  WeeklyWorkoutProtocol,
  WorkoutModality,
  ActivityLevel,
  WorkoutStructure,
} from "@/features/fitness-suite/contracts/weeklyWorkoutProtocol";

`;

if (!s.includes('from "@/features/fitness-suite/contracts/weeklyWorkoutProtocol"')) {
  const m = s.match(/^\s*import\s/m);
  if (m && typeof m.index === "number") {
    s = s.slice(0, m.index) + contractImport + s.slice(m.index);
  } else {
    s = contractImport + s;
  }
}

// (D) cria WeeklyWorkoutProtocolEngine + ajusta assinatura
if (!s.includes("type WeeklyWorkoutProtocolEngine")) {
  s = s.replace(
    /export\s+const\s+buildWeeklyProtocol\s*=\s*\(rawState:\s*any\)\s*:\s*WeeklyWorkoutProtocol\s*=>\s*\{/m,
`type WeeklyWorkoutProtocolEngine = WeeklyWorkoutProtocol & {
  sessions: (WeeklyWorkoutProtocol["sessions"][number] & { plan?: SessionWorkoutPlan })[];
  strategiesByModality?: Record<string, { strategy: string; rationale: string }>;
};

export const buildWeeklyProtocol = (rawState: any): WeeklyWorkoutProtocolEngine => {`
  );
}

// fallback se ainda tiver return type antigo
s = s.replace(
  /export\s+const\s+buildWeeklyProtocol\s*=\s*\(rawState:\s*any\)\s*:\s*WeeklyWorkoutProtocol\s*=>/m,
  "export const buildWeeklyProtocol = (rawState: any): WeeklyWorkoutProtocolEngine =>"
);

// (E) garante allowed modalities (ordem padrão)
s = s.replace(/\["musculacao","funcional","corrida","crossfit","bike_indoor"\]/g, '["musculacao","funcional","corrida","bike_indoor","crossfit"]');

// (F) garante goalByModality bike_indoor (se existir)
s = s.replace(/bike_indoor:\s*"Resistência e potência em bike"\s*,?/m, 'bike_indoor: "Resistência e potência em bike",');

if (s === before) {
  console.log("ℹ️ Nenhuma alteração detectada.");
} else {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ weeklyProtocol.ts atualizado (contrato único + bike_indoor).");
}
