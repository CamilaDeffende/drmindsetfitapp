import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { movingAverage, sortByDateAsc, TimePoint } from "@/services/history/analytics/stats";

function fmt(d: string) {
  return String(d).slice(5); // MM-DD
}

export function WeightChart({ points }: { points: TimePoint[] }) {
  const data = useMemo(() => {
    const base = sortByDateAsc(points).map((p) => ({ date: p.date, peso: Number(p.value) || 0 }));
    const ma = movingAverage(points, 7).map((p) => ({ date: p.date, mm7: Number(p.value) || 0 }));
    const map = new Map<string, any>();
    for (const b of base) map.set(b.date, { ...(map.get(b.date) || {}), ...b });
    for (const m of ma) map.set(m.date, { ...(map.get(m.date) || {}), ...m });
    return Array.from(map.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [points]);

  if (!data.length) {
    return <div className="rounded-2xl bg-white/80 dark:bg-zinc-800/70 shadow-sm p-4 text-sm text-zinc-500 dark:text-zinc-300">Sem dados de peso ainda.</div>;
  }

  return (
    <div className="rounded-2xl bg-white/80 dark:bg-zinc-800/70 shadow-sm p-3">
      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50 mb-2">Peso — tendência (MM7)</div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={fmt} />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip />
            <Line type="monotone" dataKey="peso" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="mm7" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">Linha 1: peso diário • Linha 2: média móvel 7 dias</div>
    </div>
  );
}
