import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPremium?: boolean;
}

function readLocalPremiumFlag(): boolean {
  try {
    const subscribed = localStorage.getItem("mindsetfit:isSubscribed") === "true";

    const rawSub = localStorage.getItem("mindsetfit:subscription:v1");
    const parsedSub = rawSub ? JSON.parse(rawSub) : null;

    const activeSub = Boolean(parsedSub?.active);
    const kind = String(parsedSub?.kind ?? "");
    const trialEndsAt = Number(parsedSub?.trialEndsAt ?? 0);

    const trialActive =
      kind === "trial" &&
      activeSub &&
      Number.isFinite(trialEndsAt) &&
      trialEndsAt > Date.now();

    const paidActive =
      kind !== "trial" &&
      activeSub;

    const devPremium = (() => {
      try {
        const rawFlags = localStorage.getItem("mindsetfit:featureFlags");
        const flags = rawFlags ? JSON.parse(rawFlags) : null;
        return Boolean(flags?.premiumUnlocked);
      } catch {
        return false;
      }
    })();

    return subscribed || paidActive || trialActive || devPremium;
  } catch {
    return false;
  }
}

export function ProtectedRoute({
  children,
  requiresPremium = false,
}: ProtectedRouteProps) {
  const loc = useLocation();
  const auth = useAuth() as any;

  const authLoading = Boolean(auth?.loading ?? auth?.isLoading ?? false);
  const user = auth?.user ?? null;

  const { status, loading: subLoading } = useSubscriptionStatus();

  const localPremium = readLocalPremiumFlag();
  const isPremium = Boolean(status?.isPremium) || localPremium;

  if (authLoading || (requiresPremium && subLoading && !localPremium)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm opacity-70">Carregando...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }

  if (requiresPremium && !isPremium) {
    return (
      <Navigate
        to={`/assinatura?source=dashboard-free&next=${encodeURIComponent(loc.pathname)}`}
        replace
      />
    );
  }

  return <>{children}</>;
}