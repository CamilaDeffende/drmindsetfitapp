import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Star, ArrowLeft } from "lucide-react";
import { achievementsService } from "@/services/gamification/AchievementsService";
import type { Achievement } from "@/services/gamification/AchievementsService";
import { levelSystem } from "@/services/gamification/LevelSystem";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getHomeRoute } from "@/lib/subscription/premium";

export function AchievementsPage() {
  const navigate = useNavigate();
  const [level, setLevel] = useState(levelSystem.getProgress());
  const [achievements, setAchievements] = useState(achievementsService.getAll());

  useEffect(() => {
    setLevel(levelSystem.getProgress());
    setAchievements(achievementsService.getAll());
  }, []);

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
                Conquistas e Nivel
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
                Nivel
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
              value={Math.min(100, (level.xp / Math.max(1, level.nextLevelXp)) * 100)}
            />
            <div className="mt-3 text-xs text-white/50">
              Voce ganha XP ao registrar treinos, manter consistencia e atualizar medicoes.
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {achievements.map((achievement: Achievement) => (
            <Card key={achievement.id} className="border-white/10 bg-[rgba(8,10,18,0.82)]">
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
                  <div className="font-semibold text-white">{achievement.title}</div>
                  <div className="text-sm text-white/60">{achievement.description}</div>
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
