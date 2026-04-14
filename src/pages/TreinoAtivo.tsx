import { useState, useEffect, useMemo } from "react";
import TrainingEngineInsightsCard from "@/components/training/TrainingEngineInsightsCard";
import TrainingEngineDecisionCard from "@/components/training/TrainingEngineDecisionCard";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, ArrowRight, Timer, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { loadActivePlan } from "@/services/plan.service";
import { buildWorkoutPlanPreview } from "@/services/training/WorkoutPlanBuilder";
import ProgressaoCargaHint from "@/components/ProgressaoCargaHint";
import { getExerciseProgressionSuggestion } from "@/services/training/trainingProgression.service";
import { getTrainingReadinessSnapshot } from "@/services/training/trainingReadiness.service";
import {
  appendTrainingMotorDecision,
  buildTrainingMotorDecisionForSession,
  getTrainingMotorDecisionPreview,
} from "@/services/training/trainingDecision.service";
import { historyService } from "@/services/history/HistoryService";
import { achievementsService } from "@/services/gamification/AchievementsService";
import { addXP } from "@/services/gamification/LevelSystem";
import { recordDailyCompletion } from "@/services/gamification/streaks";
import { generateMindsetFitPremiumPdf } from "@/lib/pdf/mindsetfitPdf";
import { mindsetfitSignatureLines } from "@/assets/branding/signature";
import {
  getCanonicalTrainingDayOptions,
  getCanonicalTrainingExercises,
  getCanonicalTrainingSessionByIndex,
} from "@/services/training/activeTrainingSessions.bridge";
import { lookupExerciseVisual } from "@/services/training/exerciseMediaCatalog";
import {
  beginTrainingExecutionSession,
  completeTrainingExecutionSession,
  getTrainingCurrentExecutionSession,
  getTrainingExecutionHistory,
  getCanonicalTrainingLoadHistory,
  saveTrainingCurrentExecutionSession,
  type TrainingExecutionExercise,
  type TrainingExecutionSession,
  type TrainingExecutionSet,
} from "@/services/training/trainingExecution.service";

function buildWorkoutExportText() {
  const lines = [
    "DRMINDSETFIT — TREINO (RELATÓRIO)",
    "",
    "Template: MindSetFit Premium (PDF)",
    "",
    "Conteúdo recomendado:",
    "- Divisão (A/B/C...)",
    "- Exercícios, séries, reps, descanso",
    "- Observações técnicas",
    "- Progressão",
    "",
  ];
  return lines.join("\n");
}

async function downloadPdfPremiumWorkout() {
  await generateMindsetFitPremiumPdf({
    signatureLines: mindsetfitSignatureLines,
    wordmarkText: "MindSetFit",
    reportLabel: "RELATÓRIO TREINO",
    metaLines: ["Módulo: Treino", "Template: MindSetFit Premium (PDF)"],
    bodyText: buildWorkoutExportText(),
    layout: {
      logoW: 220,
      logoH: 150,
      logoY: 78,
      wordmarkSize: 38,
      wordmarkGap: 92,
      headerGap: 32,
      margin: 60,
      lineHeight: 13,
      drawFrame: true,
    },
  });
}

interface SerieDados {
  numero: number;
  carga: number;
  tempoDescanso: number;
  completa: boolean;
}

type CanonicalExerciseView = {
  id: string;
  nome: string;
  equipamento?: string;
  grupoMuscular?: string;
  descricao?: string;
  mediaUrl?: string;
  mediaType?: "image" | "gif" | "mp4" | "webm";
  posterUrl?: string;
  targetMuscles?: string[];
  sourceLabel?: string;
  series: number;
  repeticoes: string;
  descanso: number;
  rpe?: string;
  observacoes?: string;
  officialExerciseVideoUrl?: string;
  officialExerciseSourceFile?: string;
  videoUrl?: string;
};

type CanonicalWorkoutDayView = {
  id: string;
  dia: string;
  dayKey?: string;
  modalidade: string;
  titulo: string;
  grupamentos: string[];
  exercicios: CanonicalExerciseView[];
  intensidade?: string;
  duracaoMin?: number;
  rationale?: string;
};

