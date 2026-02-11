import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, subDays, startOfDay } from "date-fns";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Workout = {
  ts: number;
  durationS?: number;
  distanceM?: number;
  caloriesKcal?: number;
};

type Point = {
  day: string;
  durationMin: number;
  distanceKm: number;
};

function safeNum(n: any): number {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

export default function WorkoutsChart({ workouts, days = 14 }: { workouts: Workout[]; days?: number }) {
  const data = useMemo(() => {
    const today = startOfDay(new Date());
    const start = startOfDay(subDays(today, days - 1)).getTime();

    const byDay = new Map<string, { durationS: number; distanceM: number }>();

    for (const w of workouts) {
      const ts = safeNum(w.ts);
      if (!ts || ts < start) continue;
      const key = format(new Date(ts), "MM-dd");
      const cur = byDay.get(key) ?? { durationS: 0, distanceM: 0 };
      cur.durationS += safeNum(w.durationS);
      cur.distanceM += safeNum(w.distanceM);
      byDay.set(key, cur);
    }

    const out: Point[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = subDays(today, i);
      const key = format(d, "MM-dd");
      const cur = byDay.get(key) ?? { durationS: 0, distanceM: 0 };
      out.push({
        day: format(d, "dd/MM"),
        durationMin: Math.round((cur.durationS / 60) * 10) / 10,
        distanceKm: Math.round((cur.distanceM / 1000) * 10) / 10,
      });
    }
    return out;
  }, [workouts, days]);

  return (
    <Card className="border-white/10 bg-white/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-zinc-200">Volume (últimos {days} dias)</CardTitle>
      </CardHeader>
      <CardContent className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line type="monotone" dataKey="durationMin" name="Min" dot={false} />
            <Line type="monotone" dataKey="distanceKm" name="Km" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
