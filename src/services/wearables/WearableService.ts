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
