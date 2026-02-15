
import { useEffect, useState } from "react";
import { achievementsService } from "@/services/gamification/AchievementsService";
import type { Achievement } from "@/services/gamification/AchievementsService";
import { levelSystem } from "@/services/gamification/LevelSystem";
import { Trophy, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

export function AchievementsPage() {
  const [level, setLevel] = useState(levelSystem.getProgress());
  const [achievements, setAchievements] = useState(achievementsService.getAll());

  useEffect(() => {
    setLevel(levelSystem.getProgress());
    setAchievements(achievementsService.getAll());
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500/10 p-3 rounded-xl">
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-yellow-400">Conquistas & Nível</h1>
            <p className="text-gray-400">Progresso, XP e badges do DrMindSetFit</p>
          </div>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" /> Nível
              </span>
              <Badge className="bg-yellow-500/10 text-yellow-300 border border-yellow-500/30">
                LV {level.level}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-gray-300 text-sm mb-3">XP: {level.xp} / {level.nextLevelXp}</div>
            <Progress value={Math.min(100, (level.xp / Math.max(1, level.nextLevelXp)) * 100)} />
            <div className="text-gray-500 text-xs mt-3">
              Você ganha XP ao registrar treinos, manter consistência e atualizar medições.
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-4">
          {achievements.map((a: Achievement) => (
            <Card key={a.id} className="bg-gray-900 border-gray-800">
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`p-2 rounded-lg ${a.unlocked ? "bg-green-500/10" : "bg-gray-700/20"}`}>
                  <Trophy className={`w-5 h-5 ${a.unlocked ? "text-green-400" : "text-gray-500"}`} />
                </div>
                <div className="flex-1">
                  <div className="text-white font-semibold">{a.title}</div>
                  <div className="text-gray-400 text-sm">{a.description}</div>
                  <div className="mt-2">
                    {a.unlocked ? (
                      <Badge className="bg-green-500/10 text-green-300 border border-green-500/30">Desbloqueada</Badge>
                    ) : (
                      <Badge className="bg-gray-700/30 text-gray-300 border border-gray-700">Em progresso</Badge>
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
