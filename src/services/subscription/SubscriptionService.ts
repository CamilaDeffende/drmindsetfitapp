import { supabase } from "@/services/supabase/client";

export type SubscriptionStatus = {
  isPremium: boolean;
  source: "dev" | "db" | "none" | "error";
  checkedAtIso: string;
  debug?: string;
};

function devPremiumOverride(): boolean {
  const v = String(import.meta.env.VITE_MF_DEV_PREMIUM ?? "0").toLowerCase();
  if (v === "1" || v === "true") return true;
  return String(localStorage.getItem("mf:premium:dev") ?? "") === "1";
}

/**
 * SaaS v1: premium = active subscription in DB.
 * This is intentionally "graceful":
 * - If tables are not created yet, it returns isPremium=false (app still works).
 */
export const subscriptionService = {
  async getStatus(userId: string | null | undefined): Promise<SubscriptionStatus> {
    const now = new Date().toISOString();

    if (devPremiumOverride()) {
      return { isPremium: true, source: "dev", checkedAtIso: now };
    }
    if (!userId) {
      return { isPremium: false, source: "none", checkedAtIso: now };
    }

    try {
      // expects a table "subscriptions" with:
      // user_id (uuid), status (text), current_period_end (timestamptz nullable)
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status,current_period_end")
        .eq("user_id", userId)
        .order("current_period_end", { ascending: false })
        .limit(1);

      if (error) {
        return { isPremium: false, source: "error", checkedAtIso: now, debug: String(error.message) };
      }

      const row = data?.[0];
      const status = String(row?.status ?? "").toLowerCase();
      const cpe = row?.current_period_end ? new Date(row.current_period_end).getTime() : null;
      const alive = cpe ? cpe > Date.now() : true; // if null, treat as active until you implement Stripe periods

      const isPremium = (status === "active" || status === "trialing") && alive;

      return { isPremium, source: "db", checkedAtIso: now };
    } catch (e: any) {
      return { isPremium: false, source: "error", checkedAtIso: now, debug: String(e?.message ?? e) };
    }
  },
};
