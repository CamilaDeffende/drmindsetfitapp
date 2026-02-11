import { useMemo } from "react";
import type { WorkoutRecord } from "@/services/history/HistoryService";
import { filterByDays, pickTs, pickDurationS, pickDistanceM } from "@/components/analytics/analytics-utils";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

type Row = { day: string; sessions: number; durationMin: number; distanceKm: number };

export default function WorkoutsChart({
  workouts,
  days = 14,
}: {
  workouts: WorkoutRecord[];
  days?: number;
}) {
  const data = useMemo<Row[]>(() => {
    const since = subDays(new Date(), Math.max(1, days)).getTime();
    const byDay = new Map<string, Row>();

    const ws = filterByDays(workouts ?? [], days).filter((w: any) => pickTs(w) >= since);

    for (const w of ws as any[]) {
      const d = new Date(pickTs(w));
      const key = format(d, "MM-dd");
      const row = byDay.get(key) ?? { day: key, sessions: 0, durationMin: 0, distanceKm: 0 };
      row.sessions += 1;
      row.durationMin += Math.round(pickDurationS(w) / 60);
      row.distanceKm += pickDistanceM(w) / 1000;
      byDay.set(key, row);
    }

    // preencher dias sem treino (para o gráfico ficar “contínuo”)
    const out: Row[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dt = subDays(new Date(), i);
      const key = format(dt, "MM-dd");
      out.push(byDay.get(key) ?? { day: key, sessions: 0, durationMin: 0, distanceKm: 0 });
    }
    return out;
  }, [workouts, days]);

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg">Sessões por dia ({days} dias)</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(days / 7))} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                formatter={(value: any, name: any) => {
                  if (name === "sessions") return [value, "Sessões"];
                  return [value, String(name)];
                }}
              />
              <Bar dataKey="sessions" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 text-[11px] text-muted-foreground">
          Dica: ao salvar uma sessão GPS em “/live-workout”, ela aparece aqui automaticamente.
        </div>
      </CardContent>
    </Card>
  );
}
