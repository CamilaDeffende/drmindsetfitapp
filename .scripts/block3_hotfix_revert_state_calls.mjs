import fs from "node:fs";

const files = [
  "src/components/treino/WeeklyProtocolActive.tsx",
  "src/features/fitness-suite/engine/workoutGenerator.ts",
];

function stamp(){ return new Date().toISOString().replace(/[:.]/g,"-"); }
function backup(file, tag){
  fs.mkdirSync(".backups", { recursive: true });
  const bk = `.backups/${file.replaceAll("/", "__")}.before_${tag}.${stamp()}.bak`;
  fs.copyFileSync(file, bk);
  console.log("==> Backup:", bk);
}

function stripStateImport(s){
  // remove import getStrengthWeekPlanFromState (se existir)
  const re = new RegExp(
    '^\\s*import\\s+\\{\\s*getStrengthWeekPlanFromState\\s*\\}\\s+from\\s+["\']@/utils/strength/strengthWeekPlanSource["\'];\\s*\\n',
    "m"
  );
  return s.replace(re, "");
}

for (const file of files){
  if (!fs.existsSync(file)) { console.log("ℹ️ missing:", file); continue; }
  backup(file, "block3_hotfix");

  let s = fs.readFileSync(file, "utf8");
  const before = s;

  // 1) Reverte chamadas onde foi injetado state inexistente
  s = s.replace(/getStrengthWeekPlanFromState\s*\(\s*state\s*\)/g, "loadWeekPlan()");
  s = s.replace(/try\s*\{\s*weekPlan\s*=\s*getStrengthWeekPlanFromState\s*\(\s*state\s*\)\s*;\s*\}\s*catch\s*\{\s*\}/g, "try { weekPlan = loadWeekPlan(); } catch {}");

  // 2) Remove import do state-source se não houver uso real
  s = stripStateImport(s);

  // 3) Garante que loadWeekPlan esteja importado (se não estiver)
  if (!s.includes('from "@/utils/strength/strengthWeekStorage"') || !s.includes("loadWeekPlan")) {
    // se já tem import do arquivo, injeta loadWeekPlan nele
    if (s.includes('from "@/utils/strength/strengthWeekStorage"')) {
      s = s.replace(
        /import\s+\{\s*([^}]+)\s*\}\s+from\s+"@\/utils\/strength\/strengthWeekStorage";/m,
        (m, inner) => {
          const parts = inner.split(",").map(x=>x.trim()).filter(Boolean);
          if (!parts.includes("loadWeekPlan")) parts.unshift("loadWeekPlan");
          return `import { ${parts.join(", ")} } from "@/utils/strength/strengthWeekStorage";`;
        }
      );
    } else {
      // injeta no topo
      s = `import { loadWeekPlan } from "@/utils/strength/strengthWeekStorage";\n` + s;
    }
  }

  if (s !== before) {
    fs.writeFileSync(file, s, "utf8");
    console.log("✅ Patched:", file);
  } else {
    console.log("ℹ️ No changes:", file);
  }
}

console.log("✅ HOTFIX aplicado (remove state inexistente + usa loadWeekPlan).");
