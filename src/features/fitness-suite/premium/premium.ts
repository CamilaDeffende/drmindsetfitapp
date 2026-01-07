export type PremiumFeature =
  | "advancedReports"
  | "progressionPro"
  | "longHistory"
  | "exportUnlimited";

export type PremiumFlags = Record<PremiumFeature, boolean>;

// Sprint 13.0 — Premium Layer (sem login/backend por enquanto).
// No futuro, basta trocar essas flags por um estado real (assinatura/licença).
export const premiumFlags: PremiumFlags = {
  advancedReports: false,
  progressionPro: false,
  longHistory: false,
  exportUnlimited: false,
};

export function isPremium(feature: PremiumFeature): boolean {
  return Boolean(premiumFlags[feature]);
}

export function premiumLabel(feature: PremiumFeature): string {
  switch (feature) {
    case "advancedReports":
      return "Relatórios avançados";
    case "progressionPro":
      return "Progressão Inteligente PRO";
    case "longHistory":
      return "Histórico estendido";
    case "exportUnlimited":
      return "Exportação ilimitada";
    default:
      return "Recurso Premium";
  }
}
