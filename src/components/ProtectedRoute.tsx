import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { readSubscription, isActiveSubscription } from "@/lib/subscription/storage";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPremium?: boolean;
}

export function ProtectedRoute({
  children,
  requiresPremium = false,
}: ProtectedRouteProps) {
  const loc = useLocation();
  const auth = useAuth() as any;

  const authLoading = Boolean(auth?.loading ?? auth?.isLoading ?? false);
  const user = auth?.user ?? null;

  const [isPremium, setIsPremium] = React.useState(false);
  const [subLoading, setSubLoading] = React.useState(true);

  React.useEffect(() => {
    const refreshPremium = () => {
      try {
        const sub = readSubscription();
        setIsPremium(isActiveSubscription(sub));
      } catch {
        setIsPremium(false);
      } finally {
        setSubLoading(false);
      }
    };

    refreshPremium();

    const onStorage = () => {
      refreshPremium();
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (authLoading || (requiresPremium && subLoading)) {
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