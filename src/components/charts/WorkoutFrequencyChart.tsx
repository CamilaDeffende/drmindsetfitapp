import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Pt = { week: string; workouts: number };

export default function WorkoutFrequencyChart({ data }: { data: Pt[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-white">Frequência semanal</div>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" hide />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="workouts" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-white/60">*Eixo X oculto para manter layout premium clean.</div>
    </div>
  );
}
