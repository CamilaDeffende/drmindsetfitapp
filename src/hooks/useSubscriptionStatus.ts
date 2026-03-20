import * as React from "react";
import { readSubscription, isActiveSubscription } from "@/lib/subscription/storage";

export function useSubscriptionStatus() {
  const [loading, setLoading] = React.useState(true);
  const [status, setStatus] = React.useState(() => {
    const sub = readSubscription();
    return {
      isPremium: isActiveSubscription(sub),
      source: "local-subscription",
      checkedAtIso: new Date().toISOString(),
      plan: sub.plan,
      active: sub.active,
    };
  });

  const refresh = React.useCallback(async () => {
    setLoading(true);
    const sub = readSubscription();

    setStatus({
      isPremium: isActiveSubscription(sub),
      source: "local-subscription",
      checkedAtIso: new Date().toISOString(),
      plan: sub.plan,
      active: sub.active,
    });

    setLoading(false);
  }, []);

  React.useEffect(() => {
    void refresh();

    const onStorage = () => {
      void refresh();
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  return { status, loading, refresh };
}