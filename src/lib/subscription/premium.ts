import { readSubscription, isActiveSubscription } from "./storage";
import { isCheckoutMode } from "./config";

export function readPremiumStatus(): boolean {
  // futuro: quando tiver stripe
  if (isCheckoutMode()) {
    // aqui você vai usar backend / supabase
    return false;
  }

  // atual: local
  const sub = readSubscription();
  return isActiveSubscription(sub);
}

export function getHomeRoute(): "/dashboard" | "/dashboardpremium" {
  return readPremiumStatus() ? "/dashboardpremium" : "/dashboard";
}