export function inferEquipmentProfile(equipmentTierScore: number): string {
  if (equipmentTierScore >= 90) return "equipamento alto";
  if (equipmentTierScore >= 60) return "equipamento moderado";
  return "equipamento limitado";
}
