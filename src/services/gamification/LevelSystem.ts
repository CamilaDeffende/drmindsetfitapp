import { achievementsService } from "@/services/gamification/AchievementsService";
export type LevelInfo = {
  level: number;
  title: string;
  xpRequired: number;
  nextXpRequired: number;
  progress01: number; // 0..1
  xp: number; // alias: total XP
  nextLevelXp: number; // alias: XP do próximo level

};

const LEVELS: { level: number; title: string; xp: number }[] = [
  { level: 1, title: "Iniciante", xp: 0 },
  { level: 2, title: "Consistente", xp: 150 },
  { level: 3, title: "Atleta", xp: 400 },
  { level: 4, title: "Elite", xp: 800 },
  { level: 5, title: "Lenda", xp: 1400 },
];

export class LevelSystem {
  
  getProgress() {
    return LevelSystem.getLevelInfo(achievementsService.getTotalXp());
  }

static getLevelInfo(totalXp: number): LevelInfo {
    const xp = Math.max(0, Math.floor(totalXp || 0));
    let cur = LEVELS[0];

    for (const L of LEVELS) {
      if (xp >= L.xp) cur = L;
      else break;
    }

    const idx = LEVELS.findIndex((l) => l.level === cur.level);
    const next = LEVELS[Math.min(idx + 1, LEVELS.length - 1)];

    const span = Math.max(1, next.xp - cur.xp);
    const prog = cur.level === next.level ? 1 : Math.min(1, Math.max(0, (xp - cur.xp) / span));

    return {
      level: cur.level,
      title: cur.title,
      xpRequired: cur.xp,
      nextXpRequired: next.xp,
      progress01: prog,
      xp: xp,
      nextLevelXp: next.xp,
    };
  }
}

export const levelSystem = new LevelSystem();