function safeNum(value: unknown, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function withExerciseVisual<T extends { id: string; nome: string; mediaUrl?: string; mediaType?: "image" | "gif" | "mp4" | "webm"; posterUrl?: string; targetMuscles?: string[]; sourceLabel?: string }>(
  exercise: T
): T {
  const visual = lookupExerciseVisual({ exerciseId: exercise.id, name: exercise.nome });
  return {
    ...exercise,
    mediaUrl: exercise.mediaUrl ?? visual?.mediaUrl,
    mediaType: exercise.mediaType ?? visual?.mediaType,
    posterUrl: exercise.posterUrl ?? visual?.posterUrl,
    targetMuscles: exercise.targetMuscles ?? visual?.targetMuscles,
    sourceLabel: exercise.sourceLabel ?? visual?.sourceLabel,
  };
}

function normalizeLegacyDays(state: any): CanonicalWorkoutDayView[] {
  const treinos = Array.isArray(state?.treino?.treinos) ? state.treino.treinos : [];
  return treinos.map((t: any, idx: number) => ({
    id: String(t?.id ?? `legacy-day-${idx + 1}`),
    dia: String(t?.dia ?? `Dia ${idx + 1}`),
    dayKey: String(t?.dayKey ?? ""),
    modalidade: normalizeWorkoutModality(t?.modalidade ?? "musculacao"),
    titulo: String(t?.titulo ?? t?.dia ?? `Treino ${idx + 1}`),
    grupamentos: Array.isArray(t?.grupamentos) ? t.grupamentos.map(String) : [],
    intensidade: t?.intensidade,
    duracaoMin: safeNum(t?.duracaoMin, 45),
    rationale: t?.rationale,
    exercicios: Array.isArray(t?.exercicios)
      ? t.exercicios.map((ex: any, exIdx: number) => ({
          id: String(ex?.exercicio?.id ?? `legacy-ex-${idx + 1}-${exIdx + 1}`),
          nome: String(ex?.exercicio?.nome ?? `Exercício ${exIdx + 1}`),
          equipamento: ex?.exercicio?.equipamento,
          grupoMuscular: ex?.exercicio?.grupoMuscular,
          descricao: ex?.exercicio?.descricao,
          series: safeNum(ex?.series, 3),
          repeticoes: String(ex?.repeticoes ?? "10-12"),
          descanso: safeNum(ex?.descanso, 60),
          rpe: ex?.rpe,
          observacoes: ex?.observacoes,
        }))
      : [],
  }));
}

function normalizeActivePlanLegacyDays(): CanonicalWorkoutDayView[] {
  const activePlan = loadActivePlan();
  const rawDays = Array.isArray(activePlan?.training?.week)
    ? activePlan.training.week
    : Array.isArray(activePlan?.training?.days)
      ? activePlan.training.days
      : Array.isArray(activePlan?.workout?.week)
        ? activePlan.workout.week
        : Array.isArray(activePlan?.workout?.days)
          ? activePlan.workout.days
          : [];

  return rawDays.map((t: any, idx: number) => ({
    id: String(t?.id ?? `activeplan-day-${idx + 1}`),
    dia: String(t?.dia ?? t?.day ?? `Dia ${idx + 1}`),
    dayKey: String(t?.dayKey ?? ""),
    modalidade: normalizeWorkoutModality(t?.modalidade ?? t?.modality ?? "musculacao"),
    titulo: String(t?.titulo ?? t?.title ?? t?.dia ?? `Treino ${idx + 1}`),
    grupamentos: Array.isArray(t?.grupamentos)
      ? t.grupamentos.map(String)
      : Array.isArray(t?.focus)
        ? t.focus.map(String)
        : [],
    intensidade: t?.intensidade ?? t?.intensity,
    duracaoMin: safeNum(t?.duracaoMin ?? t?.estimatedDurationMin, 45),
    rationale: t?.rationale,
    exercicios: Array.isArray(t?.exercicios)
      ? t.exercicios.map((ex: any, exIdx: number) => ({
          id: String(ex?.exercicio?.id ?? ex?.id ?? `activeplan-ex-${idx + 1}-${exIdx + 1}`),
          nome: String(ex?.exercicio?.nome ?? ex?.nome ?? ex?.name ?? `Exercicio ${exIdx + 1}`),
          equipamento: ex?.exercicio?.equipamento ?? ex?.equipamento ?? ex?.equipment,
          grupoMuscular: ex?.exercicio?.grupoMuscular ?? ex?.grupoMuscular ?? ex?.muscleGroup,
          descricao: ex?.exercicio?.descricao ?? ex?.descricao ?? ex?.notes,
          series: safeNum(ex?.series ?? ex?.sets, 3),
          repeticoes: String(ex?.repeticoes ?? ex?.reps ?? "10-12"),
          descanso: safeNum(ex?.descanso ?? ex?.restSec, 60),
          rpe: ex?.rpe,
          observacoes: ex?.observacoes ?? ex?.notes,
        }))
      : [],
  }));
}

function normalizeCanonicalDays(): CanonicalWorkoutDayView[] {
  const options = getCanonicalTrainingDayOptions();

  return options.map((opt, idx) => {
    const session = getCanonicalTrainingSessionByIndex(opt.index);

    const exercises = getCanonicalTrainingExercises(session).map((ex) => {
      const exAny = ex as any;
      return {
        id: String(ex.exerciseId),
        nome: String(ex.name),
        equipamento: ex.equipment,
        grupoMuscular: ex.muscleGroup,
        descricao: ex.notes,
        series: safeNum(ex.sets, 3),
        repeticoes: String(ex.reps ?? "10-12"),
        descanso: safeNum(ex.restSec, 60),
        rpe: ex.rpe != null ? `RPE ${ex.rpe}` : undefined,
        observacoes: ex.notes,
        officialExerciseVideoUrl: exAny.officialExerciseVideoUrl,
        officialExerciseSourceFile: exAny.officialExerciseSourceFile,
        videoUrl: exAny.videoUrl,
      };
    });

    const grupamentos = Array.from(
      new Set(exercises.map((ex) => ex.grupoMuscular).filter(Boolean).map(String))
    );

    return {
      id: String(session?.id ?? `session-${idx + 1}`),
      dia: String(opt.dayLabel ?? `Dia ${idx + 1}`),
      dayKey: String(session?.dayKey ?? ""),
      modalidade: normalizeWorkoutModality(opt.modality ?? "musculacao"),
      titulo: String(opt.title ?? `Treino ${idx + 1}`),
      grupamentos,
      intensidade: session?.intensity,
      duracaoMin: opt.estimatedDurationMin,
      rationale: session?.rationale,
      exercicios: exercises,
    };
  });
}

function buildInitialSeries(exercicio: CanonicalExerciseView): SerieDados[] {
  return Array.from({ length: exercicio.series }, (_, i) => ({
    numero: i + 1,
    carga: 0,
    tempoDescanso: exercicio.descanso,
    completa: false,
  }));
}

function normalizeMotorDecisionConfidence(value: unknown): "high" | "medium" | "low" {
  const v = String(value ?? "").trim().toLowerCase();

  if (v === "alta" || v === "high") return "high";
  if (v === "baixa" || v === "low") return "low";
  if (v === "media" || v === "média" || v === "medium") return "medium";

  return "medium";
}

function normalizeWorkoutModality(value: unknown) {
  const raw = String(value ?? "").trim().toLowerCase();
  const map: Record<string, string> = {
    musculacao: "musculacao",
    musculação: "musculacao",
    bike: "bike",
    spinning: "bike",
    corrida: "corrida",
    funcional: "funcional",
    cross: "crossfit",
    crossfit: "crossfit",
  };
  return map[raw] ?? raw;
}

function humanWorkoutModality(value: unknown) {
  const modality = normalizeWorkoutModality(value);
  const labels: Record<string, string> = {
    musculacao: "Musculação",
    bike: "Bike",
    corrida: "Corrida",
    funcional: "Funcional",
    crossfit: "CrossFit",
  };
  return labels[modality] ?? String(value ?? "Treino");
}

function describeWorkoutModality(value: unknown) {
  const modality = normalizeWorkoutModality(value);
  const labels: Record<string, string> = {
    musculacao: "Sessão de força com foco em técnica, volume e progressão.",
    bike: "Sessão de cardio com zonas, cadência e recuperação ativa.",
    corrida: "Sessão de corrida com rodagem, ritmo, técnica ou intervalos.",
    funcional: "Sessão funcional com movimento, estabilidade, core e condicionamento.",
    crossfit: "Sessão de CrossFit com skill, força e metcon de alta densidade.",
  };
  return labels[modality] ?? "Sessão guiada pelo plano ativo.";
}

function getExerciseContextLabel(workout: CanonicalWorkoutDayView | undefined, exercise: CanonicalExerciseView | undefined) {
  if (!workout || !exercise) return "Execução guiada";
  if (isCardioLikeModality(workout.modalidade)) {
    return exercise.grupoMuscular ?? "Cardio guiado";
  }
  if (workout.modalidade === "funcional") {
    return exercise.grupoMuscular ?? "Padrão funcional";
  }
  if (workout.modalidade === "crossfit") {
    return exercise.grupoMuscular ?? "Skill / Metcon";
  }
  return exercise.grupoMuscular ?? humanWorkoutModality(workout.modalidade);
}

function tracksExternalLoad(modality: unknown) {
  const normalized = normalizeWorkoutModality(modality);
  return normalized === "musculacao" || normalized === "crossfit" || normalized === "funcional";
}

function isCardioLikeModality(modality: unknown) {
  const normalized = normalizeWorkoutModality(modality);
  return normalized === "bike" || normalized === "corrida";
}

function toHistoryWorkoutType(modality: unknown): "corrida" | "bike" | "musculacao" | "outro" {
  const normalized = normalizeWorkoutModality(modality);
  if (normalized === "corrida") return "corrida";
  if (normalized === "bike") return "bike";
  if (normalized === "musculacao") return "musculacao";
  return "outro";
}

function normalizePreviewPlanDays(): CanonicalWorkoutDayView[] {
  const activePlan = loadActivePlan();
  const preview = buildWorkoutPlanPreview(activePlan?.draft ?? {});

  return preview.sessions.map((session, idx) => ({
    id: `preview-${session.day}-${session.modality}-${session.slot ?? idx}`,
    dia: String(session.day ?? `Dia ${idx + 1}`),
    dayKey: String(session.day ?? ""),
    modalidade: normalizeWorkoutModality(session.modality),
    titulo: humanWorkoutModality(session.modality),
    grupamentos: [humanWorkoutModality(session.modality)],
    intensidade: undefined,
    duracaoMin: session.modality === "bike" || session.modality === "corrida" ? 35 : 45,
    rationale: undefined,
    exercicios: Array.isArray(session.exercises)
      ? session.exercises.map((ex: any, exIdx: number) =>
          withExerciseVisual({
            id: String(ex?.id ?? ex?.exerciseId ?? `preview-ex-${idx + 1}-${exIdx + 1}`),
            nome: String(ex?.name ?? ex?.nome ?? `Exercício ${exIdx + 1}`),
            equipamento: ex?.equipment ?? ex?.equipamento,
            grupoMuscular: ex?.muscleGroup ?? ex?.grupoMuscular ?? humanWorkoutModality(session.modality),
            descricao: ex?.notes ?? ex?.descricao,
            series: safeNum(ex?.sets, session.modality === "bike" || session.modality === "corrida" ? 1 : 3),
            repeticoes: String(ex?.reps ?? (session.modality === "bike" || session.modality === "corrida" ? "bloco guiado" : "10-12")),
            descanso: safeNum(ex?.restSec, session.modality === "bike" || session.modality === "corrida" ? 30 : 60),
            rpe: ex?.rpe != null ? `RPE ${ex.rpe}` : undefined,
            observacoes: ex?.notes ?? ex?.observacoes,
          })
        )
      : [],
  }));
}

function restoreSeriesFromExecution(
  exercicio: CanonicalExerciseView,
  executionExercise: TrainingExecutionExercise | undefined
): SerieDados[] {
  const fallback = buildInitialSeries(exercicio);
  const performed = Array.isArray(executionExercise?.performedSets) ? executionExercise!.performedSets : [];

  if (!performed.length) return fallback;

  return fallback.map((serie, index) => {
    const saved = performed[index];
    if (!saved) return serie;
    return {
      numero: serie.numero,
      carga: safeNum(saved.loadKg, serie.carga),
      tempoDescanso: safeNum(saved.restSec, serie.tempoDescanso),
      completa: !!saved.completed,
    };
  });
}


export function TreinoAtivo() {
  const { state } = useDrMindSetfit();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [planRefreshTick, setPlanRefreshTick] = useState(0);

  const [treinoSelecionado, setTreinoSelecionado] = useState(0);
  const [exercicioAtual, setExercicioAtual] = useState(0);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, SerieDados[]>>({});
  const [mediaHidden, setMediaHidden] = useState<Record<string, boolean>>({});
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [timerAtivo, setTimerAtivo] = useState(false);
  const [sessionMeta, setSessionMeta] = useState<{ sessionId: string; startedAt: string } | null>(null);

  useEffect(() => {
    const refresh = () => setPlanRefreshTick((prev) => prev + 1);

    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "mf:activePlan:v1") {
        refresh();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const canonicalDays = useMemo(() => normalizeCanonicalDays(), [planRefreshTick]);
  const previewPlanDays = useMemo(() => normalizePreviewPlanDays(), [planRefreshTick]);
  const activePlanLegacyDays = useMemo(() => normalizeActivePlanLegacyDays(), [planRefreshTick]);
  const legacyDays = useMemo(() => normalizeLegacyDays(state), [state]);
  const hasNonStrengthPreview = previewPlanDays.some((day) => day.modalidade !== "musculacao");
  const treinoDiasBase = hasNonStrengthPreview
    ? previewPlanDays
    : canonicalDays.length
      ? canonicalDays
      : activePlanLegacyDays.length
        ? activePlanLegacyDays
        : legacyDays;
  const treinoDias = useMemo(
    () =>
      treinoDiasBase.map((day) => ({
        ...day,
        exercicios: Array.isArray(day.exercicios) ? day.exercicios.map((item) => withExerciseVisual(item)) : [],
      })),
    [treinoDiasBase]
  );
  const isCanonicalSource = treinoDiasBase === canonicalDays;
  const completedTrainingIds = useMemo(
    () => new Set(getTrainingExecutionHistory().map((item) => String(item?.trainingId ?? ""))),
    [planRefreshTick]
  );

  useEffect(() => {
    if (!treinoDias.length) {
      setTreinoSelecionado(0);
      return;
    }

    setTreinoSelecionado((prev) => {
      if (prev < 0) return 0;
      if (prev >= treinoDias.length) return treinoDias.length - 1;
      return prev;
    });
  }, [treinoDias.length]);

  const treino = treinoDias[treinoSelecionado];
  const exercicio = treino?.exercicios?.[exercicioAtual];
  const loadTrackingEnabled = tracksExternalLoad(treino?.modalidade);
  const cardioLikeSession = isCardioLikeModality(treino?.modalidade);


  const progressionSuggestion = useMemo(() => {
    return getExerciseProgressionSuggestion({
      exerciseId: exercicio?.id,
      exerciseName: exercicio?.nome,
      currentSets: exercicio?.series,
      currentReps: exercicio?.repeticoes,
    });
  }, [exercicio?.id, exercicio?.nome, exercicio?.series, exercicio?.repeticoes]);

  const motorDecisionPreview = useMemo(() => getTrainingMotorDecisionPreview(), []);


  const historicoCargas = useMemo(() => {
    const canonicalHistory = getCanonicalTrainingLoadHistory();
    if (canonicalHistory.length) return canonicalHistory;
    return Array.isArray((state as any)?.treino?.historicoCargas) ? (state as any).treino.historicoCargas : [];
  }, [state]);

  const readinessSnapshot = useMemo(() => {
    return getTrainingReadinessSnapshot();
  }, [historicoCargas.length]);


  useEffect(() => {
    if (!treino) return;

    const currentSession = getTrainingCurrentExecutionSession();
    const canResume =
      currentSession &&
      String(currentSession.trainingId ?? "") === String(treino.id ?? "") &&
      !currentSession.finishedAt;

    if (canResume) {
      const restoredLogs = treino.exercicios.reduce<Record<string, SerieDados[]>>((acc, item) => {
        const executionExercise = currentSession.exercises.find(
          (savedExercise) => String(savedExercise.exerciseId ?? "") === String(item.id ?? "")
        );
        acc[item.id] = restoreSeriesFromExecution(item, executionExercise);
        return acc;
      }, {});

      const firstPendingExerciseIndex = Math.max(
        0,
        treino.exercicios.findIndex((item) => {
          const restored = restoredLogs[item.id] ?? [];
          return restored.some((setItem) => !setItem.completa);
        })
      );

      setExerciseLogs(restoredLogs);
      setExercicioAtual(firstPendingExerciseIndex === -1 ? 0 : firstPendingExerciseIndex);
      setSessionMeta({
        sessionId: currentSession.sessionId,
        startedAt: currentSession.startedAt,
      });
      setTempoDecorrido(0);
      setTimerAtivo(false);
      return;
    }

    setExerciseLogs({});
    setExercicioAtual(0);
    setTempoDecorrido(0);
    setTimerAtivo(false);

    const startedSession = beginTrainingExecutionSession({
      sessionId: `${treino.id}-${Date.now()}`,
      trainingId: treino.id,
      source: isCanonicalSource ? "training.workouts" : "state.treino",
      dayLabel: treino.dia,
      dayKey: treino.dayKey,
      modality: normalizeWorkoutModality(treino.modalidade),
      title: treino.titulo,
      intensity: treino.intensidade,
      durationMin: treino.duracaoMin,
      plannedExercises: treino.exercicios.length,
      exercises: treino.exercicios.map((item) => ({
        exerciseId: item.id,
        exerciseName: item.nome,
        muscleGroup: item.grupoMuscular,
        equipment: item.equipamento,
        notes: item.observacoes,
        plannedSets: item.series,
        plannedReps: item.repeticoes,
        plannedRestSec: item.descanso,
        performedSets: [],
        completed: false,
      })),
    });
    setSessionMeta({
      sessionId: startedSession.sessionId,
      startedAt: startedSession.startedAt,
    });
  }, [treinoSelecionado, isCanonicalSource, treino?.id]);

  useEffect(() => {
    if (!exercicio) return;
    setExerciseLogs((prev) => {
      if (prev[exercicio.id]) return prev;
      return { ...prev, [exercicio.id]: buildInitialSeries(exercicio) };
    });
    setTempoDecorrido(0);
    setTimerAtivo(false);
  }, [exercicio?.id, exercicio?.series, exercicio?.descanso]);

  const series = exercicio ? exerciseLogs[exercicio.id] ?? [] : [];

  const progressoTreino = treino?.exercicios?.length
    ? Math.round(((exercicioAtual + 1) / treino.exercicios.length) * 100)
    : 0;

  const seriesCompletas = series.filter((s) => s.completa).length;
  const progressoSeries = exercicio?.series ? Math.round((seriesCompletas / exercicio.series) * 100) : 0;

  const buildExecutionSessionSnapshot = (): TrainingExecutionSession | null => {
    if (!treino || !sessionMeta) return null;

    const performedExercises: TrainingExecutionExercise[] = treino.exercicios.map((item) => {
      const performedSets = (exerciseLogs[item.id] ?? buildInitialSeries(item)).map<TrainingExecutionSet>((setItem) => ({
        setNumber: setItem.numero,
        loadKg: Number(setItem.carga ?? 0) || 0,
        restSec: Number(setItem.tempoDescanso ?? item.descanso) || item.descanso,
        completed: !!setItem.completa,
        repsTarget: item.repeticoes,
        repsPerformed: Number.parseInt(String(item.repeticoes).split("-")[0] ?? "0", 10) || null,
      }));

      return {
        exerciseId: item.id,
        exerciseName: item.nome,
        muscleGroup: item.grupoMuscular,
        equipment: item.equipamento,
        notes: item.observacoes,
        plannedSets: item.series,
        plannedReps: item.repeticoes,
        plannedRestSec: item.descanso,
        performedSets,
        completed: performedSets.some((setItem) => setItem.completed),
      };
    });

    const completedExercises = performedExercises.filter((exerciseItem) => exerciseItem.completed).length;
    const totalVolumeLoad = performedExercises.reduce(
      (acc, exerciseItem) =>
        acc + exerciseItem.performedSets.reduce((setAcc, setItem) => setAcc + (Number(setItem.loadKg ?? 0) || 0), 0),
      0
    );

    const adherencePct =
      performedExercises.length > 0 ? Math.round((completedExercises / performedExercises.length) * 100) : 0;

    return {
      sessionId: sessionMeta.sessionId,
      trainingId: treino.id,
      source: isCanonicalSource ? "training.workouts" : "state.treino",
      dayLabel: treino.dia,
      dayKey: treino.dayKey,
      modality: normalizeWorkoutModality(treino.modalidade),
      title: treino.titulo,
      intensity: treino.intensidade,
      startedAt: sessionMeta.startedAt,
      durationMin: treino.duracaoMin,
      plannedExercises: treino.exercicios.length,
      completedExercises,
      totalVolumeLoad,
      adherencePct,
      exercises: performedExercises,
    };
  };

  useEffect(() => {
    const snapshot = buildExecutionSessionSnapshot();
    if (!snapshot) return;
    saveTrainingCurrentExecutionSession(snapshot);
  }, [exerciseLogs, sessionMeta?.sessionId, treino?.id, isCanonicalSource]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerAtivo && tempoDecorrido > 0) {
      interval = setInterval(() => {
        setTempoDecorrido((prev) => {
          if (prev <= 1) {
            setTimerAtivo(false);
            toast({
              title: "Descanso concluído!",
              description: "Hora da próxima série.",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerAtivo, tempoDecorrido, toast]);

  if (!treinoDias.length || !treino || !exercicio) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ProgressaoCargaHint historico={historicoCargas} />
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Nenhum Treino Configurado</CardTitle>
            <CardDescription>Gere ou confirme seu plano antes de iniciar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate(-1)} className="w-full">
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const updateCurrentExerciseSeries = (updater: (current: SerieDados[]) => SerieDados[]) => {
    setExerciseLogs((prev) => ({
      ...prev,
      [exercicio.id]: updater(prev[exercicio.id] ?? buildInitialSeries(exercicio)),
    }));
  };

  const atualizarSerie = (indice: number, campo: "carga" | "tempoDescanso", valor: number) => {
    updateCurrentExerciseSeries((current) => {
      const next = [...current];
      next[indice] = { ...next[indice], [campo]: valor };
      return next;
    });
  };

  const marcarSerieCompleta = (indice: number) => {
    updateCurrentExerciseSeries((current) => {
      const next = [...current];
      const target = next[indice];
      next[indice] = { ...target, completa: !target.completa };

      if (!target.completa && indice < next.length - 1) {
        setTempoDecorrido(next[indice].tempoDescanso);
        setTimerAtivo(true);
      }

      if (!target.completa) {
        toast({
          title: `Série ${indice + 1} concluída!`,
          description: indice < next.length - 1 ? "Timer de descanso iniciado." : "Todas as séries completas!",
        });
      }

      return next;
    });
  };

  const exercicioAnterior = () => {
    if (exercicioAtual > 0) setExercicioAtual((prev) => prev - 1);
  };

  const proximoExercicio = () => {
    if (exercicioAtual < treino.exercicios.length - 1) {
      setExercicioAtual((prev) => prev + 1);
      return;
    }

    const hasAnyCompletedSet = treino.exercicios.some((item) =>
      (exerciseLogs[item.id] ?? []).some((setItem) => setItem.completa)
    );

    const confirmed = window.confirm(
      hasAnyCompletedSet
        ? "Deseja finalizar este treino e confirmar o ultimo exercicio?"
        : "Deseja finalizar este treino mesmo sem confirmar nenhuma serie?"
    );

    if (!confirmed) return;

    finalizarTreino();
  };

  const selecionarTreino = (index: number) => {
    setTreinoSelecionado(index);
  };

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const finalizarTreino = () => {
    const snapshot = buildExecutionSessionSnapshot();
    if (!snapshot) return;

    const finishedAt = new Date().toISOString();

    completeTrainingExecutionSession({
      ...snapshot,
      finishedAt,
    });

    try {
      historyService.addWorkout({
        type: toHistoryWorkoutType(treino.modalidade),
        modality: toHistoryWorkoutType(treino.modalidade),
        title: `${humanWorkoutModality(treino.modalidade)} - ${treino.titulo}`,
        durationMin: treino.duracaoMin,
        durationS: treino.duracaoMin ? treino.duracaoMin * 60 : undefined,
        dateIso: finishedAt,
        pse: snapshot.intensity === "alta" ? 9 : snapshot.intensity === "moderada" ? 7 : 5,
        notes: `Treino finalizado via TreinoAtivo com ${snapshot.completedExercises}/${snapshot.plannedExercises} exercicios concluidos.`,
      });
      achievementsService.syncFromHistory();
      recordDailyCompletion(new Date(finishedAt));
      addXP(35);
    } catch {}

    const decision = buildTrainingMotorDecisionForSession({
      session: {
        id: treino.id,
        dayKey: treino.dia,
        modality: normalizeWorkoutModality(treino.modalidade),
        title: treino.titulo,
        focus: treino.grupamentos.join(", "),
        intensity: treino.intensidade,
        estimatedDurationMin: treino.duracaoMin,
      },
      usedFallback: !isCanonicalSource,
      progressionApplied: !!progressionSuggestion,
      suggestedLoadKg: progressionSuggestion?.suggestedLoadKg ?? null,
      lastAverageLoadKg: progressionSuggestion?.lastAverageLoadKg ?? null,
      confidence: normalizeMotorDecisionConfidence(progressionSuggestion?.confidence),
    });

    if (decision) {
      appendTrainingMotorDecision(decision);
    }


    toast({
      title: "Treino concluído!",
      description: isCanonicalSource
        ? "Sessão oficial salva no histórico canônico."
        : "Sessão salva no histórico canônico com origem legada.",
    });

    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B1322] via-[#0E1A2E] to-[#09111D] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#09111D]/85 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-[0.26em] text-cyan-200/70">Treino ativo</div>
              <h1 className="mt-1 text-lg sm:text-xl font-bold">{treino.dia}</h1>
              <p className="mt-1 text-[11px] sm:text-xs text-white/45">
                {describeWorkoutModality(treino.modalidade)}
              </p>
              <p className="mt-1 text-xs sm:text-sm text-white/60">
                {humanWorkoutModality(treino.modalidade)} • {treino.titulo}
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadPdfPremiumWorkout}
                  className="rounded-xl border border-cyan-400/15 bg-cyan-400/10 px-4 py-2 text-xs text-cyan-100 transition-colors hover:bg-cyan-400/15"
                >
                  Baixar PDF Premium
                </button>
              </div>

              <p className="mt-2 text-xs sm:text-sm text-white/60">
                Exercício {exercicioAtual + 1} de {treino.exercicios.length}
              </p>
            </div>

            {timerAtivo && (
              <div className="mr-2 rounded-full border border-cyan-400/25 bg-cyan-400/15 px-3 py-1 text-sm font-bold text-cyan-50">
                <Timer className="w-4 h-4 inline mr-1" />
                {formatarTempo(tempoDecorrido)}
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>

          <Progress value={progressoTreino} className="h-2" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24">
        <Card className="mb-4 border-white/10 bg-[#0A1220]/85 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Prontidão da Sessão</CardTitle>
            <CardDescription>
              Leitura adaptativa do motor com fadiga regional e microciclo.
            </CardDescription>
            <CardDescription>
              Leitura adaptativa baseada nas últimas execuções canônicas do treino.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] text-muted-foreground">Score</div>
                <div className="mt-1 text-xl font-bold">{readinessSnapshot.score}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] text-muted-foreground">Nível</div>
                <div className="mt-1 text-sm font-semibold capitalize">{readinessSnapshot.level}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] text-muted-foreground">Recomendação</div>
                <div className="mt-1 text-sm font-semibold capitalize">{readinessSnapshot.recommendation}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] text-muted-foreground">Ajuste sugerido</div>
                <div className="mt-1 text-sm font-semibold">
                  {readinessSnapshot.recommendedLoadAdjustmentPct > 0
                    ? `+${readinessSnapshot.recommendedLoadAdjustmentPct}%`
                    : `${readinessSnapshot.recommendedLoadAdjustmentPct}%`}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-muted-foreground">Leitura de prontidão</div>
              <div className="mt-1 text-sm">{readinessSnapshot.rationale}</div>
            </div>

            <div className="flex flex-wrap gap-2">
              {readinessSnapshot.flags.map((flag, idx) => (
                <span
                  key={`${flag}-${idx}`}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px]"
                >
                  {flag}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4 border-white/10 bg-[#0A1220]/85 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Selecione o Treino</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {treinoDias.map((t, idx) => (
                <Button
                  key={t.id ?? idx}
                  variant="ghost"
                  onClick={() => selecionarTreino(idx)}
                  className={`h-auto rounded-2xl border px-3 py-3 text-xs sm:text-sm ${
                    treinoSelecionado === idx
                      ? "border-cyan-400/30 bg-cyan-400/15 text-white hover:bg-cyan-400/20"
                      : "border-white/10 bg-white/[0.03] text-white/80 hover:bg-white/[0.07]"
                  }`}
                >
                  <span className="font-semibold">{t.dia}</span>
                  <span className="text-xs opacity-80 truncate max-w-full">
                    {humanWorkoutModality(t.modalidade)}
                  </span>
                  {completedTrainingIds.has(String(t.id ?? "")) ? (
                    <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-200">
                      <Check className="h-3 w-3" />
                      Concluido
                    </span>
                  ) : null}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4 border-white/10 bg-[#0A1220]/85 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-lg sm:text-xl">{exercicio.nome}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {cardioLikeSession
                    ? "Bloco guiado da sessão"
                    : exercicio.equipamento ?? "Equipamento livre"}
                </CardDescription>
                <CardDescription className="text-[11px] sm:text-xs">
                  {describeWorkoutModality(treino.modalidade)}
                </CardDescription>
              </div>
              <Badge variant="outline" className="self-start border-cyan-400/20 bg-cyan-400/10 text-cyan-100 sm:self-auto text-xs">
                {getExerciseContextLabel(treino, exercicio)}
              </Badge>
            </div>
            {(exercicio.officialExerciseVideoUrl || exercicio.videoUrl) ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <video
                  key={exercicio.officialExerciseVideoUrl || exercicio.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full"
                  src={exercicio.officialExerciseVideoUrl || exercicio.videoUrl}
                />
                <div className="border-t border-white/10 px-3 py-2 text-[11px] text-white/55">
                  Fonte do vídeo:{" "}
                  <span className="text-white/75">
                    {exercicio.officialExerciseSourceFile || exercicio.officialExerciseVideoUrl || exercicio.videoUrl}
                  </span>
                </div>
              </div>
            ) : null}
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              {exercicio.mediaUrl && !mediaHidden[exercicio.id] ? (
                exercicio.mediaType === "mp4" || exercicio.mediaType === "webm" ? (
                  <video
                    key={exercicio.mediaUrl}
                    className="aspect-video w-full bg-black object-cover"
                    controls
                    playsInline
                    muted
                    loop
                    poster={exercicio.posterUrl}
                    onError={() => setMediaHidden((prev) => ({ ...prev, [exercicio.id]: true }))}
                  >
                    <source src={exercicio.mediaUrl} type={`video/${exercicio.mediaType}`} />
                  </video>
                ) : (
                  <img
                    src={exercicio.mediaUrl}
                    alt={exercicio.nome}
                    className="aspect-video w-full bg-black object-cover"
                    onError={() => setMediaHidden((prev) => ({ ...prev, [exercicio.id]: true }))}
                  />
                )
              ) : (
                <div className="aspect-video w-full bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/60 p-4">
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.24em] text-cyan-200/70">
                        Preview do movimento
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">{exercicio.nome}</div>
                      <div className="mt-1 text-sm text-white/70">
                        {exercicio.grupoMuscular ?? "Execucao guiada do exercicio"}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {Array.isArray(exercicio.targetMuscles) && exercicio.targetMuscles.length ? (
                        <div className="flex flex-wrap gap-2">
                          {exercicio.targetMuscles.map((muscle) => (
                            <span
                              key={muscle}
                              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100"
                            >
                              {muscle}
                            </span>
                          ))}
                        </div>
                      ) : null}

                      <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-xs text-white/60">
                        {exercicio.sourceLabel ?? "Adicione um GIF ou MP4 do exercicio para exibir aqui."}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/10 p-2 text-center sm:p-3">
                <p className="text-xs text-muted-foreground mb-1">{cardioLikeSession ? "Blocos" : "Séries"}</p>
                <p className="text-xl sm:text-2xl font-bold">{exercicio.series}</p>
              </div>
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/10 p-2 text-center sm:p-3">
                <p className="text-xs text-muted-foreground mb-1">{cardioLikeSession ? "Meta" : "Reps"}</p>
                <p className="text-xl sm:text-2xl font-bold">{exercicio.repeticoes}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 text-center sm:p-3">
                <p className="text-xs text-muted-foreground mb-1">{cardioLikeSession ? "Recuperação" : "Descanso"}</p>
                <p className="text-xl sm:text-2xl font-bold">{exercicio.descanso}s</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm sm:text-base">{cardioLikeSession ? "Progresso dos blocos" : "Progresso das Séries"}</Label>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {seriesCompletas}/{exercicio.series}
                </span>
              </div>
              <Progress value={progressoSeries} className="h-2 mb-3" />
            </div>

                        
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm font-semibold">Fadiga por grupamento</div>
                <div className="mt-2 space-y-2">
                  {readinessSnapshot.fatigueHotspots?.length ? (
                    readinessSnapshot.fatigueHotspots.map((item, idx) => (
                      <div key={`${item.muscleGroup}-${idx}`} className="flex items-center justify-between text-sm">
                        <span>{item.muscleGroup}</span>
                        <span className="font-semibold">
                          {item.fatigueScore}/100 • {item.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Sem hotspots relevantes.</div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm font-semibold">Deload inteligente do microciclo</div>
                <div className="mt-2 text-sm">
                  Status:{" "}
                  <span className="font-semibold">
                    {readinessSnapshot.microcycle?.deloadRecommended ? "recomendado" : "não necessário"}
                  </span>
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {readinessSnapshot.microcycle?.deloadReason}
                </div>
                <div className="mt-2 text-sm">
                  Redução sugerida de volume:{" "}
                  <span className="font-semibold">
                    {readinessSnapshot.microcycle?.suggestedVolumeReductionPct ?? 0}%
                  </span>
                </div>
              </div>
            </div>

            {motorDecisionPreview ? (
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                <div className="text-sm font-semibold">Última decisão do motor</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Tipo: <span className="font-semibold">{motorDecisionPreview.decisionType}</span>
                  {" • "}
                  Confiança: <span className="font-semibold capitalize">{motorDecisionPreview.confidence}</span>
                </div>
                <div className="mt-2 text-sm">{motorDecisionPreview.rationale}</div>
              </div>
            ) : null}

{progressionSuggestion ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-semibold">Sugestão de progressão automática</div>
                  <div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px]">
                    Confiança: <span className="font-semibold capitalize">{progressionSuggestion.confidence}</span>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                  <div className="rounded-lg bg-black/20 p-2">
                    <span className="text-muted-foreground">Última carga média:</span>{" "}
                    <span className="font-semibold">
                      {progressionSuggestion.lastAverageLoadKg != null
                        ? `${progressionSuggestion.lastAverageLoadKg} kg`
                        : "—"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-black/20 p-2">
                    <span className="text-muted-foreground">Carga sugerida:</span>{" "}
                    <span className="font-semibold">
                      {progressionSuggestion.suggestedLoadKg != null
                        ? `${progressionSuggestion.suggestedLoadKg} kg`
                        : "—"}
                    </span>
                  </div>
                  <div className="rounded-lg bg-black/20 p-2">
                    <span className="text-muted-foreground">Progressão:</span>{" "}
                    <span className="font-semibold">
                      {progressionSuggestion.progressionPercent > 0
                        ? `+${progressionSuggestion.progressionPercent}%`
                        : "manter"}
                    </span>
                  </div>
                </div>

                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {progressionSuggestion.rationale}
                </p>
              </div>
            ) : null}

            <div className="space-y-3">
              <Label className="text-sm sm:text-base font-semibold">{cardioLikeSession ? "Registrar blocos" : "Registrar Séries"}</Label>
              {series.map((serie, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    serie.completa
                      ? "bg-green-50 dark:bg-green-950 border-green-500"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm">{cardioLikeSession ? `Bloco ${serie.numero}` : `Série ${serie.numero}`}</span>
                    <Button
                      size="sm"
                      variant={serie.completa ? "default" : "outline"}
                      onClick={() => marcarSerieCompleta(idx)}
                      className="h-8"
                    >
                      {serie.completa ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          {cardioLikeSession ? "Concluído" : "Completa"}
                        </>
                      ) : (
                        cardioLikeSession ? "Concluir" : "Marcar"
                      )}
                    </Button>
                  </div>

                  <div className={`grid gap-3 ${loadTrackingEnabled ? "grid-cols-2" : "grid-cols-1"}`}>
                    {loadTrackingEnabled ? (
                      <div className="space-y-1">
                        <Label htmlFor={`carga-${idx}`} className="text-xs flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" />
                          Carga (kg)
                        </Label>
                        <Input
                          id={`carga-${idx}`}
                          type="number"
                          inputMode="decimal"
                          value={serie.carga || ""}
                          onChange={(e) => atualizarSerie(idx, "carga", Number(e.target.value))}
                          placeholder="Ex: 20"
                          className="text-sm font-semibold text-center"
                          disabled={serie.completa}
                        />
                      </div>
                    ) : null}

                    <div className="space-y-1">
                      <Label htmlFor={`descanso-${idx}`} className="text-xs flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {cardioLikeSession ? "Recuperação (s)" : "Descanso (s)"}
                      </Label>
                      <Input
                        id={`descanso-${idx}`}
                        type="number"
                        inputMode="decimal"
                        value={serie.tempoDescanso || ""}
                        onChange={(e) => atualizarSerie(idx, "tempoDescanso", Number(e.target.value))}
                        placeholder={cardioLikeSession ? "Ex: 30" : "Ex: 60"}
                        className="text-sm font-semibold text-center"
                        disabled={serie.completa}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {exercicio.descricao && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">{exercicio.descricao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[#0A1220]/85 shadow-[0_18px_40px_rgba(0,0,0,0.24)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">{cardioLikeSession ? "Blocos da Sessão" : "Exercícios do Treino"}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {treino.exercicios.map((ex, idx) => {
                const performed = exerciseLogs[ex.id] ?? [];
                const completedSets = performed.filter((item) => item.completa).length;

                return (
                  <div
                    key={ex.id ?? idx}
                    onClick={() => setExercicioAtual(idx)}
                    className={`cursor-pointer rounded-2xl border p-3 transition-all ${
                      idx === exercicioAtual
                        ? "border-cyan-400/35 bg-cyan-400/12"
                        : idx < exercicioAtual
                          ? "border-emerald-500/25 bg-emerald-500/10"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{ex.nome}</p>
                        <p className="text-xs sm:text-sm text-white/60">
                          {ex.series}x{ex.repeticoes} • {ex.descanso}s
                        </p>
                      </div>

                      <div className="ml-3 text-right">
                        <p className="text-xs text-white/50">{completedSets}/{ex.series}</p>
                        {idx < exercicioAtual && <Check className="w-4 h-4 text-green-500 ml-auto" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      <div className="mt-6 space-y-4">
        <TrainingEngineInsightsCard />
        <TrainingEngineDecisionCard />
      </div>

</main>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#09111D]/90 p-3 sm:p-4 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={exercicioAnterior}
            disabled={exercicioAtual === 0}
            className="flex-1 border-white/10 bg-white/[0.03] text-sm text-white hover:bg-white/[0.08] sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>

          <Button
            className="flex-[2] bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] text-sm sm:text-base hover:from-[#1E6BFF] hover:via-[#00B7FF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0"
            onClick={proximoExercicio}
          >
            {exercicioAtual < treino.exercicios.length - 1 ? (
              <>
                Próximo Exercício
                <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1 sm:mr-2" />
                Finalizar Treino
              </>
            )}
          </Button>
        </div>
      </div>
</div>
  );
}
