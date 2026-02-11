import { useMemo, useState } from "react";
import type { WorkoutRecord } from "@/services/history/HistoryService";
import { filterByDays, pickTs, pickDurationS, pickDistanceM } from "@/components/analytics/analytics-utils";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

type Row = { day: string; sessions: number; durationMin: number; distanceKm: number };
type Mode = "sessions" | "durationMin" | "distanceKm";

function modeLabel(mode: Mode) {
  if (mode === "sessions") return "Sessões";
  if (mode === "durationMin") return "Duração (min)";
  return "Distância (km)";
}

export default function WorkoutsChart({
  workouts,
  days = 14,
}: {
  workouts: WorkoutRecord[];
  days?: number;
}) {
  const [mode, setMode] = useState<Mode>("sessions");

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

    // preencher dias sem treino
    const out: Row[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const dt = subDays(new Date(), i);
      const key = format(dt, "MM-dd");
      out.push(byDay.get(key) ?? { day: key, sessions: 0, durationMin: 0, distanceKm: 0 });
    }
    return out;
  }, [workouts, days]);

  const yTick = (v: any) => {
    if (mode === "distanceKm") {
      const n = Number(v);
      if (!Number.isFinite(n)) return String(v);
      return n < 10 ? n.toFixed(1) : String(Math.round(n));
    }
    return String(v);
  };

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg">
            {modeLabel(mode)} por dia ({days} dias)
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button size="sm" variant={mode === "sessions" ? "secondary" : "outline"} onClick={() => setMode("sessions")}>
              Sessões
            </Button>
            <Button size="sm" variant={mode === "durationMin" ? "secondary" : "outline"} onClick={() => setMode("durationMin")}>
              Duração
            </Button>
            <Button size="sm" variant={mode === "distanceKm" ? "secondary" : "outline"} onClick={() => setMode("distanceKm")}>
              Distância
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={Math.max(0, Math.floor(days / 7))} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={mode === "distanceKm"} tickFormatter={yTick} />
              <Tooltip
                formatter={(value: any) => {
                  const n = Number(value);
                  if (mode === "sessions") return [Number.isFinite(n) ? Math.round(n) : value, "Sessões"];
                  if (mode === "durationMin") return [Number.isFinite(n) ? Math.round(n) : value, "Minutos"];
                  return [Number.isFinite(n) ? (n < 10 ? n.toFixed(2) : n.toFixed(1)) : value, "Km"];
                }}
              />
              <Bar dataKey={mode} />
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
