import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";

export type RunSample = { lat: number; lng: number; ts: number; accuracy?: number; paceSecPerKm?: number; distM?: number };

function fmtTime(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2,"0")}`;
}
function fmtPace(sec: number) {
  if (!Number.isFinite(sec) || sec <= 0) return "--:--";
  const m = Math.floor(sec / 60);
  const r = Math.round(sec % 60);
  return `${m}:${String(r).padStart(2,"0")}`;
}
function safeNum(n: unknown, fb=0){ return typeof n === "number" && Number.isFinite(n) ? n : fb; }

// deriva pace/dist por segmento (não depende do engine)
function derive(samples: RunSample[]) {
  const sorted = [...samples].sort((a,b)=>a.ts-b.ts);
  const out: Array<{ t: number; tLabel: string; pace: number; distKm: number }> = [];
  let dist = 0;
  const toRad = (d:number)=>d*Math.PI/180;
  const R = 6371000;

  for (let i=1;i<sorted.length;i++){
    const a = sorted[i-1], b = sorted[i];
    const dt = b.ts - a.ts;
    if (dt < 800) continue;

    const dLat = toRad(b.lat-a.lat);
    const dLng = toRad(b.lng-a.lng);
    const sa = Math.sin(dLat/2), sb = Math.sin(dLng/2);
    const A = sa*sa + Math.cos(toRad(a.lat))*Math.cos(toRad(b.lat))*sb*sb;
    const c = 2*Math.atan2(Math.sqrt(A), Math.sqrt(1-A));
    const d = R*c;

    // filtra saltos absurdos
    if (!Number.isFinite(d) || d < 0 || d > 80) continue;

    const speed = d / (dt/1000);
    if (!Number.isFinite(speed) || speed <= 0) continue;

    const pace = 1000 / speed; // sec/km
    if (pace < 150 || pace > 1200) continue;

    dist += d;
    const t = b.ts - sorted[0].ts;
    out.push({ t, tLabel: fmtTime(t), pace, distKm: dist/1000 });
  }
  return out;
}

function buildSplits(series: Array<{ t:number; pace:number; distKm:number }>) {
  // pace médio por km completo
  const splits: Array<{ km: string; pace: number }> = [];
  if (!series.length) return splits;

  let curKm = 1;
  let acc = 0;
  let accDist = 0;
  let lastDist = 0;

  for (let i=0;i<series.length;i++){
    const d = series[i].distKm;
    const segDist = Math.max(0, d - lastDist);
    lastDist = d;

    const pace = safeNum(series[i].pace, 0);
    if (pace <= 0) continue;

    acc += pace * segDist;
    accDist += segDist;

    if (d >= curKm) {
      const avg = accDist > 0 ? (acc/accDist) : pace;
      splits.push({ km: `${curKm} km`, pace: avg });
      curKm += 1;
      acc = 0;
      accDist = 0;
    }
    if (curKm > 50) break;
  }
  return splits;
}

function buildStability(series: Array<{ pace:number }>) {
  if (series.length < 6) return null;
  const p = series.map(x=>x.pace);
  const mean = p.reduce((a,b)=>a+b,0)/p.length;
  const v = p.reduce((a,b)=>a+Math.pow(b-mean,2),0)/p.length;
  const cv = mean > 0 ? Math.sqrt(v)/mean : null;
  return cv;
}

export function RunChartsPremium({ samples }: { samples: RunSample[] }) {
  const series = useMemo(() => derive(samples), [samples]);
  const splits = useMemo(() => buildSplits(series), [series]);
  const cv = useMemo(() => buildStability(series.map(x=>({ pace:x.pace }))), [series]);

  const stabilityLabel =
    cv == null ? "Dados insuficientes" :
    cv <= 0.09 ? "Estável" :
    cv <= 0.14 ? "Moderado" : "Instável";

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-2xl border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Pace ao longo do tempo</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Estabilidade: <span className="font-semibold">{stabilityLabel}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {series.length ? `Dist: ${series[series.length-1].distKm.toFixed(2)} km` : "—"}
          </div>
        </div>

        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tLabel" minTickGap={24} />
              <YAxis tickFormatter={(v)=>fmtPace(Number(v))} domain={["dataMin","dataMax"]} />
              <Tooltip
                formatter={(v)=>fmtPace(Number(v))}
                labelFormatter={(l)=>`Tempo ${l}`}
              />
              <Line type="monotone" dataKey="pace" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="text-sm font-semibold">Distância acumulada</div>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="tLabel" minTickGap={24} />
              <YAxis tickFormatter={(v)=>`${Number(v).toFixed(1)}`} />
              <Tooltip
                formatter={(v)=>`${Number(v).toFixed(2)} km`}
                labelFormatter={(l)=>`Tempo ${l}`}
              />
              <Line type="monotone" dataKey="distKm" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-4">
        <div className="text-sm font-semibold">Splits (por km)</div>
        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={splits}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="km" />
              <YAxis tickFormatter={(v)=>fmtPace(Number(v))} />
              <Tooltip formatter={(v)=>fmtPace(Number(v))} />
              <Bar dataKey="pace" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
