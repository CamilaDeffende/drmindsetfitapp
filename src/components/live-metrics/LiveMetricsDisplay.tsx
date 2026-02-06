
import { formatPace, formatDistance, formatElevation } from "@/lib/format-utils";
import { GPSStats } from "@/services/gps/GPSService";

type Props = { stats: GPSStats; elapsedSeconds: number };

export function LiveMetricsDisplay({ stats, elapsedSeconds }: Props) {
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="grid grid-cols-2 gap-4 p-6 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl">
      <div className="col-span-2 text-center">
        <div className="text-6xl font-bold text-blue-400 tabular-nums">
          {formatTime(elapsedSeconds)}
        </div>
        <div className="text-sm text-gray-400 mt-1">Tempo Decorrido</div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="text-3xl font-bold text-white tabular-nums">
          {formatDistance(stats.distanceMeters)}
        </div>
        <div className="text-sm text-gray-400 mt-1">Distância</div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="text-3xl font-bold text-green-400 tabular-nums">
          {formatPace(stats.currentPaceMinPerKm)}
        </div>
        <div className="text-sm text-gray-400 mt-1">Pace Atual</div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="text-2xl font-bold text-white tabular-nums">
          {formatPace(stats.averagePaceMinPerKm)}
        </div>
        <div className="text-sm text-gray-400 mt-1">Pace Médio</div>
      </div>

      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="text-2xl font-bold text-white tabular-nums">
          {stats.currentSpeedKmh.toFixed(1)} <span className="text-base">km/h</span>
        </div>
        <div className="text-sm text-gray-400 mt-1">Velocidade</div>
      </div>

      <div className="col-span-2 bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="flex justify-around">
          <div>
            <div className="text-2xl font-bold text-green-400 tabular-nums">
              ↑ {formatElevation(stats.elevationGainMeters)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Ganho</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-400 tabular-nums">
              ↓ {formatElevation(stats.elevationLossMeters)}
            </div>
            <div className="text-xs text-gray-400 mt-1">Perda</div>
          </div>
        </div>
      </div>
    </div>
  );
}
