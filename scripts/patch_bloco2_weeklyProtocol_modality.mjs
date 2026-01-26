import fs from "node:fs";

const targets = [
  "src/features/fitness-suite/engine/weeklyProtocol.ts",
  "src/features/fitness-suite/engine/workoutGenerator.ts",
  "src/features/fitness-suite/contracts/weeklyWorkoutProtocol.ts",
];

const read = (p) => fs.readFileSync(p, "utf8");
const write = (p, s) => fs.writeFileSync(p, s, "utf8");
const must = (cond, msg) => { if (!cond) { console.error("❌ " + msg); process.exit(1); } };

// helpers “motor por modalidade” (MVP premium, mas separado)
const helpers = `
// BLOCO 2 (Premium): motores por modalidade (NUNCA misturar)
type DayName = "seg"|"ter"|"qua"|"qui"|"sex"|"sab"|"dom";
type Modality = "musculacao"|"corrida"|"bike"|"funcional"|"crossfit";

const dayNames: DayName[] = ["seg","ter","qua","qui","sex","sab","dom"];

const normalizeModality = (m: any): Modality | null => {
  const v = String(m || "").toLowerCase();
  if (v.includes("mus")) return "musculacao";
  if (v.includes("corr")) return "corrida";
  if (v.includes("bike") || v.includes("spinning") || v.includes("indoor")) return "bike";
  if (v.includes("func")) return "funcional";
  if (v.includes("cross")) return "crossfit";
  return null;
};

const genMusculacao = (level: string, focus?: string) => ({
  title: "Musculação",
  modality: "musculacao",
  items: [
    { kind: "header", text: "Divisão inteligente • nível: " + level + (focus ? (" • foco: " + focus) : "") },
    { kind: "exercise", name: "Supino reto", sets: level==="avancado"?5:4, reps: level==="iniciante"?10:8, note: "Base de força/hipertrofia." },
    { kind: "exercise", name: "Remada curvada", sets: level==="avancado"?5:4, reps: 8, note: "Costas • postura neutra." },
    { kind: "exercise", name: "Agachamento", sets: level==="iniciante"?3:4, reps: level==="iniciante"?10:8, note: "Padrão dominante de joelho." },
  ],
});

const genCorrida = (level: string, goal?: string) => ({
  title: "Corrida",
  modality: "corrida",
  items: [
    { kind: "header", text: "Ritmo/pace • zona • objetivo: " + (goal || "condicionamento") },
    { kind: "block", name: "Aquecimento", value: "8–12 min Z1–Z2" },
    { kind: "block", name: "Parte principal", value: level==="avancado" ? "4×6 min Z3 (rec 2 min)" : (level==="iniciante" ? "20–30 min Z2 contínuo" : "3×5 min Z3 (rec 2 min)") },
    { kind: "block", name: "Desaquecimento", value: "6–10 min Z1–Z2" },
  ],
});

const genBike = (level: string) => ({
  title: "Bike Indoor",
  modality: "bike",
  items: [
    { kind: "header", text: "Tempo • cadência • percepção de esforço (RPE)" },
    { kind: "block", name: "Aquecimento", value: "8 min RPE 3–4 • 80–95 rpm" },
    { kind: "block", name: "Parte principal", value: level==="avancado" ? "5×4 min RPE 7–8 • 90–105 rpm (rec 2 min)" : "25–35 min RPE 5–6 • 85–100 rpm" },
    { kind: "block", name: "Desaquecimento", value: "6–8 min RPE 2–3" },
  ],
});

const genFuncional = (level: string) => ({
  title: "Funcional",
  modality: "funcional",
  items: [
    { kind: "header", text: "Circuito • rounds • intervalos" },
    { kind: "block", name: "Circuito", value: level==="iniciante" ? "3 rounds • 30s on/30s off" : (level==="avancado" ? "5 rounds • 40s on/20s off" : "4 rounds • 35s on/25s off") },
    { kind: "exercise", name: "Burpee modificado", sets: 0, reps: 0, note: "Técnica > velocidade." },
    { kind: "exercise", name: "Agachamento com peso corporal", sets: 0, reps: 0, note: "Controle do tronco." },
    { kind: "exercise", name: "Remada elástico", sets: 0, reps: 0, note: "Escápulas ativas." },
  ],
});

const genCrossfit = (level: string) => ({
  title: "CrossFit",
  modality: "crossfit",
  items: [
    { kind: "header", text: "WOD completo • cap • estímulo" },
    { kind: "block", name: "WOD", value: level==="avancado" ? "AMRAP 14: 10 thrusters + 10 pull-ups + 200m run" : "AMRAP 12: 8 thrusters (leve) + 8 ring rows + 150m run" },
    { kind: "block", name: "Cap", value: "12–14 min" },
    { kind: "block", name: "Estímulo", value: "Sustentável (não morrer no minuto 3)." },
  ],
});

const generateByModality = (mod: Modality, level: string, focus?: string, goal?: string) => {
  if (mod === "musculacao") return genMusculacao(level, focus);
  if (mod === "corrida") return genCorrida(level, goal);
  if (mod === "bike") return genBike(level);
  if (mod === "funcional") return genFuncional(level);
  return genCrossfit(level);
};
`;

