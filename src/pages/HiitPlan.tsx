import { useEffect, useMemo, useState } from "react";

type ProtocolKey = "TABATA" | "EMOM" | "AMRAP" | "SPRINT";
type GoalKey = "FAT_LOSS" | "PERFORMANCE" | "CONDITIONING";

type Protocol = {
  key: ProtocolKey;
  name: string;
  summary: string;
  defaultTotalMinutes: number;
  defaults: {
    rounds?: number;
    workSec?: number;
    restSec?: number;
    intensityLabel: string;
  };
};

type ProgressionRow = {
  week: number;
  sessions: number;
  totalMin: number;
  rounds?: number;
  workSec?: number;
  restSec?: number;
  notes: string;
};

const PROTOCOLS: Protocol[] = [
  {
    key: "TABATA",
    name: "Tabata",
    summary: "20s forte / 10s leve, rounds progressivos.",
    defaultTotalMinutes: 8,
    defaults: { rounds: 8, workSec: 20, restSec: 10, intensityLabel: "RPE 9–10" },
  },
  {
    key: "EMOM",
    name: "EMOM",
    summary: "A cada minuto, executa um bloco. Progressão por tempo total.",
    defaultTotalMinutes: 12,
    defaults: { intensityLabel: "RPE 8–9" },
  },
  {
    key: "AMRAP",
    name: "AMRAP",
    summary: "Máximo de rounds em X minutos. Progressão por tempo total.",
    defaultTotalMinutes: 10,
    defaults: { intensityLabel: "RPE 8–9" },
  },
  {
    key: "SPRINT",
    name: "Sprint Intervals",
    summary: "Sprints curtos com descanso maior. Progressão por rounds.",
    defaultTotalMinutes: 10,
    defaults: { rounds: 6, workSec: 15, restSec: 75, intensityLabel: "RPE 9–10" },
  },
];

const GOALS: { key: GoalKey; name: string; note: string }[] = [
  { key: "FAT_LOSS", name: "Emagrecimento", note: "Maior consistência semanal e volume moderado." },
  { key: "PERFORMANCE", name: "Performance", note: "Alta intensidade com controle de volume." },
  { key: "CONDITIONING", name: "Condicionamento", note: "Progressão gradual e sustentável." },
];

