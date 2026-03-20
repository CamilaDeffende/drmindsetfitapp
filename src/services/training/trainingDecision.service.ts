type AnyObj = Record<string, any>;

export type TrainingMotorDecision = {
  id: string;
  createdAt: string;
  sessionId?: string | null;
  dayKey?: string | null;
  modality?: string | null;
  title?: string | null;
  focus?: string | null;
  decisionType:
    | "session_selected"
    | "progression_applied"
    | "load_maintained"
    | "load_reduced"
    | "fallback_used"
    | "recovery_bias"
    | "history_based_adjustment";
  confidence: "low" | "medium" | "high";
  rationale: string;
  evidence: string[];
  payload?: AnyObj;
};

const ACTIVE_PLAN_KEY = "mf:activePlan:v1";
const MAX_DECISIONS = 50;

function isObject(v: unknown): v is AnyObj {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function safeArray<T = any>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function readActivePlan(): AnyObj | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(ACTIVE_PLAN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeActivePlan(plan: AnyObj) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACTIVE_PLAN_KEY, JSON.stringify(plan));
  } catch {}
}

function ensureDecisionStore(plan: AnyObj): TrainingMotorDecision[] {
  if (!isObject(plan.training)) plan.training = {};
  if (!isObject(plan.training.decision)) {
    plan.training.decision = {
      history: [],
      latestPreview: null,
    };
  }
  if (!Array.isArray(plan.training.decision.history)) {
    plan.training.decision.history = [];
  }
  return plan.training.decision.history as TrainingMotorDecision[];
}

function makeDecisionId() {
  return `td-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function appendTrainingMotorDecision(
  input: Omit<TrainingMotorDecision, "id" | "createdAt">
): TrainingMotorDecision | null {
  const plan = readActivePlan();
  if (!plan) return null;

  const history = ensureDecisionStore(plan);

  const decision: TrainingMotorDecision = {
    id: makeDecisionId(),
    createdAt: new Date().toISOString(),
    ...input,
  };

  const next = [decision, ...history].slice(0, MAX_DECISIONS);
  plan.training.decision.history = next;
  plan.training.decision.latestPreview = decision;
  writeActivePlan(plan);
  return decision;
}

export function getLatestTrainingMotorDecisions(limit = 6): TrainingMotorDecision[] {
  const plan = readActivePlan();
  if (!plan?.training?.decision?.history) return [];
  return safeArray<TrainingMotorDecision>(plan.training.decision.history).slice(0, limit);
}

export function getTrainingMotorDecisionPreview(): TrainingMotorDecision | null {
  const plan = readActivePlan();
  const preview = plan?.training?.decision?.latestPreview;
  return isObject(preview) ? (preview as TrainingMotorDecision) : null;
}

export function buildTrainingMotorDecisionForSession(input: {
  session: AnyObj | null;
  usedFallback: boolean;
  progressionApplied?: boolean;
  suggestedLoadKg?: number | null;
  lastAverageLoadKg?: number | null;
  confidence?: "low" | "medium" | "high";
}): Omit<TrainingMotorDecision, "id" | "createdAt"> | null {
  const { session, usedFallback, progressionApplied, suggestedLoadKg, lastAverageLoadKg, confidence } = input;
  if (!session) return null;

  const evidence: string[] = [];

  if (session?.modality) evidence.push(`Modalidade: ${String(session.modality)}`);
  if (session?.focus) evidence.push(`Foco: ${String(session.focus)}`);
  if (session?.intensity) evidence.push(`Intensidade: ${String(session.intensity)}`);
  if (typeof session?.estimatedDurationMin === "number") {
    evidence.push(`Duração estimada: ${session.estimatedDurationMin} min`);
  }
  if (typeof lastAverageLoadKg === "number") {
    evidence.push(`Carga média anterior: ${lastAverageLoadKg} kg`);
  }
  if (typeof suggestedLoadKg === "number") {
    evidence.push(`Carga sugerida: ${suggestedLoadKg} kg`);
  }
  evidence.push(usedFallback ? "Sessão derivada de fallback" : "Sessão derivada do SSOT training.workouts");

  let decisionType: TrainingMotorDecision["decisionType"] = "session_selected";
  let rationale = "Sessão selecionada a partir do plano canônico ativo.";

  if (usedFallback) {
    decisionType = "fallback_used";
    rationale = "O motor utilizou fallback por ausência momentânea de estrutura canônica suficiente.";
  } else if (progressionApplied && typeof suggestedLoadKg === "number" && typeof lastAverageLoadKg === "number") {
    if (suggestedLoadKg > lastAverageLoadKg) {
      decisionType = "progression_applied";
      rationale = "O motor sugeriu progressão com base no histórico recente e consistência de execução.";
    } else if (suggestedLoadKg < lastAverageLoadKg) {
      decisionType = "load_reduced";
      rationale = "O motor sugeriu redução para preservar coerência técnica.";
    } else {
      decisionType = "load_maintained";
      rationale = "O motor manteve a carga por ausência de sinal forte para progressão.";
    }
  }

  return {
    sessionId: session?.id ?? null,
    dayKey: session?.dayKey ?? null,
    modality: session?.modality ?? null,
    title: session?.title ?? null,
    focus: session?.focus ?? null,
    decisionType,
    confidence: confidence ?? "medium",
    rationale,
    evidence,
    payload: {
      usedFallback,
      progressionApplied: !!progressionApplied,
      suggestedLoadKg: suggestedLoadKg ?? null,
      lastAverageLoadKg: lastAverageLoadKg ?? null,
    },
  };
}
