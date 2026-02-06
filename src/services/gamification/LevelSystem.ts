
export type Level = { level: number; title: string; xpRequired: number; benefits: string[] };

export const LEVELS: Level[] = [
  { level: 1, title: "Iniciante", xpRequired: 0, benefits: ["Acesso básico ao app"] },
  { level: 2, title: "Aprendiz", xpRequired: 100, benefits: ["Desbloqueio de treinos intermediários"] },
  { level: 3, title: "Praticante", xpRequired: 250, benefits: ["Personalização de treinos"] },
  { level: 4, title: "Dedicado", xpRequired: 500, benefits: ["Planos de nutrição avançados"] },
  { level: 5, title: "Atleta", xpRequired: 1000, benefits: ["GPS tracking avançado"] },
  { level: 6, title: "Veterano", xpRequired: 2000, benefits: ["Análise de composição corporal"] },
  { level: 7, title: "Expert", xpRequired: 4000, benefits: ["IA adaptativa de treinos"] },
  { level: 8, title: "Mestre", xpRequired: 8000, benefits: ["Integração com wearables"] },
  { level: 9, title: "Lenda", xpRequired: 15000, benefits: ["Modo offline premium"] },
  { level: 10, title: "Imortal", xpRequired: 30000, benefits: ["Acesso vitalício a todas as features"] },
];

export function getLevelFromXP(xp: number): Level {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xpRequired) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getProgressToNextLevel(xp: number): {
  currentLevel: Level;
  nextLevel: Level | null;
  progressPercent: number;
  xpToNext: number;
} {
  const currentLevel = getLevelFromXP(xp);
  const nextLevel = LEVELS.find((l) => l.level === currentLevel.level + 1) || null;
  if (!nextLevel) return { currentLevel, nextLevel: null, progressPercent: 100, xpToNext: 0 };

  const xpInCurrent = xp - currentLevel.xpRequired;
  const xpNeeded = nextLevel.xpRequired - currentLevel.xpRequired;
  const progressPercent = (xpInCurrent / xpNeeded) * 100;

  return {
    currentLevel,
    nextLevel,
    progressPercent,
    xpToNext: nextLevel.xpRequired - xp,
  };
}

// Fallback export
export const levelSystem: any = (globalThis as any).levelSystem;
