import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { historyService } from "@/services/history/HistoryService";
import StatsOverview from "@/components/analytics/StatsOverview";
import WorkoutsChart from "@/components/analytics/WorkoutsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const DAY_PRESETS = [7, 14, 30, 90] as const;

export default function ProgressPage() {
  const nav = useNavigate();
  const [days, setDays] = useState<(typeof DAY_PRESETS)[number]>(14);

  const workouts = useMemo(() => {
    try {
      return historyService.listWorkouts?.() ?? [];
    } catch {
      return [];
    }
  }, [days]);

  return (
    <div className="min-h-screen mf-app-bg mf-bg-neon text-white">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xl font-semibold text-white">Progresso</div>
            <div className="text-xs text-white/60">Histórico + métricas dos últimos {days} dias</div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => nav("/ai")}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <X className="mr-1 h-4 w-4" />
              Fechar
            </Button>
            {DAY_PRESETS.map((d) => (
              <Button
                key={d}
                size="sm"
                variant={days === d ? "secondary" : "outline"}
                onClick={() => setDays(d)}
                className={days === d ? "" : "border-white/10 bg-white/5 text-white hover:bg-white/10"}
              >
                {d}d
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-4">
          <StatsOverview workouts={workouts as any} days={days} />
          <WorkoutsChart workouts={workouts as any} days={days} />

          <Card className="border-white/10 bg-[rgba(8,10,18,0.82)]">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white sm:text-lg">Últimas sessões</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {!workouts?.length ? (
                <div className="text-zinc-500">Nenhum registro ainda.</div>
              ) : (
                <div className="grid gap-2">
                  {(workouts as any[]).slice(0, 20).map((w, i) => (
                    <div
                      key={String(w?.id ?? i)}
                      className="cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950/40 p-3 transition-colors hover:bg-zinc-950/60"
                      role="button"
                      tabIndex={0}
                      onClick={() => nav(`/workout/${String(w?.id ?? "")}`)}
                    >
                      <div className="font-semibold text-white">{String(w?.title ?? w?.type ?? "Treino")}</div>
                      <div className="text-xs text-zinc-400">{new Date(Number(w?.ts ?? Date.now())).toLocaleString()}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {typeof w?.durationS === "number" ? <>Tempo: {w.durationS}s </> : null}
                        {typeof w?.distanceM === "number" ? <>• Distância: {Math.round(w.distanceM)}m </> : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
