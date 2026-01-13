import { SUBSCRIPTION_KEY } from "@/lib/storageKeys";
import type { SubscriptionPlan, SubscriptionStatus } from "./types";

const nowISO = () => new Date().toISOString();

export function computeExpiresAtISO(plan: SubscriptionPlan, startedAtISO?: string): string {
  const start = startedAtISO ? new Date(startedAtISO) : new Date();
  const d = new Date(start.getTime());
  // mensal: +1 mês | anual: +12 meses
  d.setMonth(d.getMonth() + (plan === "annual" ? 12 : 1));
  return d.toISOString();
}

export function isActiveSubscription(s: SubscriptionStatus | null | undefined): boolean {
  if (!s || !s.expiresAtISO) return false;
  const exp = Date.parse(String(s.expiresAtISO));
  if (!Number.isFinite(exp) || exp <= 0) return false;
  return exp > Date.now();
}

export function readSubscription(): SubscriptionStatus | null {
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object") return null;
    const plan = v.plan === "annual" ? "annual" : "monthly";
    const startedAtISO = String(v.startedAtISO ?? v.startedAt ?? nowISO());
    const expiresAtISO = String(v.expiresAtISO ?? v.expiresAt ?? "");
    const obj: SubscriptionStatus = {
      plan,
      startedAtISO,
      expiresAtISO,
      active: isActiveSubscription({ plan, startedAtISO, expiresAtISO, active: true }),
    };
    return obj;
  } catch {
    return null;
  }
}

export function writeSubscription(plan: SubscriptionPlan, startedAtISO?: string): SubscriptionStatus {
  const started = startedAtISO ?? nowISO();
  const expiresAtISO = computeExpiresAtISO(plan, started);
  const next: SubscriptionStatus = {
    plan,
    startedAtISO: started,
    expiresAtISO,
    active: true,
  };
  try {
    localStorage.setItem(SUBSCRIPTION_KEY, JSON.stringify(next));
  } catch {}
  return { ...next, active: isActiveSubscription(next) };
}

export function clearSubscription(): void {
  try { localStorage.removeItem(SUBSCRIPTION_KEY); } catch {}
}
