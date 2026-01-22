const fs = require("fs");

const file = "src/features/fitness-suite/engine/workoutGenerator.ts";
let s = fs.readFileSync(file, "utf8");

// Troca a função prescription inteira por uma versão mais completa e TS-safe
const re = /function\s+prescription\([\s\S]*?\n\}\n\nfunction\s+buildExercises/m;

if (!re.test(s)) {
  console.error("PATCH_FAIL: não encontrei o bloco 'function prescription(...) { ... }' antes de buildExercises.");
  process.exit(1);
}

const replacement = `
function prescription(mod: ModalidadeTreino, nivel: string, intensidade: IntensidadeTreino, goal: string, h: number) {
  // Prescrição por modalidade + objetivo + nível + intensidade
  // Mantém output compatível com Step5/PlanosAtivos:
  // { series?: number, reps?: string, descansoSeg?: number, notes?: string }
  const lvl = (String(nivel || "iniciante").toLowerCase().includes("avan"))
    ? "avancado"
    : (String(nivel || "iniciante").toLowerCase().includes("inter"))
      ? "intermediario"
      : "iniciante";

  const inten = (intensidade === ("alta" as any)) ? "alta" : (intensidade === ("baixa" as any)) ? "baixa" : "moderada";
  const g = String(goal || "emagrecimento");

  // micro-variação controlada (seed)
  const delta = (h % 3) - 1; // -1,0,1

  // Helpers
  const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
  const rpe = (x: string) => x;

  // ====== AERÓBIOS (corrida / bike) ======
  if (mod === ("corrida" as any)) {
    const base = lvl === "iniciante" ? 1 : lvl === "intermediario" ? 2 : 3; // “complexidade”
    if (inten === "alta") {
      // intervalos
      const reps = base === 1 ? "8x (1min forte / 1min leve)" : base === 2 ? "10x (1min forte / 1min leve)" : "12x (1min forte / 1min leve)";
      return { reps, descansoSeg: 0, notes: `RPE 8–9. Aquecer 10min + desaquecimento 8–10min. ${g === "longevidade" ? "Evitar dor/articulação: reduzir intensidade se necessário." : ""}` };
    }
    if (inten === "moderada") {
      const reps = base === 1 ? "2x 6min forte (limiar) / 3min leve" : base === 2 ? "3x 8min forte / 4min leve" : "4x 8min forte / 3min leve";
      return { reps, descansoSeg: 0, notes: `RPE 7–8. Foco em consistência e técnica. ${g === "emagrecimento" ? "Manter densidade sem perder forma." : ""}` };
    }
    // baixa
    const reps = base === 1 ? "Z2 25–40min" : base === 2 ? "Z2 35–55min" : "Z2 45–70min";
    return { reps, descansoSeg: 0, notes: "Z2 (conversa possível). Progredir tempo semanalmente de forma leve." };
  }

  if (mod === ("bike_indoor" as any)) {
    const base = lvl === "iniciante" ? 1 : lvl === "intermediario" ? 2 : 3;
    if (inten === "alta") {
      const reps = base === 1 ? "8x 30s forte / 60s leve" : base === 2 ? "10x 30s forte / 60s leve" : "12x 30s forte / 60s leve";
      return { reps, descansoSeg: 0, notes: "RPE 8–9. Cadência controlada. Recuperar bem entre sprints." };
    }
    if (inten === "moderada") {
      const reps = base === 1 ? "2x 8min limiar / 4min leve" : base === 2 ? "3x 8min limiar / 4min leve" : "3x 10min limiar / 4min leve";
      return { reps, descansoSeg: 0, notes: "RPE 7–8. Técnica, respiração e pacing." };
    }
    const reps = base === 1 ? "Z2 30–45min" : base === 2 ? "Z2 40–60min" : "Z2 50–75min";
    return { reps, descansoSeg: 0, notes: "Z2 contínuo. Cadência 80–95rpm. Constância > heroísmo." };
  }

  // ====== CROSSFIT ======
  if (mod === ("crossfit" as any)) {
    const baseCap = lvl === "iniciante" ? 10 : lvl === "intermediario" ? 14 : 18; // minutos
    if (inten === "alta") {
      return { reps: `AMRAP ${baseCap}–${baseCap + 4}min`, descansoSeg: 0, notes: "RPE 8–9. Evitar falha técnica. Escalar cargas e movimentos." };
    }
    if (inten === "moderada") {
      return { reps: `EMOM ${baseCap}–${baseCap + 2}min`, descansoSeg: 0, notes: "RPE 7–8. Consistência por minuto. Técnica perfeita." };
    }
    return { reps: "Técnica + força 20–30min", descansoSeg: 0, notes: "RPE 6–7. Mobilidade, controle e regressões." };
  }

  // ====== FUNCIONAL ======
  if (mod === ("funcional" as any)) {
    const rounds = lvl === "iniciante" ? 3 : lvl === "intermediario" ? 4 : 5;
    if (inten === "alta") {
      return { series: clamp(rounds + delta, 3, 6), reps: "Trabalho 40s / Pausa 20s", descansoSeg: 0, notes: "RPE 8. Densidade alta. Priorizar técnica." };
    }
    if (inten === "moderada") {
      return { series: clamp(rounds + delta, 3, 6), reps: "Trabalho 35s / Pausa 25s", descansoSeg: 0, notes: "RPE 7. Manter fluxo contínuo." };
    }
    return { series: clamp(rounds + delta, 2, 5), reps: "Trabalho 30s / Pausa 30s", descansoSeg: 0, notes: "RPE 6–7. Base, coordenação e controle." };
  }

  // ====== MUSCULAÇÃO ======
  const baseSeries = lvl === "iniciante" ? 3 : lvl === "intermediario" ? 4 : 5;
  const series = clamp(baseSeries + delta, 2, 6);

  // Objetivo -> parâmetros (reps/descanso)
  // Emagrecimento/estética: densidade moderada, reps mais altas, descanso menor
  // Hipertrofia: reps 6–12, descanso moderado, volume suficiente
  // Performance: reps 3–8, descanso maior, foco em qualidade/força
  // Longevidade: reps 10–15, descanso moderado/baixo, técnica/controle
  let reps = "8–12";
  let descansoSeg = 75;
  let notes = "";

  if (g.includes("hiper")) {
    reps = inten === "alta" ? "6–10" : inten === "baixa" ? "10–15" : "8–12";
    descansoSeg = inten === "alta" ? 120 : inten === "baixa" ? 60 : 90;
    notes = `${rpe(inten === "alta" ? "RPE 8" : inten === "baixa" ? "RPE 6–7" : "RPE 7–8")} • Progredir carga/rep semanalmente.`;
  } else if (g.includes("perf")) {
    reps = inten === "alta" ? "3–6" : inten === "baixa" ? "8–10" : "5–8";
    descansoSeg = inten === "alta" ? 150 : inten === "baixa" ? 90 : 120;
    notes = `${rpe(inten === "alta" ? "RPE 8–9" : inten === "baixa" ? "RPE 6–7" : "RPE 7–8")} • Priorizar velocidade/qualidade.`;
  } else if (g.includes("long")) {
    reps = inten === "alta" ? "8–12 (controlado)" : "10–15";
    descansoSeg = inten === "alta" ? 90 : 60;
    notes = "RPE 6–7 • Técnica perfeita, amplitude segura, foco em consistência e articulações.";
  } else {
    // emagrecimento/estética
    reps = inten === "alta" ? "8–12" : inten === "baixa" ? "12–15" : "10–12";
    descansoSeg = inten === "alta" ? 90 : inten === "baixa" ? 45 : 60;
    notes = "RPE 7–8 • Densidade e execução. Evitar falha técnica para manter volume total.";
  }

  return { series, reps, descansoSeg, notes };
}

function buildExercises
`.trim() + "\n\n";

s = s.replace(re, replacement);

fs.writeFileSync(file, s, "utf8");
console.log("PATCH_OK: prescription() atualizado (modalidade+nivel+intensidade+objetivo) com output compatível.");
