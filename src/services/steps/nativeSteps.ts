import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";
import type { PassosDia } from "@/types";

export type NativeStepsSnapshot = {
  available: boolean;
  granted: boolean;
  steps: number;
  date: string;
  source: string;
  accurate?: boolean;
  distanceMeters?: number | null;
  message?: string;
};

type PermissionResult = {
  granted: boolean;
  status: string;
};

type StartResult = {
  started: boolean;
};

type StopResult = {
  stopped: boolean;
};

type AvailabilityResult = {
  available: boolean;
  source: string;
  platform: string;
};

type StepsPlugin = {
  isAvailable(): Promise<AvailabilityResult>;
  requestPermissions(): Promise<PermissionResult>;
  getTodaySteps(): Promise<NativeStepsSnapshot>;
  startUpdates(): Promise<StartResult>;
  stopUpdates(): Promise<StopResult>;
  addListener(
    eventName: "stepsUpdate",
    listenerFunc: (snapshot: NativeStepsSnapshot) => void,
  ): Promise<PluginListenerHandle>;
};

const Steps = registerPlugin<StepsPlugin>("Steps");

function isNativeRuntime() {
  return Capacitor.isNativePlatform();
}

function nowHHMM() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

export function toPassosDia(snapshot: NativeStepsSnapshot): PassosDia {
  const steps = Math.max(0, Math.floor(Number(snapshot.steps ?? 0)));
  const distanceKm =
    typeof snapshot.distanceMeters === "number" && Number.isFinite(snapshot.distanceMeters)
      ? Math.max(0, snapshot.distanceMeters / 1000)
      : Number((steps * 0.00075).toFixed(2));

  return {
    data: snapshot.date,
    passos: steps,
    horaInicio: "00:00",
    horaFim: nowHHMM(),
    distancia: distanceKm,
    calorias: Math.round(steps * 0.04),
  };
}

export function mergePassosDia(list: PassosDia[], next: PassosDia): PassosDia[] {
  const current = Array.isArray(list) ? list : [];
  const idx = current.findIndex((item) => item.data === next.data);

  if (idx === -1) {
    return [...current, next].sort((a, b) => a.data.localeCompare(b.data));
  }

  const prev = current[idx];
  const merged: PassosDia = {
    ...prev,
    ...next,
    passos: Math.max(Number(prev.passos ?? 0), Number(next.passos ?? 0)),
    distancia: Math.max(Number(prev.distancia ?? 0), Number(next.distancia ?? 0)),
    calorias: Math.max(Number(prev.calorias ?? 0), Number(next.calorias ?? 0)),
  };

  if (JSON.stringify(prev) === JSON.stringify(merged)) return current;

  const copy = [...current];
  copy[idx] = merged;
  return copy;
}

export async function startNativeStepsTracking(
  onSnapshot: (snapshot: NativeStepsSnapshot) => void,
): Promise<() => Promise<void>> {
  if (!isNativeRuntime()) {
    return async () => {};
  }

  try {
    const availability = await Steps.isAvailable();
    if (!availability.available) {
      return async () => {};
    }

    const permission = await Steps.requestPermissions();
    if (!permission.granted) {
      return async () => {};
    }

    const first = await Steps.getTodaySteps();
    if (first.available && first.granted) {
      onSnapshot(first);
    }

    const handle = await Steps.addListener("stepsUpdate", onSnapshot);
    await Steps.startUpdates();

    return async () => {
      try {
        await Steps.stopUpdates();
      } catch {}
      try {
        await handle.remove();
      } catch {}
    };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[steps] Nao foi possivel iniciar passos nativos.", error);
    }
    return async () => {};
  }
}
