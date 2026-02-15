import { useMemo, useState } from "react";
import HeartRateMonitor from "@/components/wearables/HeartRateMonitor";
import WearableDeviceCard from "@/components/wearables/WearableDeviceCard";
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
  const { devices, connectHRM, refresh } = useWearable();
  const [msg, setMsg] = useState<string>("");

  const canConnect = useMemo(() => true, []);

  async function onConnect() {
    setMsg("");
    try {
      await connectHRM();
      setMsg("✅ Dispositivo conectado.");
    } catch (e: any) {
      setMsg("❌ " + String(e?.message || e));
    }
  }

  async function demoImportToHistory() {
    // demo seguro: gera 1 workout fictício e envia para HistoryService no contrato SSOT
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
      title: modality === "corrida" ? "Treino Wearable — Corrida" : "Treino Wearable — Ciclismo",
      durationMin: pickDurationMinutes(workout) ?? 0,
      distanceKm: typeof workout.distanceMeters === "number" ? workout.distanceMeters / 1000 : undefined,
      caloriesKcal: pickCalories(workout) ?? 0,
      pse: 6,
      avgHeartRate: workout.averageHeartRate,    });

    setMsg("✅ Import demo adicionado ao histórico.");
  }

  async function demoSyncProvider() {
    const ws = await wearableService.syncProvider("webbluetooth");
    setMsg(`ℹ️ Sync placeholder retornou ${ws.length} treino(s).`);
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-bold">Wearables</h1>
          <p className="text-zinc-400 text-sm">Conectar sensores, sincronizar e importar treinos para o histórico.</p>
        </div>
        <button
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm disabled:opacity-40"
          onClick={onConnect}
          disabled={!canConnect}
        >
          Conectar HRM
        </button>
      </div>

      {msg ? <div className="text-sm text-zinc-200 bg-white/5 border border-white/10 rounded-xl p-3">{msg}</div> : null}

      <HeartRateMonitor />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {devices.map((d) => (
          <WearableDeviceCard key={d.id} device={d} />
        ))}
      </div>

      <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-4">
        <div className="text-white font-semibold">Ações de Teste</div>
        <div className="text-zinc-400 text-sm">Sem dependências externas. Mantém BUILD verde.</div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm"
            onClick={() => refresh()}
          >
            Atualizar lista
          </button>
          <button
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm"
            onClick={demoImportToHistory}
          >
            Import demo → Histórico
          </button>
          <button
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm"
            onClick={demoSyncProvider}
          >
            Sync placeholder
          </button>
        </div>
      </div>
    </div>
  );
}