function patchWeeklyProtocol() {
  const p = "src/features/fitness-suite/engine/weeklyProtocol.ts";
  let s = read(p);
  const before = s;

  if (!s.includes("BLOCO 2 (Premium): motores por modalidade")) {
    s = helpers + "\n" + s;
  }

  must(/buildWeeklyProtocol/.test(s), "weeklyProtocol.ts: não encontrei buildWeeklyProtocol (sanity).");

  if (!/export\s+function\s+generateWeeklyProtocolPremium/.test(s)) {
    s += `
export function generateWeeklyProtocolPremium(state: any) {
  const modalities = Array.isArray(state?.treino?.modalidades) ? state.treino.modalidades
    : Array.isArray(state?.perfil?.modalidades) ? state.perfil.modalidades : [];
  const levelBy = (_m: any) => String((state?.treino?.nivel || state?.perfil?.nivelTreino || "iniciante")).toLowerCase();
  const goal = String(state?.perfil?.objetivo || state?.treino?.objetivo || "");
  const byDay: Record<string, any> = (state?.treino?.diasPorModalidade || state?.treino?.dias || null) as any;

  const week = dayNames.map((d) => {
    let mod: any = null;

    if (byDay && typeof byDay === "object") {
      if (byDay[d]) mod = byDay[d];
      if (!mod) {
        for (const k of Object.keys(byDay)) {
          const arr = (byDay as any)[k];
          if (Array.isArray(arr) && arr.includes(d)) { mod = k; break; }
        }
      }
    }
    if (!mod && modalities.length) mod = modalities[0];

    const nm = normalizeModality(mod) || "musculacao";
    const payload = generateByModality(nm, levelBy(nm), state?.treino?.foco, goal);

    return { day: d, modality: payload.modality, title: payload.title, items: payload.items };
  });

  return { week };
}
`;
  }

  if (s !== before) write(p, s);
  console.log("✅ Patched:", p);
}

function patchContracts() {
  const p = "src/features/fitness-suite/contracts/weeklyWorkoutProtocol.ts";
  let s = read(p);
  const before = s;

  if (!/items\?:\s*any\[\]/.test(s)) {
    s = s.replace(/(export\s+interface\s+\w+\s*\{)/, `$1\n  items?: any[];\n`);
  }

  if (s !== before) write(p, s);
  console.log("✅ Patched:", p);
}

function patchWorkoutGenerator() {
  const p = "src/features/fitness-suite/engine/workoutGenerator.ts";
  let s = read(p);
  const before = s;

  if (!s.includes("BLOCO 2 guard: focus groups only for musculacao")) {
    s = `// BLOCO 2 guard: focus groups only for musculacao\n` + s;
  }

  if (s !== before) write(p, s);
  console.log("✅ Patched:", p);
}

for (const t of targets) must(fs.existsSync(t), `Arquivo alvo ausente: ${t}`);

patchWeeklyProtocol();
patchContracts();
patchWorkoutGenerator();

console.log("🎯 BLOCO 2: patch aplicado. Próximo: integrar UI (BLOCO 3) para exibir a semana gerada.");
