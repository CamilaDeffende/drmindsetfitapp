import fs from "node:fs";

const file = "src/components/treino/WeeklyProtocolActive.tsx";
if (!fs.existsSync(file)) {
  console.error("MISSING:", file);
  process.exit(1);
}

fs.mkdirSync(".backups", { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const bk = `.backups/${file.replaceAll("/", "__")}.before_block2_fix_final.${stamp}.bak`;
fs.copyFileSync(file, bk);
console.log("==> Backup:", bk);

let s = fs.readFileSync(file, "utf8");
const before = s;

// remove import type WeekdayKey se existir (e não quebra se já tiver sido removido)
s = s.replace(
  /^\s*import\s+type\s+\{\s*WeekdayKey\s*\}\s+from\s+"@\/utils\/strength\/strengthWeekStorage";\s*\n/m,
  ""
);

// se existir WeekdayKey em algum lugar (não deveria), não removemos nada além do import
if (s !== before) {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ WeeklyProtocolActive.tsx: removido import WeekdayKey (unused).");
} else {
  console.log("ℹ️ WeeklyProtocolActive.tsx já estava sem WeekdayKey import.");
}
