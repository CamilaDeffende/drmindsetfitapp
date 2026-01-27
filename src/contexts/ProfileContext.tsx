import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Profile } from "@/types/profile";
import { loadProfile, saveProfile, getDefaultProfile } from "@/services/profile.service";

/**
 * Phase 1.2 — ProfileContext (separado do Auth)
 *
 * Contrato:
 * - Auth ≠ Profile
 * - Perfil carrega 1x por sessão (cache em memória)
 * - Fallback seguro (default determinístico)
 * - Ready flag: profileReady
 *
 * Integração:
 * - Passe userId via prop (vindos do AuthContext)
 * - No MVP: userId obrigatório; se não houver, provider não renderiza children.
 */

type ProfileContextValue = {
  profile: Profile | null;
  profileReady: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<Profile>;
  setProfile: (next: Profile) => Promise<Profile>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within <ProfileProvider />");
  return ctx;
}

type Props = {
  userId: string | null | undefined;
  children: React.ReactNode;
  /**
   * Se true: bloqueia render até carregar profile (zero flash).
   * Se false: rende children e você lida com states na UI.
   */
  gate?: boolean;
};

export function ProfileProvider({ userId, children, gate = true }: Props) {
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const loadedForUserRef = useRef<string | null>(null);

  const safeUserId = userId ?? null;

  async function doLoad(uid: string) {
    const p = await loadProfile(uid);
    setProfileState(p);
    setProfileReady(true);
    loadedForUserRef.current = uid;
  }

  useEffect(() => {
    // sem usuário -> sem profile
    if (!safeUserId) {
      setProfileState(null);
      setProfileReady(false);
      loadedForUserRef.current = null;
      return;
    }

    // carrega 1x por userId
    if (loadedForUserRef.current === safeUserId && profileReady) return;

    setProfileReady(false);
    doLoad(safeUserId).catch(() => {
      // fallback ultra-seguro
      setProfileState(getDefaultProfile(safeUserId));
      setProfileReady(true);
      loadedForUserRef.current = safeUserId;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeUserId]);

  async function refreshProfile() {
    if (!safeUserId) return;
    setProfileReady(false);
    await doLoad(safeUserId);
  }

  async function setProfile(next: Profile) {
    const saved = await saveProfile(next);
    setProfileState(saved);
    setProfileReady(true);
    loadedForUserRef.current = saved.id;
    return saved;
  }

  async function updateProfile(patch: Partial<Profile>) {
    if (!safeUserId) throw new Error("Cannot update profile without userId");
    const base = profile ?? getDefaultProfile(safeUserId);
    const merged: Profile = {
      ...base,
      ...patch,
      id: safeUserId, // força coerência
      units: patch.units ?? base.units,
    };
    return await setProfile(merged);
  }

  const value = useMemo<ProfileContextValue>(
    () => ({
      profile,
      profileReady,
      refreshProfile,
      updateProfile,
      setProfile,
    }),
    [profile, profileReady]
  );

  // Gate premium: evita flash de UI sem perfil
  if (gate) {
    if (!safeUserId) return null; // Auth decide o redirect
    if (!profileReady) {
      return (
        <div className="min-h-screen w-full flex items-center justify-center">
          <div className="opacity-80 text-sm">Carregando seu perfil…</div>
        </div>
      );
    }
  }

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
