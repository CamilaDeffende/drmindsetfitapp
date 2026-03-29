import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Star, ArrowLeft } from "lucide-react";
import { achievementsService } from "@/services/gamification/AchievementsService";
import { levelSystem } from "@/services/gamification/LevelSystem";
import {
  loadAchievements,
  unlock,
  type Achievement as LegacyAchievement,
} from "@/services/gamification/achievements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHomeRoute } from "@/lib/subscription/premium";

type UiAchievement = {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  category: "treino" | "nutricao" | "auditoria" | "geral";
};

function mapLegacyCategory(
  achievement: LegacyAchievement
): UiAchievement["category"] {
  if (achievement.id === "NUTRITION_PLAN_SET") return "nutricao";
  if (achievement.id === "AUDIT_ACTIVE") return "auditoria";
  if (
    achievement.id === "FIRST_WORKOUT" ||
    achievement.id === "THREE_WORKOUTS_WEEK" ||
    achievement.id === "SEVEN_DAY_STREAK"
  ) {
    return "treino";
  }
  return "geral";
}

function humanCategory(category: UiAchievement["category"]) {
  const labels: Record<UiAchievement["category"], string> = {
    treino: "Treino",
    nutricao: "Nutrição",
    auditoria: "Auditoria",
    geral: "Geral",
  };
  return labels[category];
}

function mergeAchievements(): UiAchievement[] {
  const modern = achievementsService.getAll().map((achievement) => ({
    id: `modern:${achievement.id}`,
    title: achievement.title,
    description: achievement.description,
    unlocked: achievement.unlocked,
    category: "treino" as const,
  }));

  const legacy = loadAchievements().map((achievement) => ({
    id: `legacy:${achievement.id}`,
    title: achievement.title,
    description: achievement.description,
    unlocked: !!achievement.unlockedAt,
    category: mapLegacyCategory(achievement),
  }));

  const all = [...legacy, ...modern];
  const unique = new Map<string, UiAchievement>();
  const canonicalKeyMap = new Map<string, string>([
    ["legacy:FIRST_WORKOUT", "first-workout"],
    ["modern:first_workout", "first-workout"],
    ["legacy:THREE_WORKOUTS_WEEK", "three-workouts-week"],
    ["legacy:SEVEN_DAY_STREAK", "seven-day-streak"],
    ["modern:streak_7", "seven-day-streak"],
  ]);

  for (const item of all) {
    const key =
      canonicalKeyMap.get(item.id) ?? `${item.title}::${item.description}`;
    const prev = unique.get(key);
    if (!prev) {
      unique.set(key, item);
      continue;
    }

    unique.set(key, {
      ...prev,
      unlocked: prev.unlocked || item.unlocked,
      category:
        prev.category === "geral" && item.category !== "geral"
          ? item.category
          : prev.category,
    });
  }

  return Array.from(unique.values()).sort(
    (a, b) => Number(b.unlocked) - Number(a.unlocked)
  );
}

export function AchievementsPage() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(levelSystem.getProgress());
  const [achievements, setAchievements] = useState<UiAchievement[]>(() =>
    mergeAchievements()
  );

  useEffect(() => {
    const refresh = () => {
      try {
        unlock("FIRST_LOGIN");
        achievementsService.syncFromHistory();
      } catch {
        // Ignore refresh guard errors.
      }

      setLevel(levelSystem.getProgress());
      setAchievements(mergeAchievements());
    };

    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const unlockedCount = useMemo(
    () => achievements.filter((achievement) => achievement.unlocked).length,
    [achievements]
  );

  return (
    <div className="min-h-screen mf-app-bg mf-bg-neon text-white">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(getHomeRoute())}
              className="rounded-xl text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="rounded-xl bg-yellow-500/10 p-3">
              <Trophy className="h-10 w-10 text-yellow-400" />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-yellow-400 sm:text-4xl">
                Conquistas e Nível
              </h1>
              <p className="text-sm text-white/60">
                Progresso, XP e badges do MindsetFit
              </p>
            </div>
          </div>
        </div>

        <Card className="mt-6 border-white/10 bg-[rgba(8,10,18,0.82)]">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <span className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Nível
              </span>
              <Badge className="border border-yellow-500/30 bg-yellow-500/10 text-yellow-300">
                LV {level.level}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 text-sm text-white/75">
              XP: {level.xp} / {level.nextLevelXp}
            </div>
            <Progress
              value={Math.min(
                100,
                (level.xp / Math.max(1, level.nextLevelXp)) * 100
              )}
            />
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/55">
              <span>{unlockedCount} desbloqueadas</span>
              <span>•</span>
              <span>Treino, nutrição e auditoria no mesmo painel</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className="border-white/10 bg-[rgba(8,10,18,0.82)]"
            >
              <CardContent className="flex items-start gap-3 p-4">
                <div
                  className={`rounded-lg p-2 ${
                    achievement.unlocked ? "bg-green-500/10" : "bg-gray-700/20"
                  }`}
                >
                  <Trophy
                    className={`h-5 w-5 ${
                      achievement.unlocked ? "text-green-400" : "text-gray-500"
                    }`}
                  />
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-white">
                      {achievement.title}
                    </div>
                    <Badge className="border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.16em] text-white/70">
                      {humanCategory(achievement.category)}
                    </Badge>
                  </div>
                  <div className="text-sm text-white/60">
                    {achievement.description}
                  </div>
                  <div className="mt-2">
                    {achievement.unlocked ? (
                      <Badge className="border border-green-500/30 bg-green-500/10 text-green-300">
                        Desbloqueada
                      </Badge>
                    ) : (
                      <Badge className="border border-gray-700 bg-gray-700/30 text-gray-300">
                        Em progresso
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
