import { supabase } from "@/lib/supabase";
import {
  isActiveSubscription,
  readSubscription,
  setTrialSubscription,
} from "@/lib/subscription/storage";

export type SubscriptionStatus = {
  isPremium: boolean;
  source: "dev" | "db" | "local_trial" | "none" | "error";
  checkedAtIso: string;
  debug?: string;
};

function devPremiumOverride(): boolean {
  const v = String(import.meta.env.VITE_MF_DEV_PREMIUM ?? "0").toLowerCase();
  if (v === "1" || v === "true") return true;

  try {
    return String(localStorage.getItem("mf:premium:dev") ?? "") === "1";
  } catch {
    return false;
  }
}

function readLocalTrial() {
  const sub = readSubscription();
  if (sub.plan !== "trial") return null;

  const expiresAt = sub.expiresAtISO ? Date.parse(String(sub.expiresAtISO)) : NaN;

  return {
    ...sub,
    trialEndsAt: Number.isFinite(expiresAt) ? expiresAt : null,
    isActive: isActiveSubscription(sub),
  };
}

export const subscriptionService = {
  async getStatus(userId: string | null | undefined): Promise<SubscriptionStatus> {
    const now = new Date().toISOString();

    if (devPremiumOverride()) {
      return { isPremium: true, source: "dev", checkedAtIso: now };
    }

    const localTrial = readLocalTrial();
    if (localTrial?.isActive) {
      return { isPremium: true, source: "local_trial", checkedAtIso: now };
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
    const now = Date.now();
    const current = readSubscription();
    const currentTrialEndsAt = current.expiresAtISO
      ? Date.parse(String(current.expiresAtISO))
      : NaN;
    const hasActiveTrial =
      current.plan === "trial" &&
      isActiveSubscription(current) &&
      Number.isFinite(currentTrialEndsAt);
    const hasPaid =
      (current.plan === "monthly" || current.plan === "annual") &&
      isActiveSubscription(current);

    if (hasPaid || hasActiveTrial) {
      return {
        ok: true,
        alreadyExists: true,
        trialEndsAt: hasActiveTrial ? currentTrialEndsAt : null,
      };
    }

    void userId;

    try {
      localStorage.setItem("mindsetfit:isSubscribed", "false");
    } catch {}

    const next = setTrialSubscription();
    const trialEndsAt = next.expiresAtISO
      ? Date.parse(String(next.expiresAtISO))
      : now + 7 * 24 * 60 * 60 * 1000;

    return {
      ok: true,
      alreadyExists: false,
      trialEndsAt,
    };
  },
};
