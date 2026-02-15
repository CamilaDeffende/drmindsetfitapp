import * as React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPremium?: boolean;
}

export function ProtectedRoute({ children, requiresPremium = false }: ProtectedRouteProps) {
  const loc = useLocation();
  const auth = useAuth() as any;

  // compat: some versions use auth.loading, others use auth.isLoading
  const authLoading = Boolean(auth?.loading ?? auth?.isLoading ?? false);
  const user = auth?.user ?? null;

  const { status, loading: subLoading } = useSubscriptionStatus();

  if (authLoading || (requiresPremium && subLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm opacity-70">Carregando...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;

  if (requiresPremium && !status.isPremium) {
    return <Navigate to="/pricing" replace state={{ from: loc.pathname }} />;
  }

  return <>{children}</>;
}
