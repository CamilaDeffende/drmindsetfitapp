import { useState } from "react";
import { useWearable } from "@/hooks/useWearable/useWearable";
import type { WearableDevice } from "@/services/wearables/WearableService";
import { HeartRateMonitor } from "@/components/wearables/HeartRateMonitor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Watch, Upload, Bluetooth, Trash2, AlertCircle } from "lucide-react";
import { historyService } from "@/services/history/HistoryService";

export function WearablesPage() {
  const {
    devices,
    currentHeartRate,
    syncStatus,
    isConnecting,
    error,
    isBluetoothSupported,
    connectBluetooth,
    disconnectBluetooth,
    removeDevice,
    importFile,
  } = useWearable();

  const [importing, setImporting] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const workout = await importFile(file);

      historyService.addWorkout({
        date: workout.startTime,
        type: workout.type === "running" ? "corrida" : "ciclismo",
        durationMinutes: Math.round(workout.durationSeconds / 60),
        distanceMeters: workout.distanceMeters,
        caloriesBurned: workout.caloriesBurned,
        averageHeartRate: workout.averageHeartRate,
        maxHeartRate: workout.maxHeartRate,
        gpsRoute: workout.gpsRoute,
      });

      alert("Treino importado com sucesso!");
      event.target.value = "";
    } catch (err) {
      console.error("Erro ao importar:", err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-purple-500/10 p-3 rounded-xl">
            <Watch className="w-10 h-10 text-purple-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-purple-400">Wearables</h1>
            <p className="text-gray-400">Conecte seus dispositivos e importe treinos</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-red-400 font-semibold">Erro</div>
              <div className="text-red-300 text-sm mt-1">{error}</div>
            </div>
          </div>
        )}

        {currentHeartRate && (
          <div className="mb-6">
            <HeartRateMonitor />
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bluetooth className="w-5 h-5" />
                Conectar via Bluetooth
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!isBluetoothSupported ? (
                <div className="text-gray-400 text-sm">
                  Web Bluetooth não é suportado neste navegador.
                  <br />
                  Recomendado: Chrome/Edge no desktop.
                </div>
              ) : (
                <>
                  <p className="text-gray-400 text-sm mb-4">
                    Conecte monitores de frequência cardíaca e dispositivos via Bluetooth.
                  </p>
                  {devices.filter((d: WearableDevice) => d.connected).length === 0 ? (
                    <Button
                      onClick={connectBluetooth}
                      disabled={isConnecting}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isConnecting ? "Conectando..." : "Conectar Dispositivo"}
                    </Button>
                  ) : (
                    <Button onClick={disconnectBluetooth} className="w-full bg-red-600 hover:bg-red-700">
                      Desconectar
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Importar Arquivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 text-sm mb-4">
                Importe treinos de arquivos GPX, TCX ou FIT exportados do seu wearable.
              </p>

              <label
                htmlFor="file-upload"
                className={`block w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white text-center rounded-lg cursor-pointer transition-colors ${
                  importing ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {importing ? "Importando..." : "Selecionar Arquivo"}
              </label>

              <input
                id="file-upload"
                type="file"
                accept=".gpx,.tcx,.fit"
                onChange={handleFileUpload}
                disabled={importing}
                className="hidden"
              />

              <div className="text-gray-500 text-xs mt-2 text-center">
                Formatos suportados: GPX, TCX, FIT
              </div>
            </CardContent>
          </Card>
        </div>

        {devices.length > 0 && (
          <Card className="bg-gray-900 border-gray-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Dispositivos Salvos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {devices.map((device: WearableDevice) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-xl border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <Watch className="w-5 h-5 text-purple-400" />
                      <div>
                        <div className="text-white font-semibold">{device.name}</div>
                        <div className="text-gray-400 text-sm">
                          {device.brand} • {device.type}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {device.connected && (
                        <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs rounded-full">
                          Conectado
                        </span>
                      )}
                      <button
                        onClick={() => removeDevice(device.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {syncStatus.lastSyncTime && (
          <Card className="bg-gray-900 border-gray-800 mt-6">
            <CardHeader>
              <CardTitle className="text-white">Última Sincronização</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-400">{syncStatus.workoutsSynced}</div>
                  <div className="text-gray-400 text-sm">Treinos</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400">{syncStatus.hrDataPoints}</div>
                  <div className="text-gray-400 text-sm">Dados de FC</div>
                </div>
                <div>
                  <div className="text-sm text-gray-300">
                    {new Date(syncStatus.lastSyncTime).toLocaleString("pt-BR")}
                  </div>
                  <div className="text-gray-400 text-xs">Data/Hora</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
