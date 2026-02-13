/**
 * MF_OFFLINE_HOOK_V2_COMPAT
 * Mantém isOnline/lastChangeAtIso e adiciona compat para páginas offline existentes.
 */
import { useEffect, useMemo, useState } from "react";

export type OfflineConflict = {
  id: string;
  title?: string;
  detail?: string;
  createdAtIso: string;
};

export type OfflineState = {
  isOnline: boolean;
  lastChangeAtIso: string;

  conflicts: OfflineConflict[];
  resolveConflict: (id: string, resolution: "local" | "remote" | "keep_local" | "keep_remote" | "merge") => void;
};

function nowIso() {
  return new Date().toISOString();
}

export function useOffline(): OfflineState {
  const initialOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  const [isOnline, setIsOnline] = useState<boolean>(initialOnline);
  const [lastChangeAtIso, setLastChangeAtIso] = useState<string>(nowIso());

  // Fallback safe: antes do SyncService real, não há conflitos.
  const [conflicts, setConflicts] = useState<OfflineConflict[]>([]);

  useEffect(() => {
    const on = () => {
      setIsOnline(true);
      setLastChangeAtIso(nowIso());
    };
    const off = () => {
      setIsOnline(false);
      setLastChangeAtIso(nowIso());
    };

    window.addEventListener("online", on);
    window.addEventListener("offline", off);

    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const resolveConflict: OfflineState["resolveConflict"] = (id, _resolution) => {
    setConflicts((arr) => arr.filter((c) => c.id !== id));
  };

  return useMemo(
    () => ({ isOnline, lastChangeAtIso, conflicts, resolveConflict }),
    [isOnline, lastChangeAtIso, conflicts]
  );
}
