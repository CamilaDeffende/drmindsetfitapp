export type SubscriptionPlan = "monthly" | "annual";

export type SubscriptionStatus = {
  plan: SubscriptionPlan;
  startedAtISO: string; // ISO
  expiresAtISO: string; // ISO
  active: boolean;
};
