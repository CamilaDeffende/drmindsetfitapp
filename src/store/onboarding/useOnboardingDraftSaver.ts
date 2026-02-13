/**
 * MF_ONBOARDING_DRAFT_SAVER_V1
 * Debounce para salvar parcialmente o draft.
 */
import { useEffect, useRef } from "react";
import { useOnboardingStore, OnboardingDraft } from "./onboardingStore";

export function useOnboardingDraftSaver(partial: OnboardingDraft, delayMs = 400) {
  const saveDraft = useOnboardingStore((s) => s.saveDraft);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      saveDraft(partial);
    }, delayMs);

    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [partial, delayMs, saveDraft]);
}
