import { useGlobalProfileStore } from "./store";

export function useGlobalProfile() {
  return useGlobalProfileStore((s) => s.profile);
}
