import fs from "node:fs";

function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }

function backup(file, tag){
  ensureDir(".backups");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const bk = `.backups/${file.replaceAll("/", "__")}.before_${tag}.${stamp}.bak`;
  fs.copyFileSync(file, bk);
  console.log("==> Backup:", bk);
}

function patchFile(file, tag, fn){
  if (!fs.existsSync(file)) {
    console.error("MISSING:", file);
    process.exit(1);
  }
  backup(file, tag);
  const before = fs.readFileSync(file, "utf8");
  const after = fn(before);
  if (after !== before) {
    fs.writeFileSync(file, after, "utf8");
    console.log("✅ Patched:", file);
  } else {
    console.log("ℹ️ No changes:", file);
  }
}

// (A) Step5Treino — após saveWeekPlan(plan), espelha no state (updateState)
patchFile("src/components/steps/Step5Treino.tsx", "block3_step5", (s) => {
  // Injeta updateState apenas se ainda não existir strengthWeekPlan no arquivo
  if (s.includes("strengthWeekPlan")) return s;

  // Troca: saveWeekPlan(plan);  -> saveWeekPlan(plan); try { updateState({ strengthWeekPlan: plan } as any); } catch {}
  return s.replace(
    /saveWeekPlan\(\s*plan\s*\);\s*/g,
    (m) => `${m}\n      try { updateState({ strengthWeekPlan: plan } as any); } catch {}\n`
  );
});

// (B) WeeklyProtocolActive — ler plan via getStrengthWeekPlanFromState(state)
patchFile("src/components/treino/WeeklyProtocolActive.tsx", "block3_wpa", (s) => {
  if (!s.includes("getStrengthWeekPlanFromState")) {
    if (/^\\s*import\\s/m.test(s)) {
      s = s.replace(
        /^\\s*import\\s/m,
        `import { getStrengthWeekPlanFromState } from "@/utils/strength/strengthWeekPlanSource";\nimport `
      );
    } else {
      s = `import { getStrengthWeekPlanFromState } from "@/utils/strength/strengthWeekPlanSource";\n` + s;
    }
  }

  // const plan = loadWeekPlan(); -> const plan = getStrengthWeekPlanFromState(state);
  s = s.replace(/const\\s+plan\\s*=\\s*loadWeekPlan\\(\\)\\s*;?/g, "const plan = getStrengthWeekPlanFromState(state);");

  // loadWeekPlan() -> getStrengthWeekPlanFromState(state)
  s = s.replace(/loadWeekPlan\\(\\)/g, "getStrengthWeekPlanFromState(state)");

  return s;
});

// (C) workoutGenerator — weekPlan = getStrengthWeekPlanFromState(state)
patchFile("src/features/fitness-suite/engine/workoutGenerator.ts", "block3_workoutgen", (s) => {
  if (!s.includes("getStrengthWeekPlanFromState")) {
    if (/^\\s*import\\s/m.test(s)) {
      s = s.replace(
        /^\\s*import\\s/m,
        `import { getStrengthWeekPlanFromState } from "@/utils/strength/strengthWeekPlanSource";\nimport `
      );
    } else {
      s = `import { getStrengthWeekPlanFromState } from "@/utils/strength/strengthWeekPlanSource";\n` + s;
    }
  }

  // try { weekPlan = loadWeekPlan(); } catch {} -> try { weekPlan = getStrengthWeekPlanFromState(state); } catch {}
  s = s.replace(
    /try\\s*\\{\\s*weekPlan\\s*=\\s*loadWeekPlan\\(\\)\\s*;\\s*\\}\\s*catch\\s*\\{\\s*\\}/g,
    "try { weekPlan = getStrengthWeekPlanFromState(state); } catch {}"
  );

  // loadWeekPlan() -> getStrengthWeekPlanFromState(state)
  s = s.replace(/loadWeekPlan\\(\\)/g, "getStrengthWeekPlanFromState(state)");

  return s;
});

console.log("✅ BLOCO 3 aplicado (state > localStorage).");