const STORAGE_KEY = "drmindsetfit.hiit.v1";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeParse(raw: string | null) {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getPreset(goal: GoalKey) {
  if (goal === "FAT_LOSS") {
    return {
      goal,
      protocolKey: "EMOM" as ProtocolKey,
      weeks: 6,
      sessionsPerWeek: 4,
      totalMinutes: 14,
      rounds: 10,
      workSec: 20,
      restSec: 40,
    };
  }
  if (goal === "PERFORMANCE") {
    return {
      goal,
      protocolKey: "TABATA" as ProtocolKey,
      weeks: 4,
      sessionsPerWeek: 3,
      totalMinutes: 8,
      rounds: 10,
      workSec: 20,
      restSec: 10,
    };
  }
  return {
    goal,
    protocolKey: "AMRAP" as ProtocolKey,
    weeks: 6,
    sessionsPerWeek: 3,
    totalMinutes: 12,
    rounds: 8,
    workSec: 15,
    restSec: 75,
  };
}

function buildProgression(params: {
  protocol: Protocol;
  weeks: number;
  sessionsPerWeek: number;
  totalMinutes: number;
  workSec: number;
  restSec: number;
  rounds: number;
}): ProgressionRow[] {
  const { protocol, weeks, sessionsPerWeek } = params;
  const rows: ProgressionRow[] = [];

  for (let w = 1; w <= weeks; w++) {
    const volFactor =
      protocol.key === "TABATA"
        ? 1 + (w - 1) * 0.1
        : protocol.key === "SPRINT"
          ? 1 + (w - 1) * 0.08
          : 1 + (w - 1) * 0.07;

    const deload = weeks >= 4 && w === Math.ceil(weeks / 2) ? 0.9 : 1.0;
    const factor = volFactor * deload;

    let totalMin = params.totalMinutes;
    let rounds = params.rounds;
    const workSec = params.workSec;
    const restSec = params.restSec;

    if (protocol.key === "EMOM" || protocol.key === "AMRAP") {
      totalMin = clamp(Math.round(params.totalMinutes * factor), 6, 30);
    } else if (protocol.key === "TABATA") {
      rounds = clamp(Math.round(params.rounds * factor), 6, 16);
      totalMin = Math.round(((workSec + restSec) * rounds) / 60);
    } else if (protocol.key === "SPRINT") {
      rounds = clamp(Math.round(params.rounds * factor), 4, 14);
      totalMin = Math.round(((workSec + restSec) * rounds) / 60);
    }

    const notes =
      deload < 1
        ? "Semana de controle (deload): foco em técnica e qualidade."
        : w === weeks
          ? "Semana final: caprichar no aquecimento e execução máxima."
          : "Progressão linear: aumento gradual de volume.";

    rows.push({
      week: w,
      sessions: sessionsPerWeek,
      totalMin,
      rounds: protocol.key === "EMOM" || protocol.key === "AMRAP" ? undefined : rounds,
      workSec: protocol.key === "EMOM" || protocol.key === "AMRAP" ? undefined : workSec,
      restSec: protocol.key === "EMOM" || protocol.key === "AMRAP" ? undefined : restSec,
      notes,
    });
  }

  return rows;
}

export default function HiitPlan() {
  const [goal, setGoal] = useState<GoalKey>("FAT_LOSS");
  const [protocolKey, setProtocolKey] = useState<ProtocolKey>("TABATA");

  const protocol = useMemo(
    () => PROTOCOLS.find((p) => p.key === protocolKey) ?? PROTOCOLS[0],
    [protocolKey]
  );

  const [weeks, setWeeks] = useState<number>(4);
  const [sessionsPerWeek, setSessionsPerWeek] = useState<number>(3);
  const [totalMinutes, setTotalMinutes] = useState<number>(protocol.defaultTotalMinutes);

  const [rounds, setRounds] = useState<number>(protocol.defaults.rounds ?? 8);
  const [workSec, setWorkSec] = useState<number>(protocol.defaults.workSec ?? 20);
  const [restSec, setRestSec] = useState<number>(protocol.defaults.restSec ?? 10);

  // HYDRATE
  useEffect(() => {
    const data = safeParse(localStorage.getItem(STORAGE_KEY));
    if (!data || typeof data !== "object") return;

    if (data.goal) setGoal(data.goal);
    if (data.protocolKey) setProtocolKey(data.protocolKey);

    if (typeof data.weeks === "number") setWeeks(data.weeks);
    if (typeof data.sessionsPerWeek === "number") setSessionsPerWeek(data.sessionsPerWeek);
    if (typeof data.totalMinutes === "number") setTotalMinutes(data.totalMinutes);

    if (typeof data.rounds === "number") setRounds(data.rounds);
    if (typeof data.workSec === "number") setWorkSec(data.workSec);
    if (typeof data.restSec === "number") setRestSec(data.restSec);
  }, []);

  // PERSIST
  useEffect(() => {
    const payload = {
      goal,
      protocolKey,
      weeks,
      sessionsPerWeek,
      totalMinutes,
      rounds,
      workSec,
      restSec,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [goal, protocolKey, weeks, sessionsPerWeek, totalMinutes, rounds, workSec, restSec]);

  function applyGoal(g: GoalKey) {
    const p = getPreset(g);
    setGoal(p.goal);
    setProtocolKey(p.protocolKey);
    setWeeks(p.weeks);
    setSessionsPerWeek(p.sessionsPerWeek);
    setTotalMinutes(p.totalMinutes);
    setRounds(p.rounds);
    setWorkSec(p.workSec);
    setRestSec(p.restSec);
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    const p = getPreset("FAT_LOSS");
    setGoal(p.goal);
    setProtocolKey(p.protocolKey);
    setWeeks(p.weeks);
    setSessionsPerWeek(p.sessionsPerWeek);
    setTotalMinutes(p.totalMinutes);
    setRounds(p.rounds);
    setWorkSec(p.workSec);
    setRestSec(p.restSec);
  }

  function applyProtocolDefaults(next: ProtocolKey) {
    const p = PROTOCOLS.find((x) => x.key === next) ?? PROTOCOLS[0];
    setProtocolKey(next);
    setTotalMinutes(p.defaultTotalMinutes);
    setRounds(p.defaults.rounds ?? 8);
    setWorkSec(p.defaults.workSec ?? 20);
    setRestSec(p.defaults.restSec ?? 10);
  }

  const table = useMemo(() => {
    const w = clamp(weeks, 1, 12);
    const s = clamp(sessionsPerWeek, 1, 7);

    const tm = clamp(totalMinutes, 6, 30);
    const r = clamp(rounds, 4, 20);
    const ws = clamp(workSec, 10, 60);
    const rs = clamp(restSec, 5, 180);

    return buildProgression({
      protocol,
      weeks: w,
      sessionsPerWeek: s,
      totalMinutes: tm,
      rounds: r,
      workSec: ws,
      restSec: rs,
    });
  }, [protocol, weeks, sessionsPerWeek, totalMinutes, rounds, workSec, restSec]);

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-red-500">HIIT — Avançado</h1>
          <p className="text-gray-300">
            Protocolos (Tabata / EMOM / AMRAP / Sprint) com progressão semanal + presets por objetivo + persistência.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-red-500/20 bg-neutral-900 p-5 space-y-5">
            <div className="space-y-1">
              <div className="text-xs text-gray-400">Objetivo</div>
              <select
                value={goal}
                onChange={(e) => applyGoal(e.target.value as GoalKey)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none"
              >
                {GOALS.map((g) => (
                  <option key={g.key} value={g.key}>
                    {g.name}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-400 mt-2">{GOALS.find((g) => g.key === goal)?.note}</div>

              <div className="flex gap-2 mt-3">
                <button
                  type="button"
                  onClick={() => applyGoal(goal)}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs hover:bg-black/60"
                >
                  Aplicar preset
                </button>
                <button
                  type="button"
                  onClick={resetAll}
                  className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs hover:bg-black/60"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-400">Protocolo</div>
              <select
                value={protocolKey}
                onChange={(e) => applyProtocolDefaults(e.target.value as ProtocolKey)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none"
              >
                {PROTOCOLS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name}
                  </option>
                ))}
              </select>

              <div className="text-sm text-gray-300 mt-2">{protocol.summary}</div>
              <div className="text-xs text-gray-400 mt-1">Intensidade alvo: {protocol.defaults.intensityLabel}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-400">Semanas</div>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={weeks}
                  onChange={(e) => setWeeks(Number(e.target.value || 1))}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none"
                />
              </div>
              <div>
                <div className="text-xs text-gray-400">Sessões/sem</div>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={sessionsPerWeek}
                  onChange={(e) => setSessionsPerWeek(Number(e.target.value || 1))}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs text-gray-400">Duração total (min)</div>
              <input
                type="number"
                min={6}
                max={30}
                value={totalMinutes}
                onChange={(e) => setTotalMinutes(Number(e.target.value || 6))}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none"
              />
              <div className="text-xs text-gray-500">
                (EMOM/AMRAP usam principalmente tempo total. Tabata/Sprint derivam tempo pelos rounds.)
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-3 space-y-2">
              <div className="text-sm font-semibold">Parâmetros (quando aplicável)</div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs text-gray-400">Rounds</div>
                  <input
                    type="number"
                    min={4}
                    max={20}
                    value={rounds}
                    onChange={(e) => setRounds(Number(e.target.value || 4))}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none"
                    disabled={protocol.key === "EMOM" || protocol.key === "AMRAP"}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Work (s)</div>
                  <input
                    type="number"
                    min={10}
                    max={60}
                    value={workSec}
                    onChange={(e) => setWorkSec(Number(e.target.value || 10))}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none"
                    disabled={protocol.key === "EMOM" || protocol.key === "AMRAP"}
                  />
                </div>
                <div>
                  <div className="text-xs text-gray-400">Rest (s)</div>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={restSec}
                    onChange={(e) => setRestSec(Number(e.target.value || 5))}
                    className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none"
                    disabled={protocol.key === "EMOM" || protocol.key === "AMRAP"}
                  />
                </div>
              </div>

              <div className="text-xs text-gray-400">
                Aquecimento recomendado: 6–10min + mobilidade + 2–3 acelerações progressivas.
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-red-500/20 bg-neutral-900 p-5 space-y-4">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="text-xl font-semibold">Progressão Semanal</div>
                <div className="text-sm text-gray-300">
                  Protocolo: <span className="text-white font-semibold">{protocol.name}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                Ajuste “deload” no meio do bloco quando semanas ≥ 4.
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead className="bg-black/40">
                  <tr className="text-left">
                    <th className="px-3 py-2">Semana</th>
                    <th className="px-3 py-2">Sessões</th>
                    <th className="px-3 py-2">Total (min)</th>
                    <th className="px-3 py-2">Rounds</th>
                    <th className="px-3 py-2">Work/Rest</th>
                    <th className="px-3 py-2">Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {table.map((r) => (
                    <tr key={r.week} className="border-t border-white/10">
                      <td className="px-3 py-2 font-semibold">{r.week}</td>
                      <td className="px-3 py-2">{r.sessions}</td>
                      <td className="px-3 py-2">{r.totalMin}</td>
                      <td className="px-3 py-2">{typeof r.rounds === "number" ? r.rounds : "—"}</td>
                      <td className="px-3 py-2">
                        {typeof r.workSec === "number" && typeof r.restSec === "number"
                          ? `${r.workSec}s / ${r.restSec}s`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-300">{r.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-gray-400">
              Persistência ativa (localStorage). Próxima sprint: presets por modalidade (bike/corrida/corda/remo) +
              export do plano.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
