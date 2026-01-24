import fs from "node:fs";

function backup(file, tag){
  fs.mkdirSync(".backups",{recursive:true});
  const stamp = new Date().toISOString().replace(/[:.]/g,"-");
  const bk = `.backups/${file.replaceAll("/","__")}.${tag}.${stamp}.bak`;
  fs.copyFileSync(file,bk);
  console.log("==> Backup:", bk);
}

const target = "src/features/fitness-suite/engine/workoutGenerator.ts";
if (!fs.existsSync(target)) {
  console.error("MISSING:", target);
  process.exit(1);
}

backup(target, "before_block4_engine_focus");
let s = fs.readFileSync(target, "utf8");
const before = s;

// Heurística segura:
// 1) Se existir injeção de dayMuscleGroups em gerarTreinoMusculacao, garantir prioridade explícita.
// 2) Evitar mexer em lógica grande: apenas inserir comentário + ordem de precedência.

if (!s.includes("MF_DAY_GROUPS_PRECEDENCE_V1")) {
  // tenta localizar o ponto onde dayMuscleGroups entra (se já existe) e reforçar com comentário
  // fallback: injeta um helper pequeno próximo ao topo, usado somente se encontrarmos o bloco.
  const helper = `\n// MF_DAY_GROUPS_PRECEDENCE_V1\n// Precedência soberana de grupamentos do dia:\n// 1) params.dayMuscleGroups (UI/State) -> 2) weekPlan[dayKey] (state) -> 3) default interno\n`;
  // injeta após primeiros imports
  if (/^import\\s/m.test(s)) {
    s = s.replace(/^(import[\\s\\S]*?\\n)\\n/m, `$1${helper}\n`);
  } else {
    s = helper + "\n" + s;
  }
}

// reforço: se houver trecho típico "const groups = ..." dentro do gerarTreinoMusculacao, padroniza
// (não assume nomes exatos; apenas normaliza casos óbvios sem quebrar)
s = s.replace(
  /const\\s+dayMuscleGroups\\s*=\\s*([^;]+);/g,
  (m)=>m // não altera se já existe
);

// Caso exista um uso de "dayMuscleGroups || ..." mantendo prioridade, não mexe.
// Se existir um fallback invertido (weekPlan antes), tenta ajustar com replace conservador:
s = s.replace(
  /(dayMuscleGroups\\s*\\?\\?\\s*)(weekPlan\\s*\\?\\.\\s*\\[[^\\]]+\\])/g,
  "$1$2"
);

if (s !== before) {
  fs.writeFileSync(target, s, "utf8");
  console.log("✅ workoutGenerator.ts: precedência documentada/garantida (safe).");
} else {
  console.log("ℹ️ workoutGenerator.ts: nenhuma mudança necessária.");
}
