import { useState, useEffect, useCallback } from "react";
import {
  wearableService,
  WearableDevice,
  HeartRateData,
  SyncStatus,
} from "@/services/wearables/WearableService";

export function useWearable() {
  const [devices, setDevices] = useState<WearableDevice[]>([]);
  const [currentHeartRate, setCurrentHeartRate] = useState<HeartRateData | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(wearableService.getSyncStatus());
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadDevices = () => setDevices(wearableService.getDevices());

  useEffect(() => {
    loadDevices();
    const id = `wearable-hook-${Date.now()}`;
    wearableService.onHeartRate(id, (hr: HeartRateData) => setCurrentHeartRate(hr));
    return () => wearableService.offHeartRate(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectBluetooth = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const device = await wearableService.connectBluetooth();
      setDevices((prev) => [...prev.filter((d) => d.id !== device.id), device]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao conectar dispositivo");
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnectBluetooth = useCallback(async () => {
    await wearableService.disconnectBluetooth();
    setCurrentHeartRate(null);
    loadDevices();
  }, []);

  const removeDevice = useCallback((deviceId: string) => {
    wearableService.removeDevice(deviceId);
    loadDevices();
  }, []);

  const importFile = useCallback(async (file: File) => {
    const workout = await wearableService.importFile(file);
    return workout;
  }, []);

  const refreshSyncStatus = useCallback(() => {
    setSyncStatus(wearableService.getSyncStatus());
  }, []);

  return {
    devices,
    currentHeartRate,
    syncStatus,
    isConnecting,
    error,
    isBluetoothSupported: wearableService.isBluetoothSupported(),
    connectBluetooth,
    disconnectBluetooth,
    removeDevice,
    importFile,
    refreshSyncStatus,
  };
}
