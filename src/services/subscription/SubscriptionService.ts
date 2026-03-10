import { supabase } from "@/lib/supabase";

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
 * Também suporta trial de 7 dias via status "trialing".
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
      const { data, error } = await supabase
        .from("subscriptions")
        .select("status,current_period_end")
        .eq("user_id", userId)
        .order("current_period_end", { ascending: false })
        .limit(1);

      if (error) {
        return {
          isPremium: false,
          source: "error",
          checkedAtIso: now,
          debug: String(error.message),
        };
      }

      const row = data?.[0];
      const status = String(row?.status ?? "").toLowerCase();
      const cpe = row?.current_period_end
        ? new Date(row.current_period_end).getTime()
        : null;

      const alive = cpe ? cpe > Date.now() : true;
      const isPremium = (status === "active" || status === "trialing") && alive;

      return { isPremium, source: "db", checkedAtIso: now };
    } catch (e: any) {
      return {
        isPremium: false,
        source: "error",
        checkedAtIso: now,
        debug: String(e?.message ?? e),
      };
    }
  },

  async startTrial(userId: string) {
    const now = new Date();
    const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const payload = {
      user_id: userId,
      status: "trialing",
      plan: "premium",
      current_period_start: now.toISOString(),
      current_period_end: expires.toISOString(),
      cancel_at_period_end: true,
    };

    const { data, error } = await supabase
      .from("subscriptions")
      .upsert(payload, { onConflict: "user_id" })
      .select()
      .single();

    if (error) throw error;

    return data;
  },
};