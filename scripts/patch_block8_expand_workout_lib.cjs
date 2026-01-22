const fs = require("fs");

const file = "src/features/fitness-suite/engine/workoutGenerator.ts";
let s = fs.readFileSync(file, "utf8");

const start = s.indexOf("const LIB = {");
const end = s.indexOf("} as const;", start);
if (start < 0 || end < 0) {
  console.error("PATCH_FAIL: bloco 'const LIB = {' ... '} as const;' não encontrado.");
  process.exit(1);
}

const before = s.slice(0, start);
const after = s.slice(end + "} as const;".length);

const lib = `
const LIB = {
  musculacao: {
    aquecimento: [
      "Mobilidade de ombro", "Mobilidade de quadril", "Ativação de core", "Bike leve 5min", "Corda leve 3-5min",
      "Caminhada inclinada 5min", "Mobilidade torácica", "Rotadores externos (elástico)", "Ativação glúteo médio", "Alongamento dinâmico"
    ],
    peito: [
      "Supino reto (barra)", "Supino reto (halteres)", "Supino inclinado (barra)", "Supino inclinado (halteres)", "Crucifixo (halteres)",
      "Crucifixo inclinado", "Crossover (polia)", "Peck deck", "Flexão (variações)", "Supino declinado", "Chest press (máquina)"
    ],
    costas: [
      "Puxada na barra", "Puxada aberta (polia)", "Puxada neutra (polia)", "Remada curvada", "Remada unilateral (halter)",
      "Remada baixa (cabo)", "Remada T-bar", "Pulldown", "Pullover (cabo)", "Serrote", "Hiperextensão lombar"
    ],
    pernas: [
      "Agachamento livre", "Agachamento frontal", "Leg press", "Hack squat", "Passada (lunge)", "Afundo búlgaro",
      "Stiff", "Levantamento terra romeno", "Cadeira extensora", "Cadeira flexora", "Mesa flexora", "Panturrilha em pé",
      "Panturrilha sentado", "Hip thrust", "Glute bridge", "Abdução (máquina)", "Adutora (máquina)"
    ],
    ombro: [
      "Desenvolvimento (barra)", "Desenvolvimento (halteres)", "Arnold press", "Elevação lateral", "Elevação lateral (cabo)",
      "Elevação frontal", "Crucifixo invertido", "Face pull", "Remada alta (leve)", "Elevação Y (banco inclinado)"
    ],
    bracos: [
      "Rosca direta", "Rosca alternada", "Rosca martelo", "Rosca Scott", "Rosca concentrada",
      "Tríceps testa", "Tríceps corda", "Tríceps banco", "Mergulho (paralela)", "Tríceps francês"
    ],
    core: [
      "Prancha", "Prancha lateral", "Abdominal infra", "Dead bug", "Pallof press",
      "Russian twist", "Hollow hold", "Bird-dog", "Elevação de pernas", "Cable crunch"
    ],
  },

  funcional: {
    circuitos: [
      "Circuito full body", "Circuito metabólico", "Circuito força+cardio", "Circuito core+glúteos", "Circuito potência",
      "Circuito EMOM leve", "Circuito AMRAP moderado", "Circuito intervalado", "Circuito mobilidade+força", "Circuito resistência"
    ],
    moves: [
      "Burpee", "Kettlebell swing", "Agachamento goblet", "Puxada elástico", "Flexão", "Box step-up", "Farmer walk", "Lunge",
      "Remada TRX", "Ponte de glúteo", "Good morning (leve)", "Jumping jack", "Corrida estacionária", "Battle rope (se houver)",
      "Thruster (leve)", "Wall sit", "Skater jumps", "Bear crawl", "Corda", "Deadlift kettlebell (leve)"
    ],
    core: ["Prancha", "Hollow hold", "Mountain climber", "Dead bug", "Sit-up", "Bicicleta", "Side plank", "V-up (reg.)"],
  },

  corrida: {
    treinos: [
      "Base Z2", "Intervalado", "Fartlek", "Limiar", "Longão", "Subidas",
      "Progressivo", "Tiros curtos", "Tiros longos", "Tempo run", "Z2 + strides", "Regenerativo"
    ],
    tecnica: [
      "Drills educativos", "Cadência", "Postura", "Respiração", "Aquecimento progressivo",
      "Fortalecimento do pé/tornozelo", "Mobilidade de quadril", "Coordenação (skip/A/B)", "Strides", "Técnica de subida"
    ],
  },

  bike_indoor: {
    treinos: [
      "Z2 contínuo", "HIIT 30/60", "Limiar 3x8", "Subidas 6x3", "Sprint 10x15/45", "Pirâmide",
      "Sweet spot 2x12", "Over/Under 3x6", "Cadência alta 6x2", "Tempo 20min", "Z2 longo", "Sprint 8x20/40"
    ],
    tecnica: [
      "Cadência 80-95", "Posicionamento", "Respiração", "Controle de carga", "Técnica em pé/sentado",
      "Estabilidade de tronco", "Transições de marcha", "Pacing", "Ritmo constante", "Técnica de subida"
    ],
  },

  crossfit: {
    formatos: ["EMOM", "AMRAP", "For Time", "Chipper", "Técnica + força", "Intervalos", "Tabata", "E2MOM"],
    movimentos: [
      "Air squat", "Thruster", "Kettlebell swing", "Wall ball", "Box jump", "Pull-up (regressão)", "Push press", "Row (remo)",
      "Deadlift (leve)", "Front squat (leve)", "Burpee", "Sit-up", "Power clean (leve)", "Farmer carry", "Lunge", "Push-up"
    ],
    core: ["Toes to bar (reg.)", "Sit-up", "Plank", "Hollow", "Russian twist", "Knee raises", "Dead bug", "Side plank"],
  },
} as const;
`.trim() + "\n";

s = before + lib + after;

// Expandir splits da musculação (mais combinações)
if (s.includes('const split = [') && s.includes('const pickSplit = pick(split, h);')) {
  s = s.replace(
    /const\s+split\s*=\s*\[[\s\S]*?\]\s*;\s*\n\s*const\s+pickSplit\s*=\s*pick\(split,\s*h\)\s*;/m,
    [
      'const split = [',
      '  ["peito","ombro","bracos","core"],',
      '  ["costas","bracos","core"],',
      '  ["pernas","core"],',
      '  ["peito","costas","core"],',
      '  ["pernas","ombro","core"],',
      '  ["peito","triceps","core"],',
      '  ["costas","biceps","core"],',
      '  ["pernas","gluteos","core"],',
      '  ["ombro","bracos","core"],',
      '  ["peito","costas","ombro","core"],',
      '  ["pernas","panturrilha","core"],',
      '];',
      'const pickSplit = pick(split, h);'
    ].join("\n")
  );

  // garantir que grupos extras não quebrem (mapear aliases no pool)
  // (biceps/triceps/gluteos/panturrilha) -> usa bracos/pernas como fallback via pool lookup atual
  s = s.replace(
    /const\s+pool\s*=\s*\(lib\s+as\s+any\)\[g\]\s+as\s+string\[\];/g,
    'const key = (g === "biceps" || g === "triceps") ? "bracos" : (g === "gluteos" || g === "panturrilha") ? "pernas" : g;\n      const pool = (lib as any)[key] as string[];'
  );
}

fs.writeFileSync(file, s, "utf8");
console.log("PATCH_OK: LIB expandida (5 modalidades) + splits musculação expandidos.");
