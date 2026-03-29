import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, ArrowLeft, RefreshCw, Watch } from "lucide-react";
import HeartRateMonitor from "@/components/wearables/HeartRateMonitor";
import WearableDeviceCard from "@/components/wearables/WearableDeviceCard";
import { BrandIcon } from "@/components/branding/BrandIcon";
import { getHomeRoute } from "@/lib/subscription/premium";
import { Button } from "@/components/ui/button";
import { useWearable } from "@/hooks/useWearable/useWearable";
import { historyService, WorkoutType } from "@/services/history/HistoryService";
import { wearableService, WorkoutData } from "@/services/wearables/WearableService";

function mapTypeToWorkoutType(t: WorkoutData["type"]): WorkoutType {
  switch (t) {
    case "running":
      return "corrida";
    case "cycling":
      return "ciclismo";
    case "strength":
      return "musculacao";
    default:
      return "outro";
  }
}

function pickDurationMinutes(w: WorkoutData): number | undefined {
  if (typeof w.durationMinutes === "number") return w.durationMinutes;
  if (typeof w.durationMin === "number") return w.durationMin;
  if (typeof w.durationSec === "number") return Math.round(w.durationSec / 60);
  return undefined;
}

function pickCalories(w: WorkoutData): number | undefined {
  if (typeof w.caloriesBurned === "number") return w.caloriesBurned;
  if (typeof w.caloriesKcal === "number") return w.caloriesKcal;
  return undefined;
}

export default function WearablesPage() {
  const navigate = useNavigate();
  const { devices, connectHRM, refresh } = useWearable();
  const [msg, setMsg] = useState("");

  const canConnect = useMemo(() => true, []);

  async function onConnect() {
    setMsg("");
    try {
      await connectHRM();
      setMsg("Dispositivo conectado com sucesso.");
    } catch (e: any) {
      setMsg(String(e?.message || e || "Não foi possível conectar o dispositivo."));
    }
  }

  async function demoImportToHistory() {
    const workout: WorkoutData = {
      startTime: new Date().toISOString(),
      type: "running",
      durationMinutes: 32,
      distanceMeters: 5200,
      caloriesBurned: 410,
      averageHeartRate: 152,
      maxHeartRate: 173,
    };

    const modality = mapTypeToWorkoutType(workout.type);

    historyService.addWorkout({
      id: "wearable-" + Math.random().toString(16).slice(2),
      dateIso: workout.startTime,
      modality,
      type: modality,
      title: modality === "corrida" ? "Treino wearable - corrida" : "Treino wearable - ciclismo",
      durationMin: pickDurationMinutes(workout) ?? 0,
      distanceKm: typeof workout.distanceMeters === "number" ? workout.distanceMeters / 1000 : undefined,
      caloriesKcal: pickCalories(workout) ?? 0,
      pse: 6,
      avgHeartRate: workout.averageHeartRate,
    });

    setMsg("Treino demo importado para o histórico.");
  }

  async function demoSyncProvider() {
    const synced = await wearableService.syncProvider("webbluetooth");
    setMsg(`Sync placeholder retornou ${synced.length} treino(s).`);
  }

  return (
    <div className="min-h-screen mf-app-bg mf-bg-neon text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(getHomeRoute())}
              className="mt-1 shrink-0 hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <BrandIcon size={56} className="drop-shadow-[0_0_16px_rgba(0,190,255,0.28)]" />
            <div>
              <div className="text-[24px] font-semibold tracking-tight">Wearables</div>
              <div className="mt-1 text-sm text-white/58">
                Sensores, batimentos e sincronização de treinos com o app.
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onConnect}
              disabled={!canConnect}
              className="overflow-hidden rounded-[18px] bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-white hover:bg-transparent disabled:opacity-50"
            >
              <Watch className="mr-2 h-4 w-4" />
              Conectar HRM
            </Button>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 shadow-[0_0_32px_rgba(0,149,255,0.05)]">
          <div className="flex items-center gap-2 text-cyan-300">
            <Activity className="h-4 w-4" />
            <span className="text-[12px] uppercase tracking-[0.22em]">Integração local</span>
          </div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/68">
            Esta área permite testar a conexão de sensores e importar treinos para o histórico
            sem depender de serviços externos durante o desenvolvimento.
          </p>
        </div>

        {msg ? (
          <div className="mt-6 rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
            {msg}
          </div>
        ) : null}

        <div className="mt-6">
          <HeartRateMonitor />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
          {devices.length > 0 ? (
            devices.map((device) => <WearableDeviceCard key={device.id} device={device} />)
          ) : (
            <div className="rounded-[20px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 text-sm text-white/58 md:col-span-2">
              Nenhum dispositivo listado ainda. Use a conexão de HRM ou atualize a lista.
            </div>
          )}
        </div>

        <div className="mt-6 rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 shadow-[0_0_32px_rgba(0,149,255,0.05)]">
          <div className="text-lg font-semibold text-white">Ações de teste</div>
          <div className="mt-1 text-sm text-white/55">
            Fluxos seguros para validar integração e histórico durante o desenvolvimento.
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => refresh()}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar lista
            </Button>

            <Button
              variant="outline"
              onClick={demoImportToHistory}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Import demo {"->"} Histórico
            </Button>

            <Button
              variant="outline"
              onClick={demoSyncProvider}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              Sync placeholder
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
