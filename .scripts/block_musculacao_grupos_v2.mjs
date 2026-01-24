import fs from "node:fs";

const file = "src/components/steps/Step5Treino.tsx";
if (!fs.existsSync(file)) { console.error("MISSING:", file); process.exit(1); }

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
fs.mkdirSync(".backups", { recursive: true });
const bk = `.backups/Step5Treino.tsx.before_muscle_groups_v2.${stamp}.bak`;
fs.copyFileSync(file, bk);
console.log("==> Backup:", bk);

let s = fs.readFileSync(file, "utf8");
const before = s;

// Guard: se bloco já existe, sai
if (s.includes("SELECIONE OS GRUPAMENTOS MUSCULARES")) {
  console.log("ℹ️ Bloco já existe. Nada a fazer.");
  process.exit(0);
}

// (A) Garantir imports mínimos
// useState/useMemo
if (!s.includes("useState")) {
  // se já tem React import, não mexe (muito arriscado). Só adiciona no import de react se existir.
  s = s.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+\"react\";/m,
    (m, inside) => {
      const has = (x) => inside.split(",").map(t=>t.trim()).includes(x);
      const want = ["useState","useMemo"].filter(x => !has(x));
      if (!want.length) return m;
      return `import { ${inside.trim()}, ${want.join(", ")} } from "react";`;
    }
  );
}

// load/save selected groups (vamos usar a infra existente; cast any pra não brigar com union)
const needStrengthImports =
  !s.includes(from
