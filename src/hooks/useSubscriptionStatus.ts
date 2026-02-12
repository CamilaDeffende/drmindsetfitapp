import * as React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { subscriptionService, type SubscriptionStatus } from "@/services/subscription/SubscriptionService";

export function useSubscriptionStatus() {
  const { user } = useAuth() as any; // keep compat with your current AuthContext typing
  const userId: string | null = user?.id ?? null;

  const [status, setStatus] = React.useState<SubscriptionStatus>({
    isPremium: false,
    source: "none",
    checkedAtIso: new Date().toISOString(),
  });
  const [loading, setLoading] = React.useState<boolean>(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    const s = await subscriptionService.getStatus(userId);
    setStatus(s);
    setLoading(false);
  }, [userId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return { status, loading, refresh };
}
