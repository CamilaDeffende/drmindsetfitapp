import { syncService } from "@/services/offline/SyncService";

/**
 * Serviço de histórico de treinos e medições (localStorage)
 */
export type WorkoutRecord = {
  id: string;
  date: string; // ISO
  type: "corrida" | "ciclismo" | "musculacao" | "crossfit" | "funcional";
  durationMinutes: number;
  distanceMeters?: number;
  caloriesBurned: number;
  averageHeartRate?: number;
  maxHeartRate?: number;
  pse?: number;
  notes?: string;
  gpsRoute?: any;
};

export const __mfKeepEnqueueIfOffline = enqueueIfOffline;

function enqueueIfOffline(type: "workout"|"measurement"|"nutrition", data: any) {
  try {
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      syncService.addToQueue(type, data);
    }

// keep function referenced (no-op when online)
  } catch (_e) { /* noop */ }
}

export type BodyMeasurement = {
  id: string;
  date: string;
  weightKg: number;
  bodyFatPercentage?: number;
  muscleMassKg?: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
  photos?: string[];
};

export type NutritionLog = {
  id: string;
  date: string;
  totalKcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  waterLiters: number;
  meals: number;
};

class HistoryService {
  private readonly STORAGE_KEY_WORKOUTS = "drmindsetfit:workouts";
  private readonly STORAGE_KEY_MEASUREMENTS = "drmindsetfit:measurements";
  private readonly STORAGE_KEY_NUTRITION = "drmindsetfit:nutrition";

  addWorkout(workout: Omit<WorkoutRecord, "id">): WorkoutRecord {
    const workouts = this.getAllWorkouts();
    const newWorkout: WorkoutRecord = { ...workout, id: `workout-${Date.now()}` };
    workouts.push(newWorkout);
    localStorage.setItem(this.STORAGE_KEY_WORKOUTS, JSON.stringify(workouts));
    return newWorkout;
  }

  getAllWorkouts(): WorkoutRecord[] {
    const data = localStorage.getItem(this.STORAGE_KEY_WORKOUTS);
    return data ? JSON.parse(data) : [];
  }

  getWorkoutsByDateRange(startDate: string, endDate: string): WorkoutRecord[] {
    return this.getAllWorkouts().filter((w) => w.date >= startDate && w.date <= endDate);
  }

  getWorkoutsByType(type: WorkoutRecord["type"]): WorkoutRecord[] {
    return this.getAllWorkouts().filter((w) => w.type === type);
  }

  deleteWorkout(id: string): void {
    const workouts = this.getAllWorkouts().filter((w) => w.id !== id);
    localStorage.setItem(this.STORAGE_KEY_WORKOUTS, JSON.stringify(workouts));
  }

  addMeasurement(measurement: Omit<BodyMeasurement, "id">): BodyMeasurement {
    const measurements = this.getAllMeasurements();
    const newMeasurement: BodyMeasurement = { ...measurement, id: `measurement-${Date.now()}` };
    measurements.push(newMeasurement);
    localStorage.setItem(this.STORAGE_KEY_MEASUREMENTS, JSON.stringify(measurements));
    return newMeasurement;
  }

  getAllMeasurements(): BodyMeasurement[] {
    const data = localStorage.getItem(this.STORAGE_KEY_MEASUREMENTS);
    return data ? JSON.parse(data) : [];
  }

  getMeasurementsByDateRange(startDate: string, endDate: string): BodyMeasurement[] {
    return this.getAllMeasurements().filter((m) => m.date >= startDate && m.date <= endDate);
  }

  getLatestMeasurement(): BodyMeasurement | null {
    const measurements = this.getAllMeasurements();
    if (measurements.length === 0) return null;
    return measurements.sort((a, b) => b.date.localeCompare(a.date))[0];
  }

  addNutritionLog(log: Omit<NutritionLog, "id">): NutritionLog {
    const logs = this.getAllNutritionLogs();
    const newLog: NutritionLog = { ...log, id: `nutrition-${Date.now()}` };
    logs.push(newLog);
    localStorage.setItem(this.STORAGE_KEY_NUTRITION, JSON.stringify(logs));
    return newLog;
  }

  getAllNutritionLogs(): NutritionLog[] {
    const data = localStorage.getItem(this.STORAGE_KEY_NUTRITION);
    return data ? JSON.parse(data) : [];
  }

  getNutritionLogsByDateRange(startDate: string, endDate: string): NutritionLog[] {
    return this.getAllNutritionLogs().filter((n) => n.date >= startDate && n.date <= endDate);
  }

  getTotalWorkouts(): number {
    return this.getAllWorkouts().length;
  }

  getTotalDistanceKm(): number {
    return (
      this.getAllWorkouts()
        .filter((w) => w.distanceMeters)
        .reduce((sum, w) => sum + (w.distanceMeters || 0), 0) / 1000
    );
  }

  getTotalCaloriesBurned(): number {
    return this.getAllWorkouts().reduce((sum, w) => sum + w.caloriesBurned, 0);
  }

  getAverageWorkoutDuration(): number {
    const workouts = this.getAllWorkouts();
    if (workouts.length === 0) return 0;
    const total = workouts.reduce((sum, w) => sum + w.durationMinutes, 0);
    return Math.round(total / workouts.length);
  }

  getWeightProgress(): { date: string; weight: number }[] {
    return this.getAllMeasurements()
      .map((m) => ({ date: m.date, weight: m.weightKg }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  getBodyFatProgress(): { date: string; bodyFat: number }[] {
    return this.getAllMeasurements()
      .filter((m) => m.bodyFatPercentage !== undefined)
      .map((m) => ({ date: m.date, bodyFat: m.bodyFatPercentage! }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

export const historyService = new HistoryService();
