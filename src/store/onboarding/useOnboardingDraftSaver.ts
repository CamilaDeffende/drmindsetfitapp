/**
 * MF_ONBOARDING_DRAFT_SAVER_V2 (BLOCK2.2)
 * - Debounce real (cancela e reagenda)
 * - Dedupe por snapshot estável (não salva se igual)
 * - Fail-safe (nunca quebra UI por autosave)
 * - Salva PARTIAL (merge) via saveDraftPartial (SSOT incremental)
 */
import { useEffect, useRef } from "react";
import { useOnboardingStore, OnboardingDraft } from "./onboardingStore";

function stableJson(value: unknown): string {
  try {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const v = value as Record<string, unknown>;
      const keys = Object.keys(v).sort();
      const out: Record<string, unknown> = {};
      for (const k of keys) out[k] = v[k];
      return JSON.stringify(out);
    }
    return JSON.stringify(value);
  } catch {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}

export function useOnboardingDraftSaver(partial: OnboardingDraft, delayMs = 400) {
  const saveDraftPartial = useOnboardingStore((s) => s.saveDraftPartial ?? s.saveDraft);

  const lastSavedSnapshotRef = useRef<string>("");
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    // snapshot estável do payload
    const snap = stableJson(partial);

    // dedupe: se nada mudou, não faz nada
    if (lastSavedSnapshotRef.current === snap) return;

    // debounce: cancela pendente e agenda novo
    if (saveTimerRef.current != null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    saveTimerRef.current = window.setTimeout(() => {
      try {
        // re-check: evita gravar snapshot obsoleto
        if (lastSavedSnapshotRef.current === snap) return;
        lastSavedSnapshotRef.current = snap;

        // SSOT incremental (merge)
        if (typeof saveDraftPartial === "function") {
          saveDraftPartial(partial);
        }
      } catch {
        // fail-safe
      }
    }, Math.max(0, delayMs | 0));

    return () => {
      if (saveTimerRef.current != null) {
        window.clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
    };
  }, [partial, delayMs, saveDraftPartial]);
}
