import { useGamification } from "@/hooks/useGamification/useGamification";
import { xpForNext } from "@/services/gamification/LevelSystem";

export function GamificationCard() {
  const { state, actions } = useGamification();

  const next = xpForNext(state.level.level);
  const pct = next ? Math.min(100, Math.round((state.level.xp / next) * 100)) : 0;
  const unlocked = state.achievements.filter((a) => a.unlockedAt).length;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        <div className="text-xs uppercase tracking-[0.22em] opacity-70">Progresso</div>
        <button
          type="button"
          onClick={actions.dailyCheckin}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white hover:bg-white/10"
        >
          Check-in
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3">
        <div>
          <div className="text-xs opacity-60">Nível</div>
          <div className="text-lg font-semibold text-white">{state.level.level}</div>
        </div>
        <div>
          <div className="text-xs opacity-60">Streak</div>
          <div className="text-lg font-semibold text-white">{state.streak.current}d</div>
        </div>
        <div>
          <div className="text-xs opacity-60">Badges</div>
          <div className="text-lg font-semibold text-white">{unlocked}</div>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-xs opacity-70">
          <span>XP</span>
          <span>
            {state.level.xp}/{next}
          </span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-white/10">
          <div className="h-2 rounded-full bg-white/30" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
