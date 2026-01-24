import fs from "node:fs";

const file = "src/components/treino/WeeklyProtocolActive.tsx";
if (!fs.existsSync(file)) {
  console.error("MISSING:", file);
  process.exit(1);
}

fs.mkdirSync(".backups", { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const bk = `.backups/${file.replaceAll("/", "__")}.before_fix_block2.${stamp}.bak`;
fs.copyFileSync(file, bk);
console.log("==> Backup:", bk);

let s = fs.readFileSync(file, "utf8");
const before = s;

// (1) Remover função local toWeekdayKey (conflita com import)
s = s.replace(
  /(\n|\r\n)\s*function\s+toWeekdayKey\s*\([\s\S]*?\n\s*\}\s*(\n|\r\n)/m,
  "\n"
);

// (2) Remover const sessions duplicado inserido por patch (mantém o useMemo sessions)
s = s.replace(
  /\n\s*const\s+sessions\s*=\s*\(protocol\?\.\s*sessions\s*\?\?\s*\[\]\)\s*as\s*any\[\]\s*;\s*\n/m,
  "\n"
);

// (3) Remover helper getStrengthWeekPlan (ficou unused) — mantém loadWeekPlan direto
s = s.replace(
  /\n\s*function\s+getStrengthWeekPlan\s*\(\)\s*:\s*Record<WeekdayKey,\s*any\[\]>\s*\|\s*null\s*\{\s*[\s\S]*?\n\s*\}\s*\n/m,
  "\n"
);

// (4) Garantir que existe const plan = loadWeekPlan() antes do primeiro uso de plan
if (s.includes("if (!plan)") && !s.match(/\bconst\s+plan\s*=\s*loadWeekPlan\(\)\s*;?/m)) {
  s = s.replace(
    /\n(\s*)if\s*\(\s*!\s*plan\s*\)/m,
    "\n$1const plan = loadWeekPlan();\n$1if (!plan)"
  );
}

// (5) Se import loadWeekPlan existe mas estava unused, agora passa a ser usado.
// (6) Se por acaso existir algum `const sessions` duplicado por nome, não mexemos aqui — o TS vai acusar e ajustamos fino.

if (s === before) {
  console.log("ℹ️ Nenhuma mudança aplicada (arquivo já estava consistente).");
} else {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ WeeklyProtocolActive.tsx corrigido (plan + sessões + imports).");
}
