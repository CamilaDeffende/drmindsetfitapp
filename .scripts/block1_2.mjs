import fs from "node:fs";

const file = "src/features/fitness-suite/engine/sessionPlanner.ts";
if (!fs.existsSync(file)) {
  console.error("MISSING:", file);
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
fs.mkdirSync(".backups", { recursive: true });
const bk = `.backups/${file.replaceAll("/", "__")}.before_block1_2.${stamp}.bak`;
fs.copyFileSync(file, bk);
console.log("==> Backup:", bk);

let s = fs.readFileSync(file, "utf8");
const before = s;

s = s.replace(/"força"/g, `"forca"`);
s = s.replace(/"técnico"/g, `"tecnico"`);
s = s.replace(/"metabólico"/g, `"metabolico"`);
s = s.replace(/"resistência"/g, `"resistencia"`); // caso exista

if (s !== before) {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ sessionPlanner.ts normalizado (strings sem acento).");
} else {
  console.log("ℹ️ Nenhuma alteração detectada.");
}
