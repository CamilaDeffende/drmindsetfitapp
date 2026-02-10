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
