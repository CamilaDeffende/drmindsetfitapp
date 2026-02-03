import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import type { Units } from "@/types/profile";

type AppContextValue = {
  // auth
  userId: string | null;
  // profile
  profileReady: boolean;
  profile: ReturnType<typeof useProfile>["profile"];
  // global preferences derived from profile
  timezone: string;
  locale: string;
  units: Units;
  // one flag to rule them all
  appReady: boolean;
};

const AppContext = createContext<AppContextValue | null>(null);

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider />");
  return ctx;
}

type Props = { children: React.ReactNode };

export function AppProvider({ children }: Props) {
  const auth = useAuth() as any;
  const { profile, profileReady } = useProfile();

  // userId real (já conectado no main → ProfileProvider)
  const userId: string | null =
    auth?.user?.id ?? auth?.session?.user?.id ?? null;

  // defaults premium (nunca quebra UI)
  const timezone = profile?.timezone || "America/Sao_Paulo";
  const locale = profile?.locale || "pt-BR";
  const units = profile?.units || { weight: "kg", distance: "km" };

  const appReady = !!userId && profileReady;

  const value = useMemo<AppContextValue>(
    () => ({ userId, profileReady, profile, timezone, locale, units, appReady }),
    [userId, profileReady, profile, timezone, locale, units, appReady]
  );

  // Gate premium: evita UI inconsistente (flash)
  // MF_APPCTX_NO_NULL_V1: nunca retornar null (evita root vazio).
// Sem userId ainda? Mantém UI viva (Splash) até auth resolver.
if (!userId) {
  // mantém UX premium e evita tela preta
  return (<>{children}</>);
}
// Auth decide redirect/rota
  if (!profileReady) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="opacity-80 text-sm">Preparando seu ambiente…</div>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
