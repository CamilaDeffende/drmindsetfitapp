import { useState, useEffect, useCallback } from "react";
import { syncService } from "@/services/offline/SyncService";

export function useOffline() {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [queueStats, setQueueStats] = useState(syncService.getQueueStats());
  const [conflicts, setConflicts] = useState(syncService.getConflicts());

  const refresh = useCallback(() => {
    setQueueStats(syncService.getQueueStats());
    setConflicts(syncService.getConflicts());
  }, []);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await syncService.startSync();
      refresh();
      return res;
    } finally {
      setIsSyncing(false);
    }
  }, [refresh]);

  useEffect(() => {
    const onOnline = async () => {
      setIsOnline(true);
      await handleSync();
    };
    const onOffline = () => setIsOnline(false);

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    // best effort: background sync (se suportado)
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      }

        // Background Sync (best effort) — sem depender de tipos TS
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          const anyReg = reg as unknown as { sync?: { register: (tag: string) => Promise<void> } };
          return anyReg.sync?.register ? anyReg.sync.register("sync-workouts") : Promise.resolve();
        })
        .catch(() => {});
    }

return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [handleSync]);

  const resolveConflict = useCallback(
    (conflictId: string, resolution: "local" | "remote" | "merge") => {
      syncService.resolveConflict(conflictId, resolution);
      refresh();
    },
    [refresh]
  );

  const clearSyncedItems = useCallback(() => {
    syncService.clearSyncedItems();
    refresh();
  }, [refresh]);

  return {
    isOnline,
    isSyncing,
    queueStats,
    conflicts,
    syncNow: handleSync,
    resolveConflict,
    clearSyncedItems,
  };
}
