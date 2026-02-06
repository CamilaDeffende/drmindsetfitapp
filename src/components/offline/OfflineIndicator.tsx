import { useOffline } from "@/hooks/useOffline/useOffline";
import { Wifi, WifiOff, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function OfflineIndicator() {
  const { isOnline, isSyncing, queueStats, conflicts, syncNow } = useOffline();

  if (isOnline && queueStats.pending === 0 && conflicts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`rounded-xl p-4 shadow-2xl border ${
          isOnline
            ? "bg-gray-900 border-gray-800"
            : "bg-yellow-500/10 border-yellow-500/30"
        }`}
      >
        <div className="flex items-center gap-3">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-green-400" />
          ) : (
            <WifiOff className="w-5 h-5 text-yellow-400 animate-pulse" />
          )}

          <div className="flex-1 min-w-0">
            <div className="text-white font-semibold text-sm">
              {isOnline ? "Online" : "Modo Offline"}
            </div>

            {queueStats.pending > 0 && (
              <div className="text-gray-400 text-xs mt-1">
                {queueStats.pending} {queueStats.pending === 1 ? "item" : "itens"} pendente
                {queueStats.pending > 1 ? "s" : ""}
              </div>
            )}

            {conflicts.length > 0 && (
              <div className="flex items-center gap-1 text-orange-400 text-xs mt-1">
                <AlertCircle className="w-3 h-3" />
                {conflicts.length} conflito{conflicts.length > 1 ? "s" : ""}
              </div>
            )}
          </div>

          {isOnline && queueStats.pending > 0 && (
            <Button
              size="sm"
              onClick={syncNow}
              disabled={isSyncing}
              className="bg-blue-600 hover:bg-blue-700 h-8"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Sincronizando..." : "Sincronizar"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
