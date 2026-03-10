import { supabase } from "@/lib/supabase";

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
  try {
    const raw = localStorage.getItem("mindsetfit:subscription:v1");
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const kind = String(parsed?.kind ?? "");
    const active = Boolean(parsed?.active);
    const trialEndsAt = Number(parsed?.trialEndsAt ?? 0);

    if (kind !== "trial") return null;
    if (!active) return null;
    if (!Number.isFinite(trialEndsAt)) return null;

    return {
      ...parsed,
      trialEndsAt,
      isActive: trialEndsAt > Date.now(),
    };
  } catch {
    return null;
  }
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
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const trialEndsAt = now + sevenDaysMs;

    try {
      const currentRaw = localStorage.getItem("mindsetfit:subscription:v1");
      if (currentRaw) {
        const current = JSON.parse(currentRaw);

        const currentKind = String(current?.kind ?? "");
        const currentTrialEndsAt = Number(current?.trialEndsAt ?? 0);
        const currentActive = Boolean(current?.active);

        const hasActiveTrial =
          currentKind === "trial" &&
          currentActive &&
          Number.isFinite(currentTrialEndsAt) &&
          currentTrialEndsAt > now;

        const hasPaid =
          currentKind === "paid" &&
          currentActive;

        if (hasPaid || hasActiveTrial) {
          return {
            ok: true,
            alreadyExists: true,
            trialEndsAt: hasActiveTrial ? currentTrialEndsAt : null,
          };
        }
      }
    } catch {}

    const payload = {
      userId,
      planId: "trial-7d",
      kind: "trial",
      active: true,
      activatedAt: now,
      trialEndsAt,
    };

    try {
      localStorage.setItem("mindsetfit:isSubscribed", "false");
    } catch {}

    try {
      localStorage.setItem("mindsetfit:subscription:v1", JSON.stringify(payload));
    } catch {}

    return {
      ok: true,
      alreadyExists: false,
      trialEndsAt,
    };
  },
};