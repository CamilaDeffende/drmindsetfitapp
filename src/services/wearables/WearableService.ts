/**
 * WearableService — integração com wearables
 * TS puro (sem dependência de backend)
 */
export type WearableDevice = {
  id: string;
  name: string;
  type: "watch" | "band" | "hrm" | "bike-computer";
  brand: "garmin" | "apple" | "samsung" | "polar" | "wahoo" | "generic";
  batteryLevel?: number;
  connected: boolean;
  lastSync?: string;
};

export type HeartRateData = {
  bpm: number;
  timestamp: number;
  zone: 1 | 2 | 3 | 4 | 5;
};

export type WorkoutData = {
  startTime: string;
  endTime: string;
  type: "running" | "cycling" | "swimming" | "strength" | "other";
  durationSeconds: number;
  distanceMeters?: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  caloriesBurned: number;
  averagePace?: number;
  elevationGain?: number;
  cadence?: number;
  power?: number;
  gpsRoute?: Array<{ lat: number; lon: number; alt?: number }>;
};

export type SyncStatus = {
  lastSyncTime: string | null;
  workoutsSynced: number;
  hrDataPoints: number;
  inProgress: boolean;
  error?: string;
};

class WearableService {
  private readonly STORAGE_KEY_DEVICES = "drmindsetfit:wearable-devices";
  private readonly STORAGE_KEY_SYNC = "drmindsetfit:wearable-sync-status";

  private heartRateCallbacks: Map<string, (hr: HeartRateData) => void> = new Map();
  private bluetoothDevice: BluetoothDevice | null = null;

  isBluetoothSupported(): boolean {
    return typeof navigator !== "undefined" && "bluetooth" in navigator;
  }

  async connectBluetooth(): Promise<WearableDevice> {
    if (!this.isBluetoothSupported()) {
      throw new Error("Web Bluetooth não é suportado neste navegador");
    }

    const device = await navigator.bluetooth!.requestDevice({
      filters: [{ services: ["heart_rate"] }, { services: [0x180d] }],
      optionalServices: ["battery_service", "device_information"],
    });

    this.bluetoothDevice = device;

    const server = await device.gatt?.connect();
    if (!server) throw new Error("Falha ao conectar ao servidor GATT");

    const newDevice: WearableDevice = {
      id: device.id,
      name: device.name || "Dispositivo Bluetooth",
      type: "hrm",
      brand: "generic",
      connected: true,
      lastSync: new Date().toISOString(),
    };

    this.saveDevice(newDevice);
    await this.startHeartRateMonitoring(server);

    this.updateSyncStatus({
      lastSyncTime: new Date().toISOString(),
      inProgress: false,
      error: undefined,
    });

    return newDevice;
  }

  private async startHeartRateMonitoring(server: BluetoothRemoteGATTServer): Promise<void> {
    try {
      const service = await server.getPrimaryService("heart_rate");
      const characteristic = await service.getCharacteristic("heart_rate_measurement");

      characteristic.addEventListener("characteristicvaluechanged", (event: Event) => {
        const target = event.target as BluetoothRemoteGATTCharacteristic;
        const value = target.value;
        if (!value) return;

        const flags = value.getUint8(0);
        const is16Bit = (flags & 0x01) !== 0;
        const bpm = is16Bit ? value.getUint16(1, true) : value.getUint8(1);

        const hr: HeartRateData = {
          bpm,
          timestamp: Date.now(),
          zone: this.calculateHRZone(bpm),
        };

        this.heartRateCallbacks.forEach((cb) => cb(hr));

        const st = this.getSyncStatus();
        this.updateSyncStatus({
          hrDataPoints: (st.hrDataPoints || 0) + 1,
          lastSyncTime: new Date().toISOString(),
        });
      });

      await characteristic.startNotifications();
    } catch (e) {
      console.error("Erro ao monitorar frequência cardíaca:", e);
    }
  }

  private calculateHRZone(bpm: number): 1 | 2 | 3 | 4 | 5 {
    const maxHR = 190;
    const pct = (bpm / maxHR) * 100;
    if (pct < 60) return 1;
    if (pct < 70) return 2;
    if (pct < 80) return 3;
    if (pct < 90) return 4;
    return 5;
  }

  onHeartRate(id: string, callback: (hr: HeartRateData) => void): void {
    this.heartRateCallbacks.set(id, callback);
  }

