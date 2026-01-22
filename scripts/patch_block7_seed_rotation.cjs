const fs = require("fs");

function ensureUserSeedHelper(seedFile) {
  let s = fs.readFileSync(seedFile, "utf8");
  if (s.includes("getOrCreateUserSeed")) return false;

  const add = `

export function getOrCreateUserSeed(key: string = "mindsetfit:userSeed:v1"): number {
  try {
    if (typeof window === "undefined") return 0;
    const raw = window.localStorage.getItem(key);
    if (raw && String(parseInt(raw, 10)) === raw.trim()) return parseInt(raw, 10) >>> 0;

    // gera seed 32-bit (prefer crypto)
    let seed = 0;
    try {
      const a = new Uint32Array(1);
      window.crypto.getRandomValues(a);
      seed = (a[0] >>> 0);
    } catch {
      seed = (Math.floor(Math.random() * 0xFFFFFFFF) >>> 0);
    }
    window.localStorage.setItem(key, String(seed));
    return seed >>> 0;
  } catch {
    return 0;
  }
}
`;
  s = s.trimEnd() + "\n" + add + "\n";
  fs.writeFileSync(seedFile, s, "utf8");
  return true;
}

function patchWorkoutGenerator(file) {
  let s = fs.readFileSync(file, "utf8");

  // (1) garantir import do helper/hasher
  if (!s.includes('from "./workoutSeed"')) {
    s = s.replace(
      /import\s+type\s+\{\s*ModalidadeTreino\s*,\s*IntensidadeTreino\s*\}\s+from\s+["'][^"']+["'];\s*/m,
      (m) => m + `\nimport { getOrCreateUserSeed, hashSeed } from "./workoutSeed";\n`
    );
  }

  // (2) substituir baseSeed atual (JSON.stringify) por seed persistente + ISO week + perfilCore
  const baseSeedRe = /const\s+baseSeed\s*=\s*stableHash\s*\(\s*JSON\.stringify\s*\(\s*\{[\s\S]*?\}\s*\)\s*\)\s*;\s*/m;

  const replacement = [
    `const userSeed = getOrCreateUserSeed();`,
    `  const now = new Date();`,
    `  const weekKey = (() => {`,
    `    // ISO week key: YYYY-Www (UTC-safe)`,
    `    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));`,
    `    const dayNum = d.getUTCDay() || 7;`,
    `    d.setUTCDate(d.getUTCDate() + 4 - dayNum);`,
    `    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));`,
    `    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);`,
    `    const y = d.getUTCFullYear();`,
    `    return String(y) + "-W" + String(weekNo).padStart(2, "0");`,
    `  })();`,
    ``,
    `  const profileKey = JSON.stringify({`,
    `    nome: state?.perfil?.nomeCompleto ?? "",`,
    `    idade: state?.perfil?.idade ?? "",`,
    `    altura: state?.perfil?.altura ?? "",`,
    `    peso: state?.perfil?.pesoAtual ?? state?.avaliacao?.peso ?? "",`,
    `    objetivo: state?.perfil?.objetivo ?? "",`,
    `    modalidade: state?.perfil?.modalidadePrincipal ?? "",`,
    `    nivel: nivel,`,
    `    goal: goal,`,
    `  });`,
    ``,
    `  // Seed determinístico + persistente + rotativo por semana (evita repetição global)`,
    `  const baseSeed = hashSeed(String(userSeed) + "|" + weekKey + "|" + profileKey);`,
    ``
  ].join("\n");

  if (!baseSeedRe.test(s)) {
    console.error("PATCH_FAIL: bloco baseSeed (stableHash(JSON.stringify({..}))) não encontrado.");
    process.exit(1);
  }

  s = s.replace(baseSeedRe, replacement);

  fs.writeFileSync(file, s, "utf8");
  return true;
}

const seedFile = "src/features/fitness-suite/engine/workoutSeed.ts";
const genFile = "src/features/fitness-suite/engine/workoutGenerator.ts";

const a = ensureUserSeedHelper(seedFile);
const b = patchWorkoutGenerator(genFile);

console.log("PATCH_OK:", { workoutSeed_userSeedHelper_added: a, workoutGenerator_seedRotation_applied: b });
