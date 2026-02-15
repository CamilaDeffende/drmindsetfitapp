import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format } from "date-fns";

type Pt = { dateIso: string; weightKg: number };

function fmt(d: string) {
  const t = Date.parse(d);
  if (!Number.isFinite(t)) return "";
  return format(new Date(t), "dd/MM");
}

export default function WeightChart({ data }: { data: Pt[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-white">Peso (kg)</div>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateIso" tickFormatter={fmt} />
            <YAxis domain={["dataMin - 1", "dataMax + 1"]} />
            <Tooltip labelFormatter={(v) => fmt(String(v))} formatter={(v) => [v, "kg"]} />
            <Line type="monotone" dataKey="weightKg" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
