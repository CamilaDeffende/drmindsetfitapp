import fs from "node:fs";

const file = "src/components/steps/Step5Treino.tsx";
if (!fs.existsSync(file)) {
  console.error("MISSING:", file);
  process.exit(1);
}

const backupDir = ".backups";
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = `${backupDir}/Step5Treino.tsx.before_muscle_groups.${stamp}.bak`;
fs.copyFileSync(file, backup);
console.log("==> Backup:", backup);

let s = fs.readFileSync(file, "utf8");
const before = s;

// evita duplicar
if (s.includes("SELECIONE OS GRUPAMENTOS MUSCULARES")) {
  console.log("ℹ️ Bloco já existe. Nenhuma alteração.");
  process.exit(0);
}

const uiBlock = `
{/* === SELEÇÃO DE GRUPAMENTOS MUSCULARES (APENAS MUSCULAÇÃO) === */}
{modalidadeSelecionada === "musculacao" && (
  <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
    <h3 className="text-sm font-semibold mb-3">
      Selecione os grupamentos musculares
    </h3>

    <div className="flex flex-wrap gap-2">
      {[
        "Peitoral",
        "Costas",
        "Ombros",
        "Bíceps",
        "Tríceps",
        "Quadríceps",
        "Posterior",
        "Glúteos",
        "Panturrilhas",
        "Core"
      ].map((grupo) => (
        <button
          key={grupo}
          type="button"
          onClick={() => toggleGrupoMuscular(grupo)}
          className={
            gruposMuscularesSelecionados.includes(grupo)
              ? "px-3 py-1 rounded-full bg-emerald-500 text-black text-xs font-medium"
              : "px-3 py-1 rounded-full border border-white/20 text-xs text-white/80"
          }
        >
          {grupo}
        </button>
      ))}
    </div>

    <p className="text-xs text-white/60 mt-3">
      Esses grupamentos serão usados para montar a divisão semanal da musculação.
    </p>
  </div>
)}
`;

const lines = s.split("\n");

// tenta inserir após seleção de modalidade
let insertAt = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("modalidadeSelecionada")) {
    insertAt = i + 2;
    break;
  }
}

if (insertAt === -1) {
  console.warn("⚠️ Não encontrei ponto seguro. Bloco não inserido.");
  process.exit(0);
}

lines.splice(insertAt, 0, uiBlock);
s = lines.join("\n");

if (s !== before) {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Bloco de grupamentos musculares inserido.");
} else {
  console.log("ℹ️ Nenhuma alteração detectada.");
}
