import { SUBSCRIPTION_KEY } from "@/lib/storageKeys";
import type { SubscriptionPlan, SubscriptionStatus } from "./types";

const nowISO = () => new Date().toISOString();

export function computeExpiresAtISO(
  plan: SubscriptionPlan,
  startedAtISO?: string
): string | undefined {
  const start = startedAtISO ? new Date(startedAtISO) : new Date();
  const d = new Date(start.getTime());

  if (plan === "free") return undefined;

  if (plan === "trial") {
    d.setDate(d.getDate() + 7);
    return d.toISOString();
  }

  if (plan === "monthly") {
    d.setMonth(d.getMonth() + 1);
    return d.toISOString();
  }

  if (plan === "annual") {
    d.setMonth(d.getMonth() + 12);
    return d.toISOString();
  }

  return undefined;
}

export function isActiveSubscription(
  s: SubscriptionStatus | null | undefined
): boolean {
  if (!s) return false;
  if (s.plan === "free") return false;
  if (!s.expiresAtISO) return false;

  const exp = Date.parse(String(s.expiresAtISO));
  if (!Number.isFinite(exp) || exp <= 0) return false;

  return exp > Date.now();
}

export function readSubscription(): SubscriptionStatus {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_KEY);

    if (!raw) {
      return {
        plan: "free",
        startedAtISO: nowISO(),
        active: false,
      };
    }

    const v = JSON.parse(raw);
    const rawPlan = String(v?.plan ?? "free");

    const plan: SubscriptionPlan =
      rawPlan === "trial" ||
      rawPlan === "monthly" ||
      rawPlan === "annual" ||
      rawPlan === "free"
        ? rawPlan
        : "free";

    const startedAtISO = String(v?.startedAtISO ?? nowISO());
    const expiresAtISO =
      v?.expiresAtISO != null
        ? String(v.expiresAtISO)
        : computeExpiresAtISO(plan, startedAtISO);

    const next: SubscriptionStatus = {
      plan,
      startedAtISO,
      expiresAtISO,
      active: false,
    };

    return {
      ...next,
      active: isActiveSubscription(next),
    };
  } catch {
    return {
      plan: "free",
      startedAtISO: nowISO(),
      active: false,
    };
  }
}

export function writeSubscription(
  plan: SubscriptionPlan,
  startedAtISO?: string
): SubscriptionStatus {
  const started = startedAtISO ?? nowISO();
  const expiresAtISO = computeExpiresAtISO(plan, started);

  const next: SubscriptionStatus = {
    plan,
    startedAtISO: started,
    expiresAtISO,
    active: plan !== "free",
  };

  const normalized: SubscriptionStatus = {
    ...next,
    active: isActiveSubscription(next),
  };

  try {
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(normalized));
  } catch {}

  return normalized;
}

export function clearSubscription(): void {
  try {
    localStorage.removeItem(SUBSCRIPTION_KEY);
  } catch {}
}

export function setFreeSubscription() {
  return writeSubscription("free");
}

export function setTrialSubscription() {
  return writeSubscription("trial");
}

export function setMonthlySubscription() {
  return writeSubscription("monthly");
}

export function setAnnualSubscription() {
  return writeSubscription("annual");
}