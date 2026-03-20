export type SubscriptionPlan = "free" | "trial" | "monthly" | "annual";

export type SubscriptionStatus = {
  plan: SubscriptionPlan;
  startedAtISO: string;
  expiresAtISO?: string;
  active: boolean;
};