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
