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

    const devPremium = (() => {
      try {
        const rawFlags = localStorage.getItem("mindsetfit:featureFlags");
        const flags = rawFlags ? JSON.parse(rawFlags) : null;
        return Boolean(flags?.premiumUnlocked);
      } catch {
        return false;
      }
    })();

    return subscribed || activeSub || devPremium;
  } catch {
    return false;
  }
}

export function ProtectedRoute({ children, requiresPremium = false }: ProtectedRouteProps) {
  const loc = useLocation();
  const auth = useAuth() as any;

  const authLoading = Boolean(auth?.loading ?? auth?.isLoading ?? false);
  const user = auth?.user ?? null;

  const { status, loading: subLoading } = useSubscriptionStatus();

  // fallback local para evitar loop no premium/dev
  const localPremium = readLocalPremiumFlag();
  const isPremium = Boolean(status?.isPremium) || localPremium;

  if (authLoading || (requiresPremium && subLoading && !localPremium)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm opacity-70">Carregando...</div>
      </div>
    );
  }

  // sem login -> login
  if (!user) {
    return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }

  // rota premium sem premium -> assinatura
  if (requiresPremium && !isPremium) {
    return <Navigate to={`/assinatura?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }

  return <>{children}</>;
}