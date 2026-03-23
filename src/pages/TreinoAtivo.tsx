import { useState, useEffect, useMemo } from "react";
import TrainingEngineInsightsCard from "@/components/training/TrainingEngineInsightsCard";
import TrainingEngineDecisionCard from "@/components/training/TrainingEngineDecisionCard";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Home, Check, ArrowLeft, ArrowRight, Timer, Dumbbell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { loadActivePlan } from "@/services/plan.service";
import ProgressaoCargaHint from "@/components/ProgressaoCargaHint";
import { getExerciseProgressionSuggestion } from "@/services/training/trainingProgression.service";
import { getTrainingReadinessSnapshot } from "@/services/training/trainingReadiness.service";
import {
  appendTrainingMotorDecision,
  buildTrainingMotorDecisionForSession,
  getTrainingMotorDecisionPreview,
} from "@/services/training/trainingDecision.service";
import { generateMindsetFitPremiumPdf } from "@/lib/pdf/mindsetfitPdf";
import { mindsetfitSignatureLines } from "@/assets/branding/signature";
import {
  getCanonicalTrainingDayOptions,
  getCanonicalTrainingExercises,
  getCanonicalTrainingSessionByIndex,
} from "@/services/training/activeTrainingSessions.bridge";
import {
  beginTrainingExecutionSession,
  completeTrainingExecutionSession,
  getCanonicalTrainingLoadHistory,
  type TrainingExecutionExercise,
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
  series: number;
  repeticoes: string;
  descanso: number;
  rpe?: string;
  observacoes?: string;
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

function normalizeLegacyDays(state: any): CanonicalWorkoutDayView[] {
  const treinos = Array.isArray(state?.treino?.treinos) ? state.treino.treinos : [];
  return treinos.map((t: any, idx: number) => ({
    id: String(t?.id ?? `legacy-day-${idx + 1}`),
    dia: String(t?.dia ?? `Dia ${idx + 1}`),
    dayKey: String(t?.dayKey ?? ""),
    modalidade: String(t?.modalidade ?? "musculacao"),
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
    modalidade: String(t?.modalidade ?? t?.modality ?? "musculacao"),
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

    const exercises = getCanonicalTrainingExercises(session).map((ex) => ({
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
    }));

    const grupamentos = Array.from(
      new Set(exercises.map((ex) => ex.grupoMuscular).filter(Boolean).map(String))
    );

    return {
      id: String(session?.id ?? `session-${idx + 1}`),
      dia: String(opt.dayLabel ?? `Dia ${idx + 1}`),
      dayKey: String(session?.dayKey ?? ""),
      modalidade: String(opt.modality ?? "musculacao"),
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


export function TreinoAtivo() {
  const { state } = useDrMindSetfit();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [planRefreshTick, setPlanRefreshTick] = useState(0);

  const [treinoSelecionado, setTreinoSelecionado] = useState(0);
  const [exercicioAtual, setExercicioAtual] = useState(0);
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, SerieDados[]>>({});
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [timerAtivo, setTimerAtivo] = useState(false);

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
  const activePlanLegacyDays = useMemo(() => normalizeActivePlanLegacyDays(), [planRefreshTick]);
  const legacyDays = useMemo(() => normalizeLegacyDays(state), [state]);
  const treinoDias = canonicalDays.length
    ? canonicalDays
    : activePlanLegacyDays.length
      ? activePlanLegacyDays
      : legacyDays;
  const isCanonicalSource = canonicalDays.length > 0;

  const treino = treinoDias[treinoSelecionado];
  const exercicio = treino?.exercicios?.[exercicioAtual];


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
    setExerciseLogs({});
    setExercicioAtual(0);
    setTempoDecorrido(0);
    setTimerAtivo(false);

    beginTrainingExecutionSession({
      sessionId: `${treino.id}-${Date.now()}`,
      trainingId: treino.id,
      source: isCanonicalSource ? "training.workouts" : "state.treino",
      dayLabel: treino.dia,
      dayKey: treino.dayKey,
      modality: treino.modalidade,
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
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Voltar ao Dashboard
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

    completeTrainingExecutionSession({
      sessionId: `${treino.id}-${Date.now()}`,
      trainingId: treino.id,
      source: isCanonicalSource ? "training.workouts" : "state.treino",
      dayLabel: treino.dia,
      dayKey: treino.dayKey,
      modality: treino.modalidade,
      title: treino.titulo,
      intensity: treino.intensidade,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      durationMin: treino.duracaoMin,
      plannedExercises: treino.exercicios.length,
      completedExercises,
      totalVolumeLoad,
      adherencePct,
      exercises: performedExercises,
    });

    const decision = buildTrainingMotorDecisionForSession({
      session: {
        id: treino.id,
        dayKey: treino.dia,
        modality: treino.modalidade,
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

    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-bold">{treino.dia}</h1>

              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={downloadPdfPremiumWorkout}
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs hover:bg-black/60"
                >
                  Baixar PDF Premium
                </button>
              </div>

              <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
                Exercício {exercicioAtual + 1} de {treino.exercicios.length}
              </p>
            </div>

            {timerAtivo && (
              <div className="px-3 py-1 rounded-full bg-[#1E6BFF] text-white font-bold text-sm mr-2">
                <Timer className="w-4 h-4 inline mr-1" />
                {formatarTempo(tempoDecorrido)}
              </div>
            )}

            <Button variant="outline" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0">
              <Home className="w-4 h-4" />
            </Button>
          </div>

          <Progress value={progressoTreino} className="h-2" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24">
        <Card className="mb-4 border-white/10">
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
              <div className="text-xs text-muted-foreground">Racional do motor</div>
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

        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Selecione o Treino</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {treinoDias.map((t, idx) => (
                <Button
                  key={t.id ?? idx}
                  variant={treinoSelecionado === idx ? "default" : "outline"}
                  onClick={() => selecionarTreino(idx)}
                  className="h-auto py-2 sm:py-3 flex-col text-xs sm:text-sm"
                >
                  <span className="font-semibold">{t.dia}</span>
                  <span className="text-xs opacity-80 truncate max-w-full">
                    {(t.grupamentos?.length ? t.grupamentos.join(", ") : t.modalidade) || "Treino"}
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-lg sm:text-xl">{exercicio.nome}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {exercicio.equipamento ?? "Equipamento livre"}
                </CardDescription>
              </div>
              <Badge variant="outline" className="self-start sm:self-auto text-xs">
                {exercicio.grupoMuscular ?? treino.modalidade}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-[#1E6BFF] dark:bg-[#1E6BFF] rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Séries</p>
                <p className="text-xl sm:text-2xl font-bold">{exercicio.series}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Reps</p>
                <p className="text-xl sm:text-2xl font-bold">{exercicio.repeticoes}</p>
              </div>
              <div className="p-2 sm:p-3 bg-[#1E6BFF] dark:bg-[#1E6BFF] rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Descanso</p>
                <p className="text-xl sm:text-2xl font-bold">{exercicio.descanso}s</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm sm:text-base">Progresso das Séries</Label>
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
              <Label className="text-sm sm:text-base font-semibold">Registrar Séries</Label>
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
                    <span className="font-semibold text-sm">Série {serie.numero}</span>
                    <Button
                      size="sm"
                      variant={serie.completa ? "default" : "outline"}
                      onClick={() => marcarSerieCompleta(idx)}
                      className="h-8"
                    >
                      {serie.completa ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Completa
                        </>
                      ) : (
                        "Marcar"
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
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

                    <div className="space-y-1">
                      <Label htmlFor={`descanso-${idx}`} className="text-xs flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        Descanso (s)
                      </Label>
                      <Input
                        id={`descanso-${idx}`}
                        type="number"
                        inputMode="decimal"
                        value={serie.tempoDescanso || ""}
                        onChange={(e) => atualizarSerie(idx, "tempoDescanso", Number(e.target.value))}
                        placeholder="Ex: 60"
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Exercícios do Treino</CardTitle>
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
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      idx === exercicioAtual
                        ? "bg-[#1E6BFF] dark:bg-[#1E6BFF] border-[#1E6BFF]"
                        : idx < exercicioAtual
                          ? "bg-green-50 dark:bg-green-950 border-green-600"
                          : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm sm:text-base truncate">{ex.nome}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {ex.series}x{ex.repeticoes} • {ex.descanso}s
                        </p>
                      </div>

                      <div className="ml-3 text-right">
                        <p className="text-xs text-muted-foreground">{completedSets}/{ex.series}</p>
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

      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t">
        <div className="max-w-3xl mx-auto flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={exercicioAnterior}
            disabled={exercicioAtual === 0}
            className="flex-1 text-sm sm:text-base"
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
