#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1

echo "==> Phase 10 | Wearables (HRM Web Bluetooth + imports + SSOT History) [idempotent]"

# -------------------------------------------------------------------
# A) Pastas
# -------------------------------------------------------------------
mkdir -p src/services/wearables
mkdir -p src/hooks/useWearable
mkdir -p src/components/wearables
mkdir -p src/pages/wearables

# -------------------------------------------------------------------
# B) WearableService.ts (HRM via Web Bluetooth + parsers placeholders)
# -------------------------------------------------------------------
cat > src/services/wearables/WearableService.ts <<'TS'
export type WearableProvider = "webbluetooth" | "strava" | "garmin" | "apple_health" | "google_fit";

export type WearableDevice = {
  id: string;
  name: string;
  provider: WearableProvider;
  connected: boolean;
  lastSyncIso?: string;
};

export type WorkoutData = {
  startTime: string; // ISO
  type: "running" | "cycling" | "strength" | "swimming" | "other";
  durationMinutes?: number;
  durationMin?: number; // compat
  durationSec?: number; // compat
  distanceMeters?: number;
  caloriesBurned?: number;
  caloriesKcal?: number; // compat
  averageHeartRate?: number;
  maxHeartRate?: number;
  gpsRoute?: { lat: number; lon: number; ts?: string }[];
};

const LS_KEY = "mf:wearables:v1";

function nowIso() {
  return new Date().toISOString();
}

function loadState(): { devices: WearableDevice[] } {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return { devices: [] };
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object") return { devices: [] };
    if (!Array.isArray(v.devices)) return { devices: [] };
    return { devices: v.devices as WearableDevice[] };
  } catch {
    return { devices: [] };
  }
}

function saveState(st: { devices: WearableDevice[] }) {
  localStorage.setItem(LS_KEY, JSON.stringify(st));
}

export class WearableService {
  getDevices(): WearableDevice[] {
    return loadState().devices;
  }

  upsertDevice(dev: WearableDevice) {
    const st = loadState();
    const idx = st.devices.findIndex((d) => d.id === dev.id);
    if (idx >= 0) st.devices[idx] = dev;
    else st.devices.push(dev);
    saveState(st);
  }

  disconnect(id: string) {
    const st = loadState();
    const d = st.devices.find((x) => x.id === id);
    if (d) {
      d.connected = false;
      saveState(st);
    }
  }

  // -------------------------------
  // Web Bluetooth Heart Rate (HRM)
  // -------------------------------
  async connectWebBluetoothHRM(): Promise<WearableDevice> {
    if (typeof navigator === "undefined" || !(navigator as any).bluetooth) {
      throw new Error("Web Bluetooth não disponível neste navegador/dispositivo.");
    }

    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [{ services: ["heart_rate"] }],
    });

    const dev: WearableDevice = {
      id: String(device?.id || "hrm-" + Math.random().toString(16).slice(2)),
      name: String(device?.name || "HRM"),
      provider: "webbluetooth",
      connected: true,
      lastSyncIso: nowIso(),
    };

    this.upsertDevice(dev);
    return dev;
  }

  // Retorna um "stream handler" simples para batimento (callback)
  async startHeartRateStream(onHR: (hr: number) => void): Promise<() => void> {
    if (typeof navigator === "undefined" || !(navigator as any).bluetooth) {
      throw new Error("Web Bluetooth não disponível.");
    }

    const device = await (navigator as any).bluetooth.requestDevice({
      filters: [{ services: ["heart_rate"] }],
    });

    const server = await device.gatt.connect();
    const svc = await server.getPrimaryService("heart_rate");
    const ch = await svc.getCharacteristic("heart_rate_measurement");

    const handler = (ev: any) => {
      try {
        const v: DataView = ev?.target?.value;
        if (!v) return;
        const flags = v.getUint8(0);
        const isUint16 = (flags & 0x1) === 0x1;
        const hr = isUint16 ? v.getUint16(1, true) : v.getUint8(1);
        if (typeof hr === "number" && hr > 0) onHR(hr);
      } catch {
        // ignore
      }
    };

    await ch.startNotifications();
    ch.addEventListener("characteristicvaluechanged", handler);

    return () => {
      try {
        ch.removeEventListener("characteristicvaluechanged", handler);
        ch.stopNotifications().catch(() => {});
        device.gatt?.disconnect?.();
      } catch {
        // ignore
      }
    };
  }

  // -------------------------------
  // Importadores (placeholders)
  // -------------------------------
  async importGPX(_text: string): Promise<WorkoutData[]> {
    // Placeholder seguro: retorna vazio sem quebrar
    return [];
  }

  async importTCX(_text: string): Promise<WorkoutData[]> {
    return [];
  }

  async importFIT(_bytes: ArrayBuffer): Promise<WorkoutData[]> {
    return [];
  }

  // -------------------------------
  // Conectores futuros (placeholders)
  // -------------------------------
  async connectProvider(_provider: Exclude<WearableProvider, "webbluetooth">): Promise<void> {
    // Placeholder: no-op
  }

  async syncProvider(_provider: WearableProvider): Promise<WorkoutData[]> {
    // Placeholder: no-op
    return [];
  }
}

export const wearableService = new WearableService();
TS

