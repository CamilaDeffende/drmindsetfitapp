import React from "react";
import type { MuscleGroup } from "@/features/fitness-suite/data/strength/strengthTypes";
import { loadSelectedGroups, saveSelectedGroups } from "@/utils/strength/strengthWeekStorage";

const GROUPS: Array<{ key: MuscleGroup; label: string }> = [
  { key: "peito", label: "Peito" },
  { key: "costas", label: "Costas" },
  { key: "ombros", label: "Ombros" },
  { key: "biceps", label: "Bíceps" },
  { key: "triceps", label: "Tríceps" },
  { key: "quadriceps", label: "Quadríceps" },
  { key: "posterior", label: "Posterior" },
  { key: "gluteos", label: "Glúteos" },
  { key: "panturrilhas", label: "Panturrilhas" },
  { key: "core", label: "Core" },
];

export function StrengthMuscleGroupsPicker() {
  const [selected, setSelected] = React.useState<MuscleGroup[]>(() => loadSelectedGroups());

  function toggle(g: MuscleGroup) {
    setSelected((prev) => {
      const next = prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g];
      saveSelectedGroups(next);
      return next;
    });
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-base font-semibold">Grupamentos da semana (somente Musculação)</div>
      <div className="mt-1 text-sm opacity-80">
        Selecione tudo o que você quer treinar ao longo da semana. O motor vai distribuir entre os dias de musculação.
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {GROUPS.map(({ key, label }) => {
          const on = selected.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={[
                "px-3 py-2 rounded-full text-sm transition",
                on ? "bg-white/20 border border-white/30" : "bg-white/5 border border-white/10 hover:bg-white/10",
              ].join(" ")}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-xs opacity-70">
        Selecionados: {selected.length ? selected.join(", ") : "nenhum"}
      </div>
    </div>
  );
}
