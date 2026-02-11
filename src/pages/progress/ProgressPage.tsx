import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HistoryService } from "@/services/history/HistoryService";

export default function ProgressPage() {
  const [tick, setTick] = useState(0);
  const workouts = useMemo(() => {
    void tick;
    return HistoryService.listWorkouts();
  }, [tick]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-2">Progresso</h1>
      <p className="text-sm text-zinc-400 mb-4">Histórico e gráficos (Fase 7).</p>

      <div className="flex gap-2 mb-4">
        <Button variant="outline" onClick={() => setTick((v) => v + 1)}>Atualizar</Button>
        <Button
          variant="secondary"
          onClick={() => { HistoryService.clearAll(); setTick((v) => v + 1); }}
        >
          Limpar histórico (dev)
        </Button>
      </div>

      <Card className="bg-zinc-900/70 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Sessões salvas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-zinc-300">
          {workouts.length === 0 ? (
            <div className="text-zinc-500">Nenhum registro ainda.</div>
          ) : (
            workouts.slice(0, 20).map((w) => (
              <div key={w.id} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
                <div className="text-white font-semibold">{w.title || w.type.toUpperCase()}</div>
                <div className="text-xs text-zinc-400">{new Date(w.ts).toLocaleString()}</div>
                <div className="mt-1">
                  {typeof w.durationS === "number" ? <>⏱ {w.durationS}s </> : null}
                  {typeof w.distanceM === "number" ? <>• 📍 {Math.round(w.distanceM)}m </> : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
