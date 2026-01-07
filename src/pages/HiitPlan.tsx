import { useEffect, useMemo, useState } from "react";

type ProtocolKey = "TABATA" | "EMOM" | "AMRAP" | "SPRINT";
type GoalKey = "FAT_LOSS" | "PERFORMANCE" | "CONDITIONING";
type ModalityKey = "RUN" | "BIKE" | "ROPE" | "ROW";

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

const MODALITIES: { key: ModalityKey; name: string; note: string }[] = [
  { key: "RUN", name: "Corrida", note: "Impacto maior: ajuste de recuperação e técnica." },
  { key: "BIKE", name: "Bike", note: "Menor impacto: tolera um pouco mais de volume." },
  { key: "ROPE", name: "Corda", note: "Coordenação/panturrilha: volume moderado." },
  { key: "ROW", name: "Remo", note: "Full-body: atenção na postura e fadiga do tronco." },
];

const STORAGE_KEY = "drmindsetfit.hiit.v2";

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

function applyModalityTuning(modality: ModalityKey, current: {
  weeks: number;
  sessionsPerWeek: number;
  totalMinutes: number;
  rounds: number;
  workSec: number;
  restSec: number;
}) {
  const out = { ...current };

  if (modality === "RUN") {
    out.restSec = clamp(out.restSec + 10, 5, 180);
    out.sessionsPerWeek = clamp(out.sessionsPerWeek, 1, 5);
  } else if (modality === "BIKE") {
    out.totalMinutes = clamp(out.totalMinutes + 2, 6, 30);
  } else if (modality === "ROPE") {
    out.restSec = clamp(out.restSec + 5, 5, 180);
    out.totalMinutes = clamp(out.totalMinutes, 6, 20);
  } else if (modality === "ROW") {
    out.workSec = clamp(out.workSec, 10, 40);
    out.restSec = clamp(out.restSec + 5, 5, 180);
  }

  return out;
}

function buildProgression(params: {
  protocol: Protocol;
  weeks: number;
  sessionsPerWeek: number;
  totalMinutes: number;
  workSec: number;
  restSec: number;
  rounds: number;
  modality: ModalityKey;
}): ProgressionRow[] {
  const { protocol, weeks, sessionsPerWeek, totalMinutes, workSec, restSec, rounds, modality } = params;

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

    let weekTotalMin = totalMinutes;
    let weekRounds = rounds;

    if (protocol.key === "EMOM" || protocol.key === "AMRAP") {
      weekTotalMin = clamp(Math.round(totalMinutes * factor), 6, 30);
    } else if (protocol.key === "TABATA") {
      weekRounds = clamp(Math.round(rounds * factor), 6, 16);
      weekTotalMin = Math.round(((workSec + restSec) * weekRounds) / 60);
    } else if (protocol.key === "SPRINT") {
      weekRounds = clamp(Math.round(rounds * factor), 4, 14);
      weekTotalMin = Math.round(((workSec + restSec) * weekRounds) / 60);
    }

    const modalityNote =
      modality === "RUN"
        ? "Corrida: foco em técnica e recuperação."
        : modality === "BIKE"
          ? "Bike: tolera um pouco mais de volume."
          : modality === "ROPE"
            ? "Corda: atenção em panturrilha/coordenação."
            : "Remo: postura e fadiga do tronco.";

    const notes =
      deload < 1
        ? `Semana de controle (deload). ${modalityNote}`
        : w === weeks
          ? `Semana final: qualidade máxima. ${modalityNote}`
          : `Progressão linear. ${modalityNote}`;

    rows.push({
      week: w,
      sessions: sessionsPerWeek,
      totalMin: weekTotalMin,
      rounds: protocol.key === "EMOM" || protocol.key === "AMRAP" ? undefined : weekRounds,
      workSec: protocol.key === "EMOM" || protocol.key === "AMRAP" ? undefined : workSec,
      restSec: protocol.key === "EMOM" || protocol.key === "AMRAP" ? undefined : restSec,
      notes,
    });
  }

  return rows;
}

