export type Modality = "musculacao" | "corrida" | "bike" | "funcional" | "crossfit";

export type WorkoutInput = {
  modalities: Modality[];
  level: "iniciante" | "intermediario" | "avancado";
  daysByModality: Record<Modality, string[]>;
};

export type WorkoutDay = { day: string; modality: Modality; title: string; focus: string; };
export type WorkoutOutput = { week: WorkoutDay[] };

const DAY_ORDER: Record<string, number> = { seg:1, ter:2, qua:3, qui:4, sex:5, sab:6, dom:7 };

export function buildWorkoutWeek(input: WorkoutInput): WorkoutOutput {
  const week: WorkoutDay[] = [];

  for (const m of input.modalities) {
    const days = input.daysByModality[m] || [];
    for (const d of days) {
      let title = "Sessão";
      let focus = "Base";

      if (m === "musculacao") {
        title = input.level === "iniciante" ? "Full body" : (input.level === "intermediario" ? "Upper/Lower" : "PPL");
        focus = input.level === "avancado" ? "Progressão + técnicas (contextual)" : "Progressão semanal";
      }
      if (m === "corrida") {
        title = input.level === "iniciante" ? "Rodagem leve" : (input.level === "intermediario" ? "Ritmo/Tempo" : "Intervalado");
        focus = "RPE + pace alvo (determinístico)";
      }
      if (m === "bike") {
        title = input.level === "iniciante" ? "Zona 2" : (input.level === "intermediario" ? "Sweet Spot" : "HIIT Bike");
        focus = "Cadência + zona";
      }
      if (m === "funcional") {
        title = "Full body funcional";
        focus = "Padrões de movimento";
      }
      if (m === "crossfit") {
        title = "WOD";
        focus = input.level === "avancado" ? "Força + Metcon" : "Skill + Metcon";
      }

      week.push({ day: d, modality: m, title, focus });
    }
  }

  week.sort((a,b) => (DAY_ORDER[a.day] || 99) - (DAY_ORDER[b.day] || 99));
  return { week };
}
