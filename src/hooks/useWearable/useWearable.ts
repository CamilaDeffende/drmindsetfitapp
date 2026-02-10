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
