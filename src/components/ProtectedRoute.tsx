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

  // Se não estiver logado, manda para login e preserva a rota desejada
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />;

  // Se precisa premium e não tem, manda para Assinatura (paywall real) e preserva rota desejada
  if (requiresPremium && !status.isPremium) {
    return <Navigate to={`/assinatura?next=${encodeURIComponent(loc.pathname)}`} replace />;
  }

  return <>{children}</>;
}