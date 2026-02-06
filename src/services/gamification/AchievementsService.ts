
export type UserStats = {
  totalWorkouts: number;
  totalDistanceKm: number;
  totalCalories: number;
  consecutiveDays: number;
  longestStreakDays: number;
  totalWeightLostKg: number;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: string;
  condition: (stats: UserStats) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first-workout", title: "Primeiro Passo", description: "Complete seu primeiro treino", icon: "🎯", xpReward: 50, condition: (s) => s.totalWorkouts >= 1 },
  { id: "10-workouts", title: "Consistência Inicial", description: "Complete 10 treinos", icon: "💪", xpReward: 100, condition: (s) => s.totalWorkouts >= 10 },
  { id: "50-workouts", title: "Veterano", description: "Complete 50 treinos", icon: "🏆", xpReward: 500, condition: (s) => s.totalWorkouts >= 50 },
  { id: "100-workouts", title: "Centurião", description: "Complete 100 treinos", icon: "👑", xpReward: 1000, condition: (s) => s.totalWorkouts >= 100 },
  { id: "5km-total", title: "Maratonista Iniciante", description: "Corra 5km no total", icon: "🏃", xpReward: 100, condition: (s) => s.totalDistanceKm >= 5 },
  { id: "100km-total", title: "Ultra Runner", description: "Corra 100km no total", icon: "🚀", xpReward: 1000, condition: (s) => s.totalDistanceKm >= 100 },
  { id: "7-day-streak", title: "Semana Perfeita", description: "Treine 7 dias seguidos", icon: "🔥", xpReward: 200, condition: (s) => s.consecutiveDays >= 7 },
  { id: "30-day-streak", title: "Mestre da Disciplina", description: "Treine 30 dias seguidos", icon: "⚡", xpReward: 1000, condition: (s) => s.consecutiveDays >= 30 },
  { id: "5kg-lost", title: "Transformação Iniciada", description: "Perca 5kg", icon: "📉", xpReward: 500, condition: (s) => s.totalWeightLostKg >= 5 },
  { id: "10kg-lost", title: "Transformação Total", description: "Perca 10kg", icon: "🎊", xpReward: 2000, condition: (s) => s.totalWeightLostKg >= 10 },
  { id: "10k-calories", title: "Queimador de Calorias", description: "Queime 10.000 kcal no total", icon: "🔥", xpReward: 300, condition: (s) => s.totalCalories >= 10000 },
  { id: "50k-calories", title: "Inferno Metabólico", description: "Queime 50.000 kcal no total", icon: "🌋", xpReward: 1500, condition: (s) => s.totalCalories >= 50000 },
];

class AchievementsService {
  private readonly STORAGE_KEY = "drmindsetfit:achievements";

  getUnlockedAchievements(): string[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  unlockAchievement(id: string): void {
    const unlocked = this.getUnlockedAchievements();
    if (!unlocked.includes(id)) {
      unlocked.push(id);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(unlocked));
    }
  }

  checkAchievements(stats: UserStats): Achievement[] {
    const unlocked = this.getUnlockedAchievements();
    const newly: Achievement[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!unlocked.includes(a.id) && a.condition(stats)) {
        this.unlockAchievement(a.id);
        newly.push(a);
      }
    }
    return newly;
  }

  getProgress(): { totalAchievements: number; unlockedCount: number; totalXP: number } {
    const unlocked = this.getUnlockedAchievements();
    const totalXP = ACHIEVEMENTS.filter((a) => unlocked.includes(a.id)).reduce((sum, a) => sum + a.xpReward, 0);
    return { totalAchievements: ACHIEVEMENTS.length, unlockedCount: unlocked.length, totalXP };
  }
}

export const achievementsService = new AchievementsService();
