import { useEffect, useMemo, useState } from "react";
import type { SubscriptionPlan, SubscriptionStatus } from "./types";
import { readSubscription, writeSubscription, clearSubscription, isActiveSubscription } from "./storage";

export function useSubscription() {
  const [sub, setSub] = useState<SubscriptionStatus | null>(() => {
    try { return readSubscription(); } catch { return null; }
  });

  const active = useMemo(() => isActiveSubscription(sub), [sub]);

  useEffect(() => {
    // sync cross-tabs
    const onStorage = (e: StorageEvent) => {
      if (!e) return;
      // não importamos SUBSCRIPTION_KEY aqui para evitar circular; comparação por leitura é suficiente
      setSub(readSubscription());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const activate = (plan: SubscriptionPlan) => {
    const next = writeSubscription(plan);
    setSub(next);
  };

  const deactivate = () => {
    clearSubscription();
    setSub(null);
  };

  const refresh = () => setSub(readSubscription());

  return { sub, active, activate, deactivate, refresh };
}