  offHeartRate(id: string): void {
    this.heartRateCallbacks.delete(id);
  }

  async disconnectBluetooth(): Promise<void> {
    if (this.bluetoothDevice?.gatt?.connected) {
      this.bluetoothDevice.gatt.disconnect();
    }
    this.bluetoothDevice = null;

    // marcar devices como desconectados
    const updated = this.getDevices().map((d) => ({ ...d, connected: false }));
    localStorage.setItem(this.STORAGE_KEY_DEVICES, JSON.stringify(updated));
  }

  private saveDevice(device: WearableDevice): void {
    const devices = this.getDevices();
    const i = devices.findIndex((d) => d.id === device.id);
    if (i >= 0) devices[i] = device;
    else devices.push(device);
    localStorage.setItem(this.STORAGE_KEY_DEVICES, JSON.stringify(devices));
  }

  getDevices(): WearableDevice[] {
    const raw = localStorage.getItem(this.STORAGE_KEY_DEVICES);
    return raw ? (JSON.parse(raw) as WearableDevice[]) : [];
  }

  removeDevice(deviceId: string): void {
    const devices = this.getDevices().filter((d) => d.id !== deviceId);
    localStorage.setItem(this.STORAGE_KEY_DEVICES, JSON.stringify(devices));
  }

  getSyncStatus(): SyncStatus {
    const raw = localStorage.getItem(this.STORAGE_KEY_SYNC);
    return raw
      ? (JSON.parse(raw) as SyncStatus)
      : { lastSyncTime: null, workoutsSynced: 0, hrDataPoints: 0, inProgress: false };
  }

  updateSyncStatus(status: Partial<SyncStatus>): void {
    const current = this.getSyncStatus();
    const updated: SyncStatus = { ...current, ...status };
    localStorage.setItem(this.STORAGE_KEY_SYNC, JSON.stringify(updated));
  }

  async syncExternalAPI(_provider: "strava" | "garmin"): Promise<WorkoutData[]> {
    throw new Error("Sincronização externa requer OAuth/API keys (placeholder).");
  }

  async importFile(file: File): Promise<WorkoutData> {
    const text = await file.text();
    const ext = file.name.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "gpx":
        return this.parseGPX(text);
      case "tcx":
        return this.parseTCX(text);
      case "fit":
        throw new Error("Formato FIT requer biblioteca especializada");
      default:
        throw new Error(`Formato não suportado: ${ext}`);
    }
  }

  private parseGPX(gpxText: string): WorkoutData {
    const parser = new DOMParser();
    const doc = parser.parseFromString(gpxText, "text/xml");
    const points = Array.from(doc.querySelectorAll("trkpt"));
    const gpsRoute: Array<{ lat: number; lon: number; alt?: number }> = [];

    let total = 0;
    points.forEach((pt, idx) => {
      const lat = parseFloat(pt.getAttribute("lat") || "0");
      const lon = parseFloat(pt.getAttribute("lon") || "0");
      const ele = pt.querySelector("ele")?.textContent;
      const alt = ele ? parseFloat(ele) : undefined;

      gpsRoute.push({ lat, lon, alt });

      if (idx > 0) {
        const prev = gpsRoute[idx - 1];
        total += this.haversineDistance(prev.lat, prev.lon, lat, lon);
      }
    });

    const startRaw = doc.querySelector("metadata time")?.textContent || null;
    const endRaw = doc.querySelector("trk trkseg trkpt:last-child time")?.textContent || null;

    const startTime = startRaw ? new Date(startRaw).toISOString() : new Date().toISOString();
    const endTime = endRaw ? new Date(endRaw).toISOString() : new Date().toISOString();
    const durationSeconds = Math.max(
      0,
      Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000)
    );

    return {
      startTime,
      endTime,
      type: "running",
      durationSeconds,
      distanceMeters: Math.round(total),
      caloriesBurned: Math.round((total / 1000) * 65),
      gpsRoute,
    };
  }

  private parseTCX(_tcxText: string): WorkoutData {
    throw new Error("Parser TCX não implementado (placeholder).");
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const dφ = ((lat2 - lat1) * Math.PI) / 180;
    const dλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dφ / 2) * Math.sin(dφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) * Math.sin(dλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const wearableService = new WearableService();
