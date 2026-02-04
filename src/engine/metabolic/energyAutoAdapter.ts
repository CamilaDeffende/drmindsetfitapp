/**
 * MindsetFit Engine Adapter
 * - Integra o cálculo científico de REE/TMB (auto-equation) ao layer de engine.
 * - NÃO altera engines existentes: apenas fornece uma função segura para consumo.
 *
 * Retorno:
 * - reeKcalAuto: number | null
 * - energyEquationUsed: string | null
 */
import { mfGetREEFromOnboarding } from "@/services/nutrition/energyBridge";

export type MFEnergyAutoResult = {
  reeKcalAuto: number | null;
  energyEquationUsed: string | null;
};

export function mfEnergyAutoFromProfile(profile: any): MFEnergyAutoResult {
  try {
    const r = mfGetREEFromOnboarding(profile);
    if (!r) return { reeKcalAuto: null, energyEquationUsed: null };
    return { reeKcalAuto: r.reeKcal, energyEquationUsed: r.equation };
  } catch {
    return { reeKcalAuto: null, energyEquationUsed: null };
  }
}
