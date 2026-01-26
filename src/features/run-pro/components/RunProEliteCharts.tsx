import { useMemo } from "react";
import { useRunProEliteStore } from "@/features/run-pro/store/useRunProEliteStore";
import { haversineM } from "@/features/run-pro/utils/geo";
import { formatTsInActiveTz } from "@/features/run-pro/utils/timeLabel";
import type { RunFix } from "@/features/run-pro/types/runTypes";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type Pt = { ts: number; t: string; distKm: number; paceSecKm?: number };

function paceLabel(sec?: number) {
  if (!sec || !Number.isFinite(sec)) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")} /km`;
}

export function RunProEliteCharts() {
  const smoothFixes = useRunProEliteStore((s) => s.smoothFixes);

  const data = useMemo(() => {
    const pts: Pt[] = [];
    let distM = 0;

    for (let i = 0; i < smoothFixes.length; i++) {
      const a: RunFix | undefined = smoothFixes[i - 1];
      const b: RunFix = smoothFixes[i];

      if (a) {
        const d = haversineM(a.lat, a.lon, b.lat, b.lon);
        if (Number.isFinite(d) && d > 0) distM += d;

        const dt = (b.ts - a.ts) / 1000;
        if (dt > 0 && d > 0.5) {
          const speed = d / dt; // m/s
          const paceSecKm = speed > 0.2 ? 1000 / speed : undefined;
          pts.push({
            ts: b.ts,
            t: formatTsInActiveTz(b.ts),
            distKm: distM / 1000,
            paceSecKm,
          });
        } else {
          pts.push({
            ts: b.ts,
            t: formatTsInActiveTz(b.ts),
            distKm: distM / 1000,
          });
        }
      } else {
        pts.push({
          ts: b.ts,
          t: formatTsInActiveTz(b.ts),
          distKm: 0,
        });
      }
    }

    // reduz densidade (performance) mantendo cara premium
    if (pts.length > 700) {
      const step = Math.ceil(pts.length / 700);
      return pts.filter((_, idx) => idx % step === 0);
    }
    return pts;
  }, [smoothFixes]);

  if (data.length < 3) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-[12px] text-white/55">
        Comece a corrida para gerar os gráficos ao vivo.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
        <div className="text-[11px] text-white/55">Pace ao vivo</div>
        <div className="mt-2 h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" hide />
              <YAxis
                dataKey="paceSecKm"
                tickFormatter={(v) => paceLabel(v)}
                width={70}
              />
              <Tooltip
                formatter={(v: any, name: any) =>
                  name === "paceSecKm" ? [paceLabel(Number(v)), "pace"] : [v, name]
                }
                labelFormatter={(label) => `Horário: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="paceSecKm"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/30 p-3">
        <div className="text-[11px] text-white/55">Distância acumulada</div>
        <div className="mt-2 h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" hide />
              <YAxis
                dataKey="distKm"
                tickFormatter={(v) => `${Number(v).toFixed(1)} km`}
                width={70}
              />
              <Tooltip
                formatter={(v: any, name: any) =>
                  name === "distKm" ? [`${Number(v).toFixed(2)} km`, "distância"] : [v, name]
                }
                labelFormatter={(label) => `Horário: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="distKm"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
