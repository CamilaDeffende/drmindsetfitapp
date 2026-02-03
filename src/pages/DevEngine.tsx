import { useMemo, useState } from "react";
import { planWeek as generatePlan, type PlannerInput } from "@/engine/planner/trainingPlanner.engine";

export default function DevEngine() {
  const LEVEL_OPTIONS: PlannerInput["level"][] = ["iniciante", "intermediario", "avancado"];
  const GOAL_OPTIONS: PlannerInput["goal"][] = ["emagrecimento", "condicionamento", "performance"];

  const [level, setLevel] = useState<PlannerInput["level"]>("iniciante");
  const [goal, setGoal] = useState<PlannerInput["goal"]>("condicionamento");
  const [availableDays, setAvailableDays] = useState<number>(5);

  const [modCycling, setModCycling] = useState(true);
  const [modRunning, setModRunning] = useState(true);
  const [modStrength, setModStrength] = useState(true);

  const { ok, json, error } = useMemo(() => {
    try {
      const modalities: PlannerInput["modalities"] = [
        ...(modCycling ? (["cycling"] as const) : []),
        ...(modRunning ? (["running"] as const) : []),
        ...(modStrength ? (["strength"] as const) : []),
      ];

      // guard mínimo: planner precisa de pelo menos 1 modalidade
      const safeModalities = modalities.length ? modalities : (["cycling"] as PlannerInput["modalities"]);

      const plan = generatePlan({
        level,
        goal,
        available_days: Math.max(1, Math.min(7, Number(availableDays) || 1)),
        modalities: safeModalities,
      });

      return { ok: true, json: JSON.stringify(plan, null, 2), error: "" };
    } catch (e: any) {
      return { ok: false, json: "", error: String(e?.message || e) };
    }
  }, [level, goal, availableDays, modCycling, modRunning, modStrength]);

  return (
    <div className="min-h-screen bg-[#070A12] text-white p-6">
      <div className="max-w-5xl mx-auto space-y-4">
        <h1 className="text-2xl font-bold">Dev · Training Engine</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <label className="text-sm space-y-1">
            <div className="text-gray-300">Nível</div>
            <select
              className="w-full h-11 rounded-xl bg-[#0B1020] border border-white/10 px-3"
              value={level}
              onChange={(e) => setLevel(e.target.value as PlannerInput["level"])}
            >
              {LEVEL_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm space-y-1">
            <div className="text-gray-300">Objetivo</div>
            <select
              className="w-full h-11 rounded-xl bg-[#0B1020] border border-white/10 px-3"
              value={goal}
              onChange={(e) => setGoal(e.target.value as PlannerInput["goal"])}
            >
              {GOAL_OPTIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm space-y-1">
            <div className="text-gray-300">Dias disponíveis (1–7)</div>
            <input
              className="w-full h-11 rounded-xl bg-[#0B1020] border border-white/10 px-3"
              type="number"
              min={1}
              max={7}
              value={availableDays}
              onChange={(e) => setAvailableDays(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0B1020] border border-white/10">
            <input type="checkbox" checked={modCycling} onChange={(e) => setModCycling(e.target.checked)} />
            Ciclismo
          </label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0B1020] border border-white/10">
            <input type="checkbox" checked={modRunning} onChange={(e) => setModRunning(e.target.checked)} />
            Corrida
          </label>
          <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#0B1020] border border-white/10">
            <input type="checkbox" checked={modStrength} onChange={(e) => setModStrength(e.target.checked)} />
            Musculação
          </label>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0B1020] p-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold">Resultado</div>
            <div className={ok ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>{ok ? "OK" : "ERRO"}</div>
          </div>

          {error ? <div className="mt-3 text-sm text-red-300">{error}</div> : null}

          <pre className="mt-3 text-xs overflow-auto whitespace-pre-wrap bg-black/30 border border-white/10 rounded-xl p-3">
            {json || "{}"}
          </pre>
        </div>

        <div className="text-xs text-gray-400">
          Dica: acesse <span className="text-gray-200">/dev/engine</span> e valide o JSON gerado.
        </div>
      </div>
    </div>
  );
}
