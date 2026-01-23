import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import type { RunSample } from "@/features/run-pro/engine/types";

type Props = {
  samples: RunSample[];
};

type P = { t: number; sec: number; distKm: number; pace: number | null };

function msToMinSecLabel(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function compactTime(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const r = Math.round(sec % 60);
  return `${m}m ${r}s`;
}

function computeSplits(samples: RunSample[]) {
  // splits por km (aprox): usa distTotalM e timestamps
  const out: Array<{ km: number; pace: number; timeSec: number }> = [];
  if (samples.length < 2) return out;

  let kmIndex = 1;
  let lastKmMarkM = 0;
  let tStart = samples[0].ts;

  for (let i = 1; i < samples.length; i++) {
    const s = samples[i];
    const d = s.distTotalM;
    while (d >= kmIndex * 1000) {
      // estima tempo no kmIndex usando interpolação simples entre i-1 e i
      const prev = samples[i - 1];
      const targetM = kmIndex * 1000;

      const segM = s.distTotalM - prev.distTotalM;
      const ratio = segM > 0 ? (targetM - prev.distTotalM) / segM : 0;
      const tsAt = prev.ts + (s.ts - prev.ts) * Math.max(0, Math.min(1, ratio));

      const kmTimeSec = Math.max(0.1, (tsAt - tStart) / 1000);
      const deltaM = targetM - lastKmMarkM;
      const paceSecPerKm = deltaM > 0 ? kmTimeSec / (deltaM / 1000) : kmTimeSec;

      out.push({ km: kmIndex, pace: paceSecPerKm, timeSec: kmTimeSec });

      // reset para próximo split
      lastKmMarkM = targetM;
      tStart = tsAt;
      kmIndex += 1;
    }
  }

  return out.slice(0, 20); // segurança
}

export function RunCharts({ samples }: Props) {
  const data = useMemo<P[]>(() => {
    if (!samples.length) return [];
    const t0 = samples[0].ts;
    return samples.map((s) => {
      const sec = (s.ts - t0) / 1000;
      const distKm = s.distTotalM / 1000;
      const pace = typeof s.paceSecPerKm === "number" && Number.isFinite(s.paceSecPerKm) ? s.paceSecPerKm : null;
      return { t: s.ts, sec, distKm, pace };
    });
  }, [samples]);

  const splits = useMemo(() => computeSplits(samples), [samples]);

  const stability = useMemo(() => {
    const p = data.map((d) => d.pace).filter((x): x is number => typeof x === "number");
    if (p.length < 4) return { variance: null as number | null, label: "Dados insuficientes" };
    const mean = p.reduce((a, b) => a + b, 0) / p.length;
    const v = p.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / p.length;
    const sd = Math.sqrt(v);
    // SD em sec/km: quanto menor, mais estável
    let label = "Muito estável";
    if (sd > 25) label = "Oscilando";
    if (sd > 45) label = "Instável";
    return { variance: sd, label };
  }, [data]);

  if (!samples.length) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        Sem dados de corrida ainda.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-baseline justify-between">
          <div className="text-sm font-semibold">Pace vs tempo</div>
          <div className="text-xs text-muted-foreground">quanto menor, melhor</div>
        </div>
        <div className="mt-3 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="sec"
                tickFormatter={(v) => compactTime(Number(v))}
                fontSize={12}
              />
              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(v) => msToMinSecLabel(Number(v))}
                fontSize={12}
              />
              <Tooltip
                formatter={(value: any) => msToMinSecLabel(Number(value))}
                labelFormatter={(label) => `t: ${compactTime(Number(label))}`}
              />
              <Line type="monotone" dataKey="pace" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-baseline justify-between">
          <div className="text-sm font-semibold">Distância acumulada</div>
          <div className="text-xs text-muted-foreground">km</div>
        </div>
        <div className="mt-3 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sec" tickFormatter={(v) => compactTime(Number(v))} fontSize={12} />
              <YAxis domain={[0, "auto"]} fontSize={12} />
              <Tooltip
                formatter={(value: any) => `${Number(value).toFixed(2)} km`}
                labelFormatter={(label) => `t: ${compactTime(Number(label))}`}
              />
              <Line type="monotone" dataKey="distKm" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4 lg:col-span-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-semibold">Splits (por km)</div>
          <div className="text-xs text-muted-foreground">leitura rápida de consistência</div>
        </div>

        {splits.length === 0 ? (
          <div className="mt-3 text-sm text-muted-foreground">Complete 1 km para ver splits.</div>
        ) : (
          <div className="mt-3 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={splits}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="km" fontSize={12} />
                <YAxis tickFormatter={(v) => msToMinSecLabel(Number(v))} fontSize={12} />
                <Tooltip
                  formatter={(value: any) => msToMinSecLabel(Number(value))}
                  labelFormatter={(label) => `Km ${label}`}
                />
                <Bar dataKey="pace" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-4 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Estabilidade do ritmo</div>
            <div className="text-xs text-muted-foreground">variação do pace ao longo da sessão</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-semibold">
              {stability.variance == null ? "—" : `${Math.round(stability.variance)}s`}
            </div>
            <div className="text-xs text-muted-foreground">{stability.label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
