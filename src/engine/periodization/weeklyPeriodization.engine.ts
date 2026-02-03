export type WeeklyInput = {
  level: "iniciante" | "intermediario" | "avancado";
  goal: "emagrecimento" | "performance" | "condicionamento";
  available_days: number; // 1..7
};

export type WeekPlan = {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
};

export function buildWeeklyPlan(input: WeeklyInput): WeekPlan {
  const d = Math.max(1, Math.min(7, input.available_days));
  const out: WeekPlan = {};

  // regras duras:
  // - no máximo 2 dias com estímulo >= PSE7 (representado por "intervalado/hiit/torque")
  // - nunca em dias consecutivos
  // - pelo menos 1 sessão oxidativa ("endurance") quando d >= 3

  const slots: string[] = [];

  if (d <= 2) {
    slots.push("cycling_endurance_base", "strength_full_body");
  } else if (d === 3) {
    slots.push("cycling_endurance_base", "strength_full_body", "running_tecnica_leve");
  } else if (d === 4) {
    slots.push("cycling_endurance_base", "strength_full_body", "cycling_intervalado_moderado", "running_leve");
  } else if (d === 5) {
    slots.push("cycling_endurance_base", "strength_full_body", "running_intervalado_moderado", "cycling_regenerativo", "running_progressivo");
  } else if (d === 6) {
    slots.push("cycling_endurance_base", "strength_full_body", "running_intervalado_moderado", "cycling_regenerativo", "running_progressivo", "strength_complementar");
  } else {
    slots.push("cycling_endurance_base", "strength_full_body", "running_intervalado_moderado", "cycling_regenerativo", "running_progressivo", "strength_complementar", "active_recovery");
  }

  const days: (keyof WeekPlan)[] = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];
  for (let i = 0; i < slots.length; i++) out[days[i]] = slots[i];

  return out;
}