function protocolParamsLine(protocol: Protocol, rounds: number, workSec: number, restSec: number, totalMinutes: number) {
  if (protocol.key === "EMOM") return `Tempo total: ${totalMinutes} min (EMOM)`;
  if (protocol.key === "AMRAP") return `Tempo total: ${totalMinutes} min (AMRAP)`;
  return `Rounds: ${rounds} | Work/Rest: ${workSec}s/${restSec}s`;
}

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

export default function HiitPlan() {
  const [goal, setGoal] = useState<GoalKey>("FAT_LOSS");
  const [modality, setModality] = useState<ModalityKey>("RUN");
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

  const [exportText, setExportText] = useState<string>("");

  // HYDRATE
  useEffect(() => {
    const data = safeParse(localStorage.getItem(STORAGE_KEY));
    if (!data || typeof data !== "object") return;

    if (data.goal) setGoal(data.goal);
    if (data.modality) setModality(data.modality);
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
      modality,
      protocolKey,
      weeks,
      sessionsPerWeek,
      totalMinutes,
      rounds,
      workSec,
      restSec,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [goal, modality, protocolKey, weeks, sessionsPerWeek, totalMinutes, rounds, workSec, restSec]);

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

  function applyProtocolDefaults(next: ProtocolKey) {
    const p = PROTOCOLS.find((x) => x.key === next) ?? PROTOCOLS[0];
    setProtocolKey(next);
    setTotalMinutes(p.defaultTotalMinutes);
    setRounds(p.defaults.rounds ?? 8);
    setWorkSec(p.defaults.workSec ?? 20);
    setRestSec(p.defaults.restSec ?? 10);
  }

  function applyModality(m: ModalityKey) {
    setModality(m);
    const tuned = applyModalityTuning(m, {
      weeks,
      sessionsPerWeek,
      totalMinutes,
      rounds,
      workSec,
      restSec,
    });
    setWeeks(tuned.weeks);
    setSessionsPerWeek(tuned.sessionsPerWeek);
    setTotalMinutes(tuned.totalMinutes);
    setRounds(tuned.rounds);
    setWorkSec(tuned.workSec);
    setRestSec(tuned.restSec);
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    setExportText("");
    setModality("RUN");
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
      modality,
    });
  }, [protocol, weeks, sessionsPerWeek, totalMinutes, rounds, workSec, restSec, modality]);

  const exportPayload = useMemo(() => {
    const goalName = GOALS.find((g) => g.key === goal)?.name ?? goal;
    const modalityName = MODALITIES.find((m) => m.key === modality)?.name ?? modality;

    const header = [
      "DRMINDSETFIT — HIIT",
      `Objetivo: ${goalName}`,
      `Modalidade: ${modalityName}`,
      `Protocolo: ${protocol.name} (${protocol.defaults.intensityLabel})`,
      `Bloco: ${weeks} semanas | ${sessionsPerWeek} sessões/sem`,
      protocolParamsLine(protocol, rounds, workSec, restSec, totalMinutes),
      "",
      "PROGRESSÃO (SEMANA A SEMANA):",
    ].join("\n");

    const lines = table
      .map((rRow) => {
        const wr =
          typeof rRow.workSec === "number" && typeof rRow.restSec === "number"
            ? `${rRow.workSec}s/${rRow.restSec}s`
            : "—";
        const rd = typeof rRow.rounds === "number" ? String(rRow.rounds) : "—";
        return `Semana ${rRow.week}: sessões=${rRow.sessions} | total=${rRow.totalMin}min | rounds=${rd} | work/rest=${wr} | ${rRow.notes}`;
      })
      .join("\n");

    return header + "\n" + lines + "\n";
  }, [goal, modality, protocol, weeks, sessionsPerWeek, totalMinutes, rounds, workSec, restSec, table]);

  async function copyPlan() {
    setExportText(exportPayload);
    try {
      await navigator.clipboard.writeText(exportPayload);
    } catch {
      // fallback: textarea fica preenchido pra copiar manualmente
    }
  }

  async function downloadPdf() {
    // 1) tenta jsPDF (se já existir no projeto)
    try {
      const mod: any = await import("jspdf");
      const JsPdf = mod?.jsPDF ?? mod?.default;
      if (!JsPdf) throw new Error("jsPDF export not found");

      const goalName = GOALS.find((g) => g.key === goal)?.name ?? goal;
      const modalityName = MODALITIES.find((m) => m.key === modality)?.name ?? modality;
      const fileName = `hiit-${slug(goalName)}-${slug(modalityName)}.pdf`;

      const doc = new JsPdf({ unit: "pt", format: "a4" });
      const margin = 40;
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const maxW = pageW - margin * 2;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("DRMINDSETFIT — HIIT", margin, margin);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const lines = doc.splitTextToSize(exportPayload, maxW);
      let y = margin + 24;

      for (const line of lines) {
        if (y > pageH - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(String(line), margin, y);
        y += 14;
      }

      doc.save(fileName);
      return;
    } catch {
      // 2) fallback: abrir janela print-friendly (Salvar como PDF)
      const w = window.open("", "_blank");
      if (!w) return;

      const safe = exportPayload
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

      w.document.open();
      w.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>DRMINDSETFIT — HIIT</title>
  <style>
    body { font-family: -apple-system, system-ui, Segoe UI, Roboto, Arial; padding: 24px; }
    pre { white-space: pre-wrap; font-size: 12px; line-height: 1.35; }
    .hint { margin-top: 12px; font-size: 12px; opacity: .7; }
  </style>
</head>
<body>
  <h2>DRMINDSETFIT — HIIT</h2>
  <pre>${safe}</pre>
  <div class="hint">Use Ctrl/Cmd+P e selecione “Salvar como PDF”.</div>
  <script>window.onload = () => setTimeout(() => window.print(), 250);</script>
</body>
</html>`);
      w.document.close();
    }
  }

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-red-500">HIIT — Avançado</h1>
          <p className="text-gray-300">Modalidade + export em texto + export em PDF.</p>
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
            </div>

            <div className="space-y-1">
              <div className="text-xs text-gray-400">Modalidade</div>
              <select
                value={modality}
                onChange={(e) => applyModality(e.target.value as ModalityKey)}
                className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 outline-none"
              >
                {MODALITIES.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.name}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-400 mt-2">{MODALITIES.find((m) => m.key === modality)?.note}</div>
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
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={copyPlan}
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs hover:bg-black/60"
              >
                Copiar plano
              </button>
              <button
                type="button"
                onClick={downloadPdf}
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs hover:bg-black/60"
              >
                Baixar PDF
              </button>
              <button
                type="button"
                onClick={resetAll}
                className="rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs hover:bg-black/60"
              >
                Reset
              </button>
            </div>

            {exportText ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-400">Export (fallback)</div>
                <textarea
                  value={exportText}
                  onChange={(e) => setExportText(e.target.value)}
                  rows={7}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs outline-none"
                />
                <div className="text-[11px] text-gray-500">Se clipboard estiver bloqueado, copie manualmente.</div>
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-red-500/20 bg-neutral-900 p-5 space-y-4">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <div className="text-xl font-semibold">Progressão Semanal</div>
                <div className="text-sm text-gray-300">
                  Protocolo: <span className="text-white font-semibold">{protocol.name}</span>
                </div>
              </div>
              <div className="text-xs text-gray-400">PDF: tenta jsPDF, senão abre “Salvar como PDF” (print).</div>
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
                  {table.map((rRow) => (
                    <tr key={rRow.week} className="border-t border-white/10">
                      <td className="px-3 py-2 font-semibold">{rRow.week}</td>
                      <td className="px-3 py-2">{rRow.sessions}</td>
                      <td className="px-3 py-2">{rRow.totalMin}</td>
                      <td className="px-3 py-2">{typeof rRow.rounds === "number" ? rRow.rounds : "—"}</td>
                      <td className="px-3 py-2">
                        {typeof rRow.workSec === "number" && typeof rRow.restSec === "number"
                          ? `${rRow.workSec}s / ${rRow.restSec}s`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-300">{rRow.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-xs text-gray-400">
              Dica: use “Baixar PDF” para anexar no WhatsApp/relatório do paciente.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
