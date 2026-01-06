import { create } from "zustand";
import { nanoid } from "nanoid";
import { loadJSON, saveJSON } from "./persist";

export type SetEntry = { reps: number; load: number; rpe?: number; restSec?: number };
export type ExerciseEntry = {
  id: string;
  exerciseId?: string;
  name: string;
  muscle: string;
  sets: SetEntry[];
  notes?: string;
};

type State = {
  workout: ExerciseEntry[];
  addExercise: (name: string, muscle: string, exerciseId?: string) => void;
  removeExercise: (id: string) => void;
  addSet: (exId: string) => void;
  updateSet: (exId: string, idx: number, data: Partial<SetEntry>) => void;
  updateNotes: (exId: string, notes: string) => void;
  reset: () => void;
};

const KEY = "drmsf_workout_v1";

export const useWorkoutStore = create<State>((set, get) => ({
  workout: (typeof window !== "undefined") ? loadJSON(KEY, []) : [],
  addExercise: (name, muscle, exerciseId) => {
    const next = [...get().workout, { id: nanoid(), exerciseId, name, muscle, sets: [{ reps: 10, load: 0, restSec: 90 }] }];
    set({ workout: next });
    if (typeof window !== "undefined") saveJSON(KEY, next);
  },
  removeExercise: (id) => {
    const next = get().workout.filter(x => x.id !== id);
    set({ workout: next });
    if (typeof window !== "undefined") saveJSON(KEY, next);
  },
  addSet: (exId) => {
    const next = get().workout.map(ex => ex.id === exId ? { ...ex, sets: [...ex.sets, { reps: 10, load: 0, restSec: 90 }] } : ex);
    set({ workout: next });
    if (typeof window !== "undefined") saveJSON(KEY, next);
  },
  updateSet: (exId, idx, data) => {
    const next = get().workout.map(ex =>
      ex.id === exId ? { ...ex, sets: ex.sets.map((s,i) => i===idx ? { ...s, ...data } : s) } : ex
    );
    set({ workout: next });
    if (typeof window !== "undefined") saveJSON(KEY, next);
  },
  updateNotes: (exId, notes) => {
    const next = get().workout.map(ex => ex.id === exId ? { ...ex, notes } : ex);
    set({ workout: next });
    if (typeof window !== "undefined") saveJSON(KEY, next);
  },
  reset: () => {
    set({ workout: [] });
    if (typeof window !== "undefined") saveJSON(KEY, []);
  }
}));
