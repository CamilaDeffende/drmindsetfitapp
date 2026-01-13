import { SUBSCRIPTION_MODE_KEY } from "@/lib/storageKeys";

export type SubscriptionMode = "local" | "checkout";

export function readSubscriptionMode(): SubscriptionMode {
  try {
    const v = localStorage.getItem(SUBSCRIPTION_MODE_KEY);
    return v === "checkout" ? "checkout" : "local";
  } catch {
    return "local";
  }
}

export function writeSubscriptionMode(mode: SubscriptionMode) {
  try { localStorage.setItem(SUBSCRIPTION_MODE_KEY, mode); } catch {}
}

export function isCheckoutMode(): boolean {
  return readSubscriptionMode() === "checkout";
}
