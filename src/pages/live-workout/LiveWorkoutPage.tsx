import { useMemo, useState  } from "react";
import { useNavigate } from "react-router-dom";
import { useGPS } from "@/hooks/useGPS/useGPS";
import { historyService } from "@/services/history/HistoryService";

type StatsLike = {
  distanceKm?: number;
  durationMin?: number;
  calories?: number;
  avgPaceMinKm?: number;
};

function n(v: any): number {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
}

export function LiveWorkoutPage() {
  const navigate = useNavigate();
  const { isTracking, stats, error, startTracking, stopTracking, reset, exportGPX } = useGPS();

  const [workoutType, setWorkoutType] = useState<"corrida" | "ciclismo" | "musculacao" | "crossfit" | "funcional">(
    "corrida"
  );

  const s = (stats ?? {}) as StatsLike;

  const distanceKm = useMemo(() => n((s as any).distanceKm ?? (s as any).distance ?? 0), [s]);
  const durationMin = useMemo(() => n((s as any).durationMin ?? (s as any).durationMinutes ?? 0), [s]);
  const calories = useMemo(() => n((s as any).calories ?? 0), [s]);
  const avgPaceMinKm = useMemo(() => {
    const v = (s as any).avgPaceMinKm ?? (s as any).paceMinKm;
    const num = Number(v);
    return Number.isFinite(num) && num > 0 ? num : undefined;
  }, [s]);

  const handleStart = async () => {
    try {
      await startTracking();
    } catch (e) {
      console.error("MF handleStart:", e);
    }
  };

  const handleStop = async () => {
    try {
      await stopTracking();
    } catch (e) {
      console.error("MF handleStop:", e);
    }
  };

  const handleExport = () => {
    try {
      const gpx = exportGPX(`Treino ${new Date().toLocaleDateString("pt-BR")}`);
      const blob = new Blob([gpx], { type: "application/gpx+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drmindsetfit-treino-${Date.now()}.gpx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("MF exportGPX:", e);
    }
  };

  const handleFinish = async () => {
    try {
      // encerra tracking se estiver ativo (não depende disso para salvar)
      if (isTracking) {
        try {
          await stopTracking();
        } catch {}
      }

      const nowIso = new Date().toISOString();

      // MF_SAVE_WORKOUT_TO_HISTORY (auto-mapped to WorkoutRecord fields)
      const payload: any = {};
      payload["type"] = workoutType;
      payload["date"] = nowIso;
      payload["durationMinutes"] = durationMin;
      payload["caloriesBurned"] = calories;
      historyService.addWorkout(payload);
// gamification dispara automaticamente via HistoryService
      navigate("/progress");
    } catch (e) {
      console.error("MF handleFinish:", e);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="mx-auto max-w-xl space-y-4">
        <div className="rounded-2xl bg-neutral-900/60 border border-white/10 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-lg font-semibold">Treino Ao Vivo</div>
              <div className="text-xs text-white/60">GPS + métricas em tempo real • export GPX • salvar histórico</div>
            </div>
            <div className={`text-xs px-2 py-1 rounded-full ${isTracking ? "bg-green-500/20 text-green-300" : "bg-white/10 text-white/70"}`}>
              {isTracking ? "Ativo" : "Parado"}
            </div>
          </div>

          {error ? (
            <div className="mt-3 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-200">
              {String(error)}
            </div>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-white/60 text-xs">Distância</div>
              <div className="text-xl font-bold">{distanceKm.toFixed(2)} km</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-white/60 text-xs">Duração</div>
              <div className="text-xl font-bold">{Math.round(durationMin)} min</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-white/60 text-xs">Calorias</div>
              <div className="text-xl font-bold">{Math.round(calories)} kcal</div>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <div className="text-white/60 text-xs">Pace médio</div>
              <div className="text-xl font-bold">{avgPaceMinKm ? `${avgPaceMinKm.toFixed(2)} min/km` : "—"}</div>
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs text-white/60">Modalidade</label>
            <select
              className="mt-1 w-full rounded-xl bg-black/40 border border-white/10 p-3 text-sm"
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value as any)}
            >
              <option value="corrida">Corrida</option>
              <option value="ciclismo">Ciclismo</option>
              <option value="musculacao">Musculação</option>
              <option value="crossfit">CrossFit</option>
              <option value="funcional">Funcional</option>
            </select>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            {!isTracking ? (
              <button
                onClick={handleStart}
                className="w-full rounded-xl px-4 py-3 bg-blue-600/80 hover:bg-blue-600 text-white font-semibold"
              >
                Iniciar (GPS)
              </button>
            ) : (
              <button
                onClick={handleStop}
                className="w-full rounded-xl px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold"
              >
                Parar (GPS)
              </button>
            )}

            <button
              onClick={handleExport}
              className="w-full rounded-xl px-4 py-3 bg-white/10 hover:bg-white/15 text-white font-semibold"
            >
              Exportar GPX
            </button>

            <button
              onClick={handleFinish}
              className="w-full rounded-xl px-4 py-3 bg-green-600/80 hover:bg-green-600 text-white font-semibold"
            >
              Finalizar e Salvar
            </button>

            <button
              onClick={() => reset()}
              className="w-full rounded-xl px-4 py-3 bg-white/5 hover:bg-white/10 text-white/90 font-semibold"
            >
              Resetar métricas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
