import { useWearable } from "@/hooks/useWearable/useWearable";
import { Heart, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function HeartRateMonitor() {
  const { currentHeartRate } = useWearable();

  const zoneClass = (zone: number) => {
    switch (zone) {
      case 1:
        return "text-gray-400 bg-gray-500/10";
      case 2:
        return "text-blue-400 bg-blue-500/10";
      case 3:
        return "text-green-400 bg-green-500/10";
      case 4:
        return "text-orange-400 bg-orange-500/10";
      case 5:
        return "text-red-400 bg-red-500/10";
      default:
        return "text-gray-400 bg-gray-500/10";
    }
  };

  const zoneName = (zone: number) => {
    switch (zone) {
      case 1:
        return "Recuperação";
      case 2:
        return "Aeróbico Leve";
      case 3:
        return "Aeróbico";
      case 4:
        return "Limiar";
      case 5:
        return "Máximo";
      default:
        return "Desconhecido";
    }
  };

  if (!currentHeartRate) {
    return (
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="p-6 text-center">
          <Activity className="w-12 h-12 text-gray-600 mx-auto mb-3 animate-pulse" />
          <p className="text-gray-400">Aguardando dados de frequência cardíaca...</p>
          <p className="text-gray-500 text-sm mt-1">Conecte um dispositivo Bluetooth</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-400 animate-pulse" />
            <span className="text-gray-400 text-sm">Frequência Cardíaca</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${zoneClass(currentHeartRate.zone)}`}>
            Zona {currentHeartRate.zone}
          </div>
        </div>

        <div className="text-center mb-4">
          <div className="text-6xl font-bold text-red-400 tabular-nums">{currentHeartRate.bpm}</div>
          <div className="text-gray-400 text-sm mt-1">bpm</div>
        </div>

        <div className="text-center text-gray-300 text-sm">{zoneName(currentHeartRate.zone)}</div>

        <div className="mt-6 flex gap-1">
          {[1, 2, 3, 4, 5].map((z) => (
            <div
              key={z}
              className={`flex-1 h-2 rounded ${
                z === currentHeartRate.zone ? zoneClass(z).split(" ")[1] : "bg-gray-700"
              } transition-all`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
