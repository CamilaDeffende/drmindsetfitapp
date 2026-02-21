// src/features/global-profile/useGlobalProfile.ts
import { useGlobalProfileStore } from "./store";
import type { GlobalProfile } from "./types";

export function useGlobalProfile() {
  const { profile, setProfile, resetProfile } = useGlobalProfileStore((s) => ({
    profile: s.profile,
    setProfile: s.setProfile,
    resetProfile: s.resetProfile,
  }));

  // “Açúcar” em cima do setProfile: como ele já faz merge com o current,
  // a gente pode tratá-lo como patch parcial.
  const patchProfile = (patch: Partial<GlobalProfile>) => {
    setProfile(patch as GlobalProfile);
  };

  return {
    profile,
    setProfile,
    patchProfile,
    resetProfile,
  };
}