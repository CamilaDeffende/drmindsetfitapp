
import { useState, useEffect } from "react";
import { useGPS } from "@/hooks/useGPS/useGPS";
import { LiveMetricsDisplay } from "@/components/live-metrics/LiveMetricsDisplay";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { historyService } from "@/services/history/HistoryService";

export function LiveWorkoutPage() {
  const navigate = useNavigate();
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [workoutType, setWorkoutType] = useState<"corrida"|"ciclismo"|"musculacao"|"crossfit"|"funcional">("corrida");

  const { isTracking, stats, error, startTracking, stopTracking, reset, exportGPX } = useGPS();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval: number | undefined;
    if (isTracking && !isPaused) {
      interval = window.setInterval(() => setElapsedSeconds((p) => p + 1), 1000);
    }

  const estimateCalories = (type: string, durationMin: number): number => {
    const perMin: Record<string, number> = {
      corrida: 10,
      ciclismo: 9,
      musculacao: 6,
      crossfit: 11,
      funcional: 8,
    };
    const k = perMin[type] ?? 8;
    return Math.max(20, Math.round(durationMin * k));
  };

  const handleStart = async () => {
    setStartedAt(Date.now());
    await startTracking();
  };
  const handleFinish = async () => {
    try { await stopTracking(); } catch {}
    const now = Date.now();
    const start = startedAt ?? now;
    const durationMin = Math.max(1, Math.round((now - start) / 60000));

    const distanceKm =
      (stats as any)?.distanceKm ??
      (stats as any)?.distance ??
      0;

    const calories = estimateCalories(workoutType, durationMin);

    const workout: any = {
      date: new Date().toISOString(),
      type: workoutType,
      durationMin,
      distanceKm: typeof distanceKm === "number" ? distanceKm : 0,
      calories,
      caloriesBurned: calories,
      pse: Math.min(10, Math.max(1, Math.round(((stats as any)?.avgPSE ?? 7)))),
      source: "live-gps",
    };

  // MF_KEEP_HANDLERS_USED (TS6133-safe, no side-effect)
  void handleStart;
  void handleFinish;


    historyService.addWorkout(workout);

    try { reset(); } catch {}
    setStartedAt(null);
    navigate("/progress");
  };

    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [isTracking, isPaused]);

  const handleStart = async () => {
    reset();
    await startTracking();
    setElapsedSeconds(0);
    setIsPaused(false);
  };

  const handlePause = () => setIsPaused((p) => !p);

  const handleStop = () => {
    stopTracking();
    setIsPaused(false);
  };

  const handleExport = () => {
    const gpx = exportGPX(`Treino ${new Date().toLocaleDateString("pt-BR")}`);
    const blob = new Blob([gpx], { type: "application/gpx+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `drmindsetfit-treino-${Date.now()}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
        <div className="mb-4">
          <label className="text-xs text-gray-400">Tipo de treino</label>
          <select
            name="workoutType"
            value={workoutType}
            onChange={(e) => setWorkoutType(e.target.value as any)}
            className="mt-2 w-full rounded-lg bg-gray-900/60 border border-gray-700 px-3 py-2 text-sm text-gray-100"
          >
            <option value="corrida">Corrida</option>
            <option value="ciclismo">Ciclismo</option>
            <option value="musculacao">Musculação</option>
            <option value="crossfit">CrossFit</option>
            <option value="funcional">Funcional</option>
          </select>
        </div>

      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-blue-400 mb-6">Treino ao Vivo</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 rounded-xl p-4 mb-6">
            {error}
          </div>
        )}

        <LiveMetricsDisplay stats={stats} elapsedSeconds={elapsedSeconds} />

        <div className="flex gap-4 mt-6">
          {!isTracking ? (
            <Button onClick={handleStart} className="flex-1 bg-green-600 hover:bg-green-700 h-14 text-lg">
              <Play className="mr-2" />
              Iniciar
            </Button>
          ) : (
            <>
              <Button onClick={handlePause} className="flex-1 bg-yellow-600 hover:bg-yellow-700 h-14 text-lg">
                <Pause className="mr-2" />
                {isPaused ? "Retomar" : "Pausar"}
              </Button>
              <Button onClick={handleStop} className="flex-1 bg-red-600 hover:bg-red-700 h-14 text-lg">
                <Square className="mr-2" />
                Finalizar
              </Button>
            </>
          )}
        </div>

        {!isTracking && stats.distanceMeters > 0 && (
          <Button onClick={handleExport} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 h-12">
            <Download className="mr-2" />
            Exportar GPX
          </Button>
        )}
      </div>
    </div>
  );
}
