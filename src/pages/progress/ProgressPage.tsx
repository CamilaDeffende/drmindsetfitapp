import { historyService } from "@/services/history/HistoryService";
import StatsOverview from "@/components/analytics/StatsOverview";
import WorkoutsChart from "@/components/analytics/WorkoutsChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProgressPage() {
  const workouts = historyService.listWorkouts?.() ?? [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">Progresso</h1>
        <p className="text-sm text-muted-foreground">
          Histórico + visão objetiva do seu volume de treinos.
        </p>
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-sm text-muted-foreground">Total de sessões no histórico</div>
        <div className="text-white font-semibold">{workouts.length}</div>
      </div>

      <div className="mb-4">
        <StatsOverview workouts={workouts as any} />
      </div>

      <div className="mb-4">
        <WorkoutsChart workouts={workouts as any} days={14} />
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white">Sessões recentes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {workouts.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum registro ainda.</div>
          ) : (
            <div className="grid gap-2">
              {workouts.slice(0, 20).map((w: any) => (
                <div
                  key={String(w.id ?? w.ts ?? Math.random())}
                  className="rounded-xl border border-white/10 bg-black/10 px-3 py-2"
                >
                  <div className="text-white font-semibold">
                    {String(w.title ?? w.type ?? "Treino")}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {new Date(Number(w.ts ?? Date.now())).toLocaleString()}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {typeof w.durationS === "number" ? <>⏱ {w.durationS}s </> : null}
                    {typeof w.distanceM === "number" ? <>• 📍 {Math.round(w.distanceM)}m </> : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
