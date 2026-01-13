export type FeatureFlags = {
  paywallEnabled: boolean;
  premiumUnlocked: boolean;
};

const KEY = "drmindsetfit:flags";

const DEFAULT_FLAGS: FeatureFlags = {
  paywallEnabled: false,
  premiumUnlocked: false,
};

export function loadFlags(): FeatureFlags {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_FLAGS;
    const parsed = JSON.parse(raw) as Partial<FeatureFlags>;
    return { ...DEFAULT_FLAGS, ...parsed };
  } catch {
    return DEFAULT_FLAGS;
  }
}

export function saveFlags(next: FeatureFlags) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // noop
  }
}

export function setFlag<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) {
  const f = loadFlags();
  const next = { ...f, [key]: value };
  saveFlags(next);
  return next;
}

export function setPaywallEnabled(v: boolean): FeatureFlags {
  const cur = typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false };
  const next = { ...cur, paywallEnabled: !!v };
  if (typeof window !== "undefined") saveFlags(next);
  return next;
}

export function setPremiumUnlocked(v: boolean): FeatureFlags {
  const cur = typeof window !== "undefined" ? loadFlags() : { paywallEnabled: false, premiumUnlocked: false };
  const next = { ...cur, premiumUnlocked: !!v };
  if (typeof window !== "undefined") saveFlags(next);
  return next;
}
