// AUTO-GENERATED (FLOW v1) — persistência do onboarding (step 1..8 + data)
export type OnboardingProgress = {
  step: number; // 1..8
  data?: Record<string, any>;
  updatedAt: number;
};

const KEY = "mindsetfit:onboardingProgress:v1";

export function loadOnboardingProgress(): OnboardingProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { step: 1, data: {}, updatedAt: Date.now() };
    const parsed = JSON.parse(raw);
    const step = Number(parsed?.step || 1);
    const data = (parsed?.data && typeof parsed.data === "object") ? parsed.data : {};
    return {
      step: Math.min(8, Math.max(1, step)),
      data,
      updatedAt: Number(parsed?.updatedAt || Date.now())
    };
  } catch {
    return { step: 1, data: {}, updatedAt: Date.now() };
  }
}

export function saveOnboardingProgress(next: Partial<OnboardingProgress>) {
  const cur = loadOnboardingProgress();
  const merged: OnboardingProgress = {
    step: Math.min(8, Math.max(1, Number(next?.step ?? cur.step))),
    data: { ...(cur.data || {}), ...((next?.data && typeof next.data === "object") ? next.data : {}) },
    updatedAt: Date.now()
  };
  try { localStorage.setItem(KEY, JSON.stringify(merged)); } catch {}
  return merged;
}

export function resetOnboardingProgress() {
  try { localStorage.removeItem(KEY); } catch {}
}
