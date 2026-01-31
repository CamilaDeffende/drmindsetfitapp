export function clampStep(n: number, min = 1, max = 99): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function parseStepFromPath(path: string): number | null {
  const m = path.match(/^\/onboarding\/step-(\d+)\b/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return n;
}

export function guardOnboardingPath(
  path: string,
  nextAllowedStep: number,
  done: boolean
): string | null {
  if (done) return "/dashboard";

  const next = clampStep(nextAllowedStep, 1, 99);

  if (path === "/onboarding") return `/onboarding/step-${next}`;

  const req = parseStepFromPath(path);
  if (req == null) return null;

  if (req < 1) return "/onboarding/step-1";
  if (req > next) return `/onboarding/step-${next}`;
  return null;
}