# -------------------------------------------------------------------
# C) Hook useWearable
# -------------------------------------------------------------------
cat > src/hooks/useWearable/useWearable.ts <<'TS'
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { wearableService, WearableDevice } from "@/services/wearables/WearableService";

export function useWearable() {
  const [devices, setDevices] = useState<WearableDevice[]>(() => wearableService.getDevices());
  const stopRef = useRef<null | (() => void)>(null);
  const [hr, setHr] = useState<number | null>(null);
  const [streaming, setStreaming] = useState(false);

  const refresh = useCallback(() => {
    setDevices(wearableService.getDevices());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const connectHRM = useCallback(async () => {
    const dev = await wearableService.connectWebBluetoothHRM();
    refresh();
    return dev;
  }, [refresh]);

  const startHR = useCallback(async () => {
    if (stopRef.current) stopRef.current();
    setStreaming(true);
    const stop = await wearableService.startHeartRateStream((x) => setHr(x));
    stopRef.current = stop;
  }, []);

  const stopHR = useCallback(() => {
    if (stopRef.current) stopRef.current();
    stopRef.current = null;
    setStreaming(false);
  }, []);

  const hasBluetooth = useMemo(() => {
    return typeof navigator !== "undefined" && !!(navigator as any).bluetooth;
  }, []);

  return {
    devices,
    hr,
    streaming,
    hasBluetooth,
    refresh,
    connectHRM,
    startHR,
    stopHR,
  };
}
TS

# -------------------------------------------------------------------
# D) Componentes (simples e premium-safe)
# -------------------------------------------------------------------
cat > src/components/wearables/HeartRateMonitor.tsx <<'TSX'
import { useWearable } from "@/hooks/useWearable/useWearable";

export default function HeartRateMonitor() {
  const { hr, streaming, hasBluetooth, startHR, stopHR } = useWearable();

  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-white font-semibold">Monitor de FC (Web Bluetooth)</div>
          <div className="text-zinc-300 text-sm">
            {hasBluetooth ? "Pronto para conectar" : "Web Bluetooth indisponível neste ambiente"}
          </div>
        </div>

        <div className="text-right">
          <div className="text-zinc-400 text-xs">FC</div>
          <div className="text-white text-2xl font-bold tabular-nums">{hr ?? "--"}</div>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm disabled:opacity-40"
          onClick={startHR}
          disabled={!hasBluetooth || streaming}
        >
          Iniciar
        </button>
        <button
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm disabled:opacity-40"
          onClick={stopHR}
          disabled={!streaming}
        >
          Parar
        </button>
      </div>
    </div>
  );
}
TSX

cat > src/components/wearables/WearableDeviceCard.tsx <<'TSX'
import { WearableDevice } from "@/services/wearables/WearableService";

export default function WearableDeviceCard({ device }: { device: WearableDevice }) {
  return (
    <div className="rounded-2xl bg-zinc-900/60 border border-white/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-semibold">{device.name}</div>
          <div className="text-zinc-400 text-sm">Provider: {device.provider}</div>
        </div>
        <div className="text-sm">
          <span className={device.connected ? "text-emerald-300" : "text-zinc-400"}>
            {device.connected ? "Conectado" : "Desconectado"}
          </span>
        </div>
      </div>

      {device.lastSyncIso ? (
        <div className="mt-2 text-zinc-500 text-xs">Último sync: {device.lastSyncIso}</div>
      ) : null}
    </div>
  );
}
TSX

# -------------------------------------------------------------------
# E) Página Wearables (integra HistoryService com payload SSOT)
# -------------------------------------------------------------------
cat > src/pages/wearables/WearablesPage.tsx <<'TSX'
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
      return "corrida";
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
      avgHeartRate: workout.averageHeartRate,
      maxHeartRate: workout.maxHeartRate,
      gpsRoute: workout.gpsRoute,
    } as any);

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
TSX

# -------------------------------------------------------------------
# F) Route /wearables em App.tsx (idempotente)
# -------------------------------------------------------------------
python3 - <<'PY'
from pathlib import Path
import re

f = Path("src/App.tsx")
s = f.read_text(encoding="utf-8")

# import default
if 'from "@/pages/wearables/WearablesPage"' not in s:
  lines = s.splitlines(True)
  last_import = 0
  for i, ln in enumerate(lines):
    if re.match(r'^\s*import\b', ln):
      last_import = i
  lines.insert(last_import+1, 'import WearablesPage from "@/pages/wearables/WearablesPage";\n')
  s = "".join(lines)

# route
if 'path="/wearables"' not in s:
  if "</Routes>" in s:
    s = s.replace("</Routes>", '  <Route path="/wearables" element={<WearablesPage />} />\n</Routes>', 1)
  else:
    note = '\n/* MF_NOTE: add route: <Route path="/wearables" element={<WearablesPage />} /> */\n'
    if "MF_NOTE: add route" not in s:
      s += note

f.write_text(s, encoding="utf-8")
print("OK: patched /wearables route in src/App.tsx")
PY

echo "==> typecheck + verify"
npx tsc --noEmit
npm run -s verify

git add -A
git commit -m "feat: phase 10 wearables (service + hook + UI + route) [idempotent]" || true

echo "✅ OK | Phase 10 done"