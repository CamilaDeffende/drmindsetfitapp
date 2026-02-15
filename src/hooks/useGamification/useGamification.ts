import { useEffect, useMemo, useState } from "react";
import { mfOnHistory } from "@/services/history/HistoryService";
import { loadStreak, recordDailyCompletion, type Streak } from "@/services/gamification/streaks";
import { addXP, loadLevel, type LevelState } from "@/services/gamification/LevelSystem";
import { loadAchievements, unlock, type Achievement } from "@/services/gamification/achievements";
import { mfGetLoad7dFromHistory } from "@/services/history/HistoryService";
import { mfEvents } from "@/services/events/mfEvents";

export type GamificationState = {
  streak: Streak;
  level: LevelState;
  achievements: Achievement[];
};

export function useGamification() {
  
  // MF_GAMIFICATION_EVENTS_V1
  useEffect(() => {
    const off1 = mfEvents.on("nutrition_plan_set", (p) => {
      try {
        const add = p.hasAudit ? 15 : 8;
        addXP(add);
      } catch {}
    });
    const off2 = mfEvents.on("workout_added", () => {
      try { addXP(10); } catch {}
    });
    return () => { try { off1(); off2(); } catch {} };
  }, []);
const [state, setState] = useState<GamificationState>(() => ({
    streak: loadStreak(),
    level: loadLevel(),
    achievements: loadAchievements(),
  }));

  // Light boot unlock
  useEffect(() => {
    try {
      const a = unlock("FIRST_LOGIN");
      setState((s) => ({ ...s, achievements: a }));
    } catch {}
  }, []);
  // MF_GAMIFICATION_HISTORY_BIND_V1
  useEffect(() => {
    try {
      const off = mfOnHistory("workout_added", () => {
        try {
          const level = addXP(35);
          let achievements = unlock("FIRST_WORKOUT");
          try {
            const l7 = mfGetLoad7dFromHistory(new Date());
            if (l7.sessions >= 3) achievements = unlock("THREE_WORKOUTS_WEEK");
          } catch {}
          setState((s) => ({ ...s, level, achievements }));
        } catch {}
      });
      return () => off();
    } catch {
      return;
    }
  }, []);


  const actions = useMemo(() => {
    return {
      dailyCheckin: () => {
        const streak = recordDailyCompletion(new Date());
        const level = addXP(20);
        let achievements = loadAchievements();

        if (streak.current >= 7) achievements = unlock("SEVEN_DAY_STREAK");
        setState({ streak, level, achievements });
      },

      onNutritionPlanSet: (hasAudit: boolean) => {
        const level = addXP(40);
        let achievements = unlock("NUTRITION_PLAN_SET");
        if (hasAudit) achievements = unlock("AUDIT_ACTIVE");
        setState((s) => ({ ...s, level, achievements }));
      },

      onWorkoutLogged: () => {
        const level = addXP(35);
        let achievements = unlock("FIRST_WORKOUT");
        try {
          const l7 = mfGetLoad7dFromHistory(new Date());
          if (l7.sessions >= 3) achievements = unlock("THREE_WORKOUTS_WEEK");
        } catch {}
        setState((s) => ({ ...s, level, achievements }));
      },
    };
  }, []);

  return { state, actions };
}
