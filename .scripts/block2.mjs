import fs from "node:fs";

const file = "src/components/treino/WeeklyProtocolActive.tsx";
if (!fs.existsSync(file)) {
  console.error("MISSING:", file);
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
fs.mkdirSync(".backups", { recursive: true });
const bk = `.backups/${file.replaceAll("/", "__")}.before_block2.${stamp}.bak`;
fs.copyFileSync(file, bk);
console.log("==> Backup:", bk);

let s = fs.readFileSync(file, "utf8");
const before = s;

// (A) Garantir imports essenciais (sem duplicar)
const need = [
  `import { loadWeekPlan } from "@/utils/strength/strengthWeekStorage";`,
  `import type { WeekdayKey } from "@/utils/strength/strengthWeekStorage";`,
  `import { toWeekdayKey } from "@/utils/strength/weekdayMap";`,
];
for (const imp of need) {
  if (!s.includes(imp)) {
    // injeta após o primeiro import
    const m = s.match(/^\s*import[\s\S]*?\n/m);
    if (m) {
      const idx = (m.index ?? 0) + m[0].length;
      s = s.slice(0, idx) + imp + "\n" + s.slice(idx);
    } else {
      s = imp + "\n" + s;
    }
  }
}

// (B) Remover helper local duplicado de toWeekdayKeyFromLabel se existir
s = s.replace(
  /function\s+toWeekdayKeyFromLabel\s*\([\s\S]*?\n\}\n+/m,
  ""
);

// (C) Forçar leitura de protocolo da fonte única
// Troca: const protocol = (state as any)?.workoutProtocolWeekly ?? null;  (mantém)
// Mas garante que sessions vem de protocol.sessions e não de outro lugar.
if (!s.includes("const sessions =")) {
  s = s.replace(
    /const\s+protocol\s*=\s*\(state\s+as\s+any\)\?\.workoutProtocolWeekly\s*\?\?\s*null;\s*\n/m,
    (m) => m + `  const sessions = (protocol?.sessions ?? []) as any[];\n`
  );
} else {
  // se existir const sessions com outra fonte, normaliza
  s = s.replace(
    /const\s+sessions\s*=\s*[\s\S]*?;\s*\n/m,
    `  const sessions = (protocol?.sessions ?? []) as any[];\n`
  );
}

// (D) Criar getter soberano de weekPlan (state -> localStorage)
if (!s.includes("function getStrengthWeekPlan")) {
  s = s.replace(
    /export\s+function\s+WeeklyProtocolActive\s*\(\)\s*\{\s*\n/m,
    `export function WeeklyProtocolActive() {\n` +
    `  function getStrengthWeekPlan(): Record<string, any[]> | null {\n` +
    `    const st = (state as any)?.strengthWeekPlan;\n` +
    `    if (st && typeof st === "object") return st as any;\n` +
    `    try { return loadWeekPlan(); } catch { return null; }\n` +
    `  }\n`
  );
}

// (E) Dentro do componente: garantir uso determinístico
// - remover const plan = loadWeekPlan(); etc e trocar por:
//   const weekPlan = getStrengthWeekPlan();
// - converter day com toWeekdayKey(session.day)
s = s.replace(/const\s+plan\s*=\s*loadWeekPlan\(\);\s*\n/g, "");
s = s.replace(/loadWeekPlan\(\)/g, "getStrengthWeekPlan()");

// (F) Se houver lógica com toWeekdayKeyFromLabel, troca por toWeekdayKey
s = s.replace(/toWeekdayKeyFromLabel\s*\(/g, "toWeekdayKey(");

// (G) Hardening: garantir modality string
// se houver checks com 'musculação' etc, mantém apenas musculacao.
s = s.replace(/"Musculação"/g, `"musculacao"`);

// (H) Remove possíveis void/unused explícitos antigos dentro do arquivo
s = s.replace(/\n\s*void\s+[A-Za-z0-9_]+\s*;\s*\n/g, "\n");

// (I) Se o arquivo não usa WeekdayKey em nenhum lugar, remover import
if (!s.includes("WeekdayKey")) {
  s = s.replace(/import\s+type\s+\{\s*WeekdayKey\s*\}\s+from\s+"@\/utils\/strength\/strengthWeekStorage";\s*\n/m, "");
}

// (J) Garantir toWeekdayKey está realmente usado (se não, remover import)
if (!s.includes("toWeekdayKey(")) {
  s = s.replace(/import\s+\{\s*toWeekdayKey\s*\}\s+from\s+"@\/utils\/strength\/weekdayMap";\s*\n/m, "");
}

if (s !== before) {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ WeeklyProtocolActive.tsx atualizado (source única + weekPlan soberano + chips corretos).");
} else {
  console.log("ℹ️ Nenhuma alteração detectada (talvez já esteja ok).");
}
