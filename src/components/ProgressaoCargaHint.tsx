import { useMemo } from "react";

type Registro = {
  data?: string;
  exercicioId?: string;
  exercicioNome?: string;
  kg?: number;
  reps?: number;
  series?: number;
  cargaTotal?: number;
  detalhes?: Array<{ serie?: number; kg?: number; reps?: number }>;
  [k: string]: any;
};

function pickKey(r: Registro): string {
  return String(
    r.exercicioId ??
      r.exercicioNome ??
      r.exercicio ??
      r.exercicio_key ??
      r.exerciseId ??
      r.exerciseName ??
      "exercicio"
  );
}

function pickKg(r: Registro): number | null {
  if (typeof r.kg === "number") return r.kg;
  if (typeof r.cargaTotal === "number") return r.cargaTotal;
  const d = Array.isArray(r.detalhes) ? r.detalhes : [];
  const sum = d.reduce((acc, it) => acc + (typeof it.kg === "number" ? it.kg : 0), 0);
  return sum > 0 ? sum : null;
}

function formatDelta(delta: number): string {
  const sign = delta > 0 ? "+" : "";
  const abs = Math.round(Math.abs(delta) * 10) / 10;
  return `${sign}${abs}`;
}

export function ProgressaoCargaHint(props: {
  historico: Registro[];
  exercicioKey?: string;
}) {
  const { historico, exercicioKey } = props;

  const hint = useMemo(() => {
    const list = Array.isArray(historico) ? historico : [];
    if (!list.length) return null;

    // filtra por exercício (se passou key)
    const filtered = exercicioKey
      ? list.filter((r) => pickKey(r) === String(exercicioKey))
      : list;

    if (filtered.length < 2) return null;

    // pega os 2 últimos registros "com kg"
    const lastTwo: Array<{ kg: number; key: string }> = [];
    for (let i = filtered.length - 1; i >= 0; i--) {
      const r = filtered[i];
      const kg = pickKg(r);
      if (kg != null && kg > 0) {
        lastTwo.push({ kg, key: pickKey(r) });
      }
      if (lastTwo.length >= 2) break;
    }
    if (lastTwo.length < 2) return null;

    const a = lastTwo[1].kg;
    const b = lastTwo[0].kg;
    const delta = b - a;

    // regra simples e segura:
    // - se ficou igual: sugerir +2.5kg
    // - se aumentou: manter + pequena progressão
    // - se caiu: sugerir manter e consolidar
    if (Math.abs(delta) < 0.01) {
      return { tone: "up", text: "Próxima sessão: tente +2,5 kg (progressão conservadora)." };
    }
    if (delta > 0) {
      return { tone: "ok", text: `Boa evolução: ${formatDelta(delta)} kg. Se estiver estável, suba mais +1–2,5 kg.` };
    }
    return { tone: "down", text: `Carga caiu ${formatDelta(delta)} kg. Sugestão: manter e consolidar execução/reps.` };
  }, [historico, exercicioKey]);

  if (!hint) return null;

  const base =
    "mt-3 rounded-xl border px-3 py-2 text-xs leading-relaxed";
  const tone =
    hint.tone === "up"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
      : hint.tone === "down"
      ? "border-amber-400/30 bg-amber-500/10 text-amber-200"
      : "border-sky-400/30 bg-sky-500/10 text-sky-200";

  return (
    <div className={`${base} ${tone}`}>
      <div className="font-semibold">Progressão de carga</div>
      <div className="opacity-90">{hint.text}</div>
    </div>
  );
}

export default ProgressaoCargaHint;
