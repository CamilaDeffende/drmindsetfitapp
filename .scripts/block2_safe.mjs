import fs from "node:fs";

const file = "src/components/treino/WeeklyProtocolActive.tsx";
if (!fs.existsSync(file)) {
  console.error("MISSING:", file);
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
fs.mkdirSync(".backups", { recursive: true });
const bk = `.backups/${file.replaceAll("/", "__")}.before_block2_safe.${stamp}.bak`;
fs.copyFileSync(file, bk);
console.log("==> Backup:", bk);

let s = fs.readFileSync(file, "utf8");
const before = s;

// (A) Garantir imports (sem duplicar)
function ensureImport(line) {
  if (s.includes(line)) return;
  const m = s.match(/^\s*import[\s\S]*?\n/m);
  if (m) {
    const idx = (m.index ?? 0) + m[0].length;
    s = s.slice(0, idx) + line + "\n" + s.slice(idx);
  } else {
    s = line + "\n" + s;
  }
}

ensureImport(`import { loadWeekPlan } from "@/utils/strength/strengthWeekStorage";`);
ensureImport(`import { toWeekdayKey } from "@/utils/strength/weekdayMap";`);
ensureImport(`import type { WeekdayKey } from "@/utils/strength/strengthWeekStorage";`);

// (B) Troca chamada da função antiga (sem remover blocos)
s = s.replace(/toWeekdayKeyFromLabel\s*\(/g, "toWeekdayKey(");

// (C) Helper weekPlan soberano (state -> fallback localStorage)
if (!s.includes("function getStrengthWeekPlan")) {
  const inject = `
  function getStrengthWeekPlan(): Record<WeekdayKey, any[]> | null {
    const st = (state as any)?.strengthWeekPlan;
    if (st && typeof st === "object") return st as any;
    try { return loadWeekPlan() as any; } catch { return null; }
  }
`;

  const patterns = [
    /const\s+state\s*=\s*useUIStore\(\)\s*;?\s*\n/,
    /const\s+\{\s*state\s*\}\s*=\s*useUIStore\(\)\s*;?\s*\n/,
    /const\s+\{\s*state\s*,[^\}]*\}\s*=\s*useUIStore\(\)\s*;?\s*\n/,
    /const\s+state\s*=\s*useAppStore\(\)\s*;?\s*\n/,
  ];

  let injected = false;
  for (const re of patterns) {
    if (re.test(s)) {
      s = s.replace(re, (m) => m + inject);
      injected = true;
      break;
    }
  }

  if (!injected) {
    s = s.replace(
      /const\s+protocol\s*=\s*\(state\s+as\s+any\)\?\.workoutProtocolWeekly\s*\?\?\s*null;\s*\n/,
      (m) => m + inject
    );
  }
}

// (D) Garantir sessions (não reestrutura nada, só garante var)
if (!s.includes("const sessions = (protocol?.sessions")) {
  s = s.replace(
    /const\s+protocol\s*=\s*\(state\s+as\s+any\)\?\.workoutProtocolWeekly\s*\?\?\s*null;\s*\n/,
    (m) => m + `  const sessions = (protocol?.sessions ?? []) as any[];\n`
  );
}

// (E) WeekPlan: remover plan local e usar helper
s = s.replace(/const\s+plan\s*=\s*loadWeekPlan\(\)\s*;?\s*\n/g, "");
s = s.replace(/loadWeekPlan\(\)/g, "getStrengthWeekPlan()");

// (F) Hardening: normalizar label se existir
s = s.replace(/"Musculação"/g, `"musculacao"`);

// (G) Remove void solto
s = s.replace(/\n\s*void\s+[A-Za-z0-9_]+\s*;\s*\n/g, "\n");

if (s !== before) {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ WeeklyProtocolActive.tsx atualizado (SAFE).");
} else {
  console.log("ℹ️ Nenhuma alteração detectada.");
}
