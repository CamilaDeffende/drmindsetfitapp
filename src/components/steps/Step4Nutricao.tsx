// MF_ONBOARDING_CONTRACT_V1
// PREMIUM_REFINEMENT_PHASE3_STEP4_UI_V1
// MF_STEP4_DYNAMIC_KCAL_STRATEGY_V1
// MF_STEP4_KCAL_SSOT_V1
// REGRA_FIXA_NO_HEALTH_CONTEXT_STEP: nunca criar etapa de Segurança/Contexto de saúde/Sinais do corpo.

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import {
  ArrowRight,
  UtensilsCrossed,
  Check,
  ChevronLeft,
  Flame,
} from "lucide-react";
import type {
  PlanejamentoNutricional,
  Restricao,
  TipoRefeicao,
} from "@/types";
import { saveOnboardingProgress } from "@/lib/onboardingProgress";
import { saveActivePlanNutrition } from "@/services/plan/activePlanNutrition.writer";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { applyNutritionGuardrails } from "@/services/nutrition/guardrails";
import { mfAudit, type MFWarn } from "@/services/audit/mfAudit";
import { useGamification } from "@/hooks/useGamification/useGamification";
import { mfEvents } from "@/services/events/mfEvents";

const mfClampSSOT = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

const mfComputeKcalAlvo = (opts: {
  baseKcal: number;
  percent: number;
  faixa?: { minimo?: number; maximo?: number } | null;
}) => {
  const base = Number.isFinite(opts.baseKcal) ? opts.baseKcal : 0;
  const pct = Number.isFinite(opts.percent) ? opts.percent : 0;
  const raw = base * (1 + pct / 100);
  const rounded = Math.round(raw);

  const min = opts.faixa?.minimo;
  const max = opts.faixa?.maximo;

  if (
    Number.isFinite(min) &&
    Number.isFinite(max) &&
    (max as number) >= (min as number)
  ) {
    return mfClampSSOT(rounded, min as number, max as number);
  }

  return rounded;
};

const mfKcalFromMacros = (p: number, c: number, g: number) =>
  p * 4 + c * 4 + g * 9;

const mfStrategyPercent = (e: string) => {
  switch (e) {
    case "deficit-leve":
      return -10;
    case "deficit-moderado":
      return -20;
    case "deficit-agressivo":
      return -25;
    case "superavit":
      return +15;
    case "manutencao":
    default:
      return 0;
  }
};

function toNum(v: unknown, fallback = 0) {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

function loadOnboardingDraftSafe() {
  try {
    const raw = localStorage.getItem("mf:onboarding:draft:v1");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function getUserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
  } catch {
    return "America/Sao_Paulo";
  }
}

function formatTimeInZone(date: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }).format(date);
  } catch {
    return "00:00";
  }
}

function formatDateInZone(date: Date, timeZone: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      timeZone,
    }).format(date);
  } catch {
    return "";
  }
}

function timeStringToMinutes(value: string) {
  const match = String(value).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

function __mfBuildNutritionInputs(anyState: any, anyForm?: any) {
  const sexo = (anyForm?.sexo ??
    anyState?.perfil?.sexo ??
    anyState?.sexo ??
    "masculino") as any;

  const idade = Number(
    anyForm?.idade ?? anyState?.perfil?.idade ?? anyState?.idade ?? 30
  );

  const pesoKg = Number(
    anyForm?.peso ??
      anyForm?.pesoKg ??
      anyState?.perfil?.peso ??
      anyState?.peso ??
      anyState?.avaliacao?.peso ??
      70
  );

  const alturaCm = Number(
    anyForm?.altura ??
      anyForm?.alturaCm ??
      anyState?.perfil?.altura ??
      anyState?.altura ??
      anyState?.avaliacao?.altura ??
      170
  );

  const massaMagraKg =
    anyForm?.massaMagraKg ??
    anyForm?.massaMuscularKg ??
    anyState?.bioimpedancia?.massaMagraKg ??
    anyState?.massaMuscularKg ??
    (anyState?.percentualMassaMuscular != null && pesoKg > 0
      ? (Number(anyState.percentualMassaMuscular) / 100) * pesoKg
      : null) ??
    anyState?.massaMagraKg ??
    null;

  const objetivo = (anyForm?.objetivo ??
    anyState?.objetivo ??
    anyState?.meta ??
    anyState?.perfil?.objetivo ??
    "manutencao") as any;

  const biotipo = (anyForm?.biotipo ??
    anyState?.biotipo ??
    anyState?.avaliacao?.biotipo ??
    null) as any;

  const atividade = (anyForm?.atividade ??
    anyState?.atividade ??
    anyState?.nivelAtividade ??
    anyState?.avaliacao?.frequenciaAtividadeSemanal ??
    "moderado") as any;

  return {
    body: { sexo, idade, pesoKg, alturaCm, massaMagraKg },
    opts: { objetivo, biotipo, atividade },
  };
}

type OnboardingStepProps = {
  value?: any;
  onChange?: (v: any) => void;
  onNext?: () => void;
  onBack?: () => void;
};

export function Step4Nutricao({
  value,
  onChange,
  onNext,
  onBack,
}: OnboardingStepProps) {
  void value;

  const { state, updateState, nextStep } = useDrMindSetfit();
  const { actions: __mfGActions } = useGamification();

  const draft = useMemo(() => loadOnboardingDraftSafe(), []);
  const draftStep1 = draft?.step1 ?? {};
  const draftStep2 = draft?.step2 ?? {};
  const draftStep3 =
    draft?.step3 ??
    draft?.step3Metabolismo ??
    {};

  const [timeZone, setTimeZone] = useState(() => {
    try {
      return localStorage.getItem("mf:user:timezone") || getUserTimeZone();
    } catch {
      return getUserTimeZone();
    }
  });

  const [horaAtual, setHoraAtual] = useState(new Date());

  useEffect(() => {
    const detected = getUserTimeZone();
    setTimeZone((prev) => prev || detected);

    try {
      localStorage.setItem("mf:user:timezone", detected);
    } catch {}
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHoraAtual(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const syncUserTimeZone = () => {
    const detected = getUserTimeZone();
    setTimeZone(detected);

    try {
      localStorage.setItem("mf:user:timezone", detected);
    } catch {}
  };

  useEffect(() => {
    try {
      const kcal = Number(
        (state as any)?.nutricao?.kcalAlvo ??
          (state as any)?.nutrition?.kcalAlvo ??
          0
      );
      if (!kcal || kcal <= 0) return;

      const hasAudit = Boolean(
        (state as any)?.nutricao?.audit || (state as any)?.nutrition?.audit
      );

      __mfGActions.onNutritionPlanSet(hasAudit);
    } catch {}

    try {
      const __kcal = Number(
        (state as any)?.nutricao?.kcalAlvo ??
          (state as any)?.nutricao?.macros?.calorias ??
          (state as any)?.nutrition?.kcalAlvo ??
          (state as any)?.nutrition?.macros?.calorias ??
          0
      );

      const __hasAudit = Boolean(
        (state as any)?.nutricao?.audit ??
          (state as any)?.nutrition?.audit ??
          (state as any)?.macros?.audit ??
          (state as any)?.dieta?.audit
      );

      if (__kcal > 0) {
        mfEvents.emit("nutrition_plan_set", {
          kcal: __kcal,
          hasAudit: __hasAudit,
          ts: new Date().toISOString(),
        });
      }
    } catch {}
  }, [
    __mfGActions,
    (state as any)?.nutricao?.kcalAlvo,
    (state as any)?.nutricao?.macros?.calorias,
    (state as any)?.nutrition?.kcalAlvo,
  ]);

  useOnboardingDraftSaver(
    {
      step4: (state as any).nutricao ?? (state as any).nutrition ?? {},
      nutricao: (state as any).nutricao,
      timezone: timeZone,
    } as any,
    400
  );

  function mfPersistStep4(nutricaoPayload?: any) {
    try {
      const currentNutricao =
        nutricaoPayload ??
        (state as any)?.nutricao ??
        (state as any)?.nutrition ??
        undefined;

      const payload = {
        metabolismo:
          (state as any)?.metabolismo ??
          (state as any)?.resultadoMetabolico ??
          undefined,
        nutricao: currentNutricao,
        dieta:
          currentNutricao ??
          (state as any)?.dieta ??
          (state as any)?.planoDieta ??
          undefined,
        macros:
          currentNutricao?.macros ??
          (state as any)?.nutricao?.macros ??
          (state as any)?.macros ??
          undefined,
        refeicoesSelecionadas:
          currentNutricao?.refeicoesSelecionadas ?? [],
        refeicoes:
          currentNutricao?.refeicoes ?? [],
        timezone: timeZone,
      };

      saveOnboardingProgress({ step: 4, data: payload } as any);
    } catch {}
  }

  function mfOnContinue(nutricaoPayload?: any) {
    try {
      mfPersistStep4(nutricaoPayload);
    } catch {}

    try {
      const inputs = __mfBuildNutritionInputs(state, undefined);
      saveActivePlanNutrition(inputs.body as any, inputs.opts as any);
    } catch {}

    if (typeof onNext === "function") onNext();
    else if (typeof nextStep === "function") nextStep();
  }

  const [estrategia, setEstrategia] = useState<
    "deficit-leve" | "deficit-moderado" | "deficit-agressivo" | "manutencao" | "superavit"
  >("manutencao");

  const pesoFromState =
    toNum((draftStep1 as any)?.peso) ||
    toNum((draftStep1 as any)?.pesoAtual) ||
    toNum((state as any)?.perfil?.peso) ||
    toNum((state as any)?.avaliacao?.peso) ||
    toNum(draftStep2?.peso) ||
    70;

  const alturaFromState =
    toNum((draftStep1 as any)?.altura) ||
    toNum((state as any)?.perfil?.altura) ||
    toNum((state as any)?.avaliacao?.altura) ||
    toNum(draftStep2?.altura) ||
    170;

  const sexoFromState = String(
    (state as any)?.perfil?.sexo ??
      (draftStep1 as any)?.sexo ??
      "masculino"
  ).toLowerCase();

  const idadeFromState = toNum(
    (state as any)?.perfil?.idade ??
      (draftStep1 as any)?.idade ??
      30
  );

  const tmbFromDraftOrState =
    toNum((state as any)?.metabolismo?.tmb) ||
    toNum(draftStep3?.tmb);

  const metaFromDraftOrState =
    toNum((state as any)?.metabolismo?.caloriasAlvo) ||
    toNum((state as any)?.metabolismo?.metaDiaria) ||
    toNum((state as any)?.metabolismo?.get) ||
    toNum(draftStep3?.metaCalorica);

  const computedTmb =
    sexoFromState === "masculino"
      ? 10 * pesoFromState + 6.25 * alturaFromState - 5 * idadeFromState + 5
      : 10 * pesoFromState + 6.25 * alturaFromState - 5 * idadeFromState - 161;

  const tmbBase = Math.round(tmbFromDraftOrState || computedTmb || 0);

  const __mfBaseKcalFromMetabolic =
    metaFromDraftOrState ||
    Math.round(tmbBase * 1.35) ||
    2000;

  const __mfBaseKcal =
    Number(
      (state as any)?.metabolismo?.get ??
        (state as any)?.metabolismo?.GET ??
        (state as any)?.metabolismo?.tdee ??
        (state as any)?.metabolismo?.metaDiaria ??
        0
    ) || __mfBaseKcalFromMetabolic;

  const __mfPercentRaw =
    (state as any)?.nutricao?.percentualEstrategia ??
    (state as any)?.nutricao?.percentual ??
    (state as any)?.nutricao?.strategyPercent ??
    0;

  const __mfPercentFromStrategy = mfStrategyPercent(estrategia);
  const __mfPercent =
    (Number(__mfPercentRaw) || __mfPercentFromStrategy || 0) as number;

  const __mfFaixa = (state as any)?.metabolismo?.faixaSegura
    ? {
        minimo: Number((state as any)?.metabolismo?.faixaSegura?.minimo),
        maximo: Number((state as any)?.metabolismo?.faixaSegura?.maximo),
      }
    : null;

  const __mfKcalAlvo = mfComputeKcalAlvo({
    baseKcal: __mfBaseKcal,
    percent: __mfPercent,
    faixa: __mfFaixa,
  });

  useEffect(() => {
    try {
      const peso =
        Number(
          (draftStep1 as any)?.peso ??
            (draftStep1 as any)?.pesoAtual ??
            (state as any)?.perfil?.peso ??
            (state as any)?.perfil?.pesoKg ??
            (state as any)?.peso ??
            (state as any)?.avaliacao?.peso ??
            draftStep2?.peso ??
            0
        ) || 70;

      const proteina = Math.round(peso * 2);
      const gorduras = Math.round(peso * 1);

      const kcalFixas = proteina * 4 + gorduras * 9;
      const kcalTarget = Math.round(__mfKcalAlvo);
      const kcalRest = Math.max(0, kcalTarget - kcalFixas);
      const carboFix = Math.max(0, Math.round(kcalRest / 4));
      const carboidratos = mfClampSSOT(carboFix, 0, 900);

      const kcalFinal = mfKcalFromMacros(proteina, carboidratos, gorduras);
      const kcalFinalClamped = mfClampSSOT(Math.round(kcalFinal), 800, 6500);

      const __mfGoalType =
        kcalFinalClamped < __mfBaseKcalFromMetabolic
          ? "cut"
          : kcalFinalClamped > __mfBaseKcalFromMetabolic
          ? "bulk"
          : "maintain";

      const __mfGuard = applyNutritionGuardrails({
        tdeeKcal: __mfBaseKcalFromMetabolic,
        goalKcal: kcalFinalClamped,
        goalType: __mfGoalType,
        sex: (state as any)?.avaliacao?.sexo ?? (state as any)?.avaliacao?.sex,
        age: (state as any)?.avaliacao?.idade ?? (state as any)?.avaliacao?.age,
        weightKg:
          (state as any)?.avaliacao?.peso ??
          (draftStep1 as any)?.peso ??
          draftStep2?.peso,
        heightCm:
          (state as any)?.avaliacao?.altura ??
          (draftStep1 as any)?.altura ??
          draftStep2?.altura,
      });

      const kcalGuarded = mfClampSSOT(__mfGuard.kcalTarget, 800, 6500);

      const carboidratosGuarded = (() => {
        if (kcalGuarded === kcalFinalClamped) return carboidratos;
        const kcalRest2 = Math.max(0, kcalGuarded - kcalFixas);
        return Math.max(0, Math.round(kcalRest2 / 4));
      })();

      const __mfWarns: MFWarn[] = [];
      try {
        const ws = Array.isArray(__mfGuard?.warnings)
          ? __mfGuard.warnings
          : [];
        for (const w of ws) {
          __mfWarns.push({
            code: String((w as any)?.code || "GUARDRAIL"),
            message: String((w as any)?.message || "Guardrail aplicado."),
            severity: String((w as any)?.code || "").includes("AGGRESSIVE")
              ? "danger"
              : "warn",
          });
        }
      } catch {}

      const __mfAudit = mfAudit(
        {
          step: "Step4Nutricao",
          tdeeBase: __mfBaseKcalFromMetabolic,
          kcalProposed: kcalFinalClamped,
          kcalGuarded,
          macros: {
            proteina,
            carboidratos: carboidratosGuarded,
            gorduras,
          },
          guardrails: (__mfGuard as any)?.trace,
        },
        __mfWarns
      );

      const kcalFinal2 = mfKcalFromMacros(
        proteina,
        carboidratosGuarded,
        gorduras
      );
      const kcalFinalGuarded = mfClampSSOT(Math.round(kcalFinal2), 800, 6500);

      updateState({
        metabolismo: {
          ...(state as any)?.metabolismo,
          tmb: tmbBase,
          caloriasAlvo: __mfBaseKcalFromMetabolic,
          metaDiaria: __mfBaseKcalFromMetabolic,
          get: __mfBaseKcalFromMetabolic,
        },
        nutricao: {
          ...(state as any)?.nutricao,
          estrategia,
          percentualEstrategia: __mfPercentFromStrategy,
          kcalAlvo: kcalFinalGuarded,
          audit: __mfAudit,
          macros: {
            proteina,
            carboidratos: carboidratosGuarded,
            gorduras,
            calorias: kcalFinalGuarded,
          },
        },
      });
    } catch (e) {
      console.error("[MF] Step4 dynamic kcal strategy error:", e);
    }
  }, [
    estrategia,
    __mfBaseKcalFromMetabolic,
    __mfKcalAlvo,
    state,
    updateState,
    draftStep1,
    draftStep2,
    tmbBase,
  ]);

  const [restricoes, setRestricoes] = useState<Restricao[]>([]);
  const [refeicoesSelecionadas, setRefeicoesSelecionadas] = useState<
    TipoRefeicao[]
  >(["cafe-da-manha", "almoco", "lanche-tarde", "jantar"]);

  const refeicoesDiponiveis: {
    value: TipoRefeicao;
    label: string;
    horarioPadrao: string;
  }[] = [
    { value: "desjejum", label: "Desjejum", horarioPadrao: "06:00" },
    { value: "cafe-da-manha", label: "Café da Manhã", horarioPadrao: "08:00" },
    { value: "almoco", label: "Almoço", horarioPadrao: "12:00" },
    { value: "lanche-tarde", label: "Lanche da Tarde", horarioPadrao: "16:00" },
    { value: "jantar", label: "Jantar", horarioPadrao: "20:00" },
    { value: "ceia", label: "Ceia", horarioPadrao: "22:00" },
  ];

  const restricoesDisponiveis: { value: Restricao; label: string }[] = [
    { value: "lactose", label: "Lactose" },
    { value: "gluten", label: "Glúten" },
    { value: "ovo", label: "Ovo" },
    { value: "acucar", label: "Açúcar" },
    { value: "oleaginosas", label: "Oleaginosas" },
    { value: "vegetariano", label: "Vegetariano" },
    { value: "vegano", label: "Vegano" },
    { value: "low-sodium", label: "Baixo sódio" },
    { value: "diabetes", label: "Diabetes" },
  ];

  const toggleRefeicao = (refeicao: TipoRefeicao) => {
    if (refeicoesSelecionadas.includes(refeicao)) {
      setRefeicoesSelecionadas(refeicoesSelecionadas.filter((r) => r !== refeicao));
    } else {
      setRefeicoesSelecionadas([...refeicoesSelecionadas, refeicao]);
    }
  };

  const toggleRestricao = (restricao: Restricao) => {
    if (restricoes.includes(restricao)) {
      setRestricoes(restricoes.filter((r) => r !== restricao));
    } else {
      setRestricoes([...restricoes, restricao]);
    }
  };

  const pesoAtual =
    toNum((draftStep1 as any)?.peso, 0) ||
    toNum((state as any)?.avaliacao?.peso, 0) ||
    toNum(draftStep2?.peso, 70);

  const proteinaPreview = Math.round(pesoAtual * 2);
  const gorduraPreview = Math.round(pesoAtual * 1);
  const carboPreview = Math.round(
    ((__mfKcalAlvo || 2000) - (proteinaPreview * 4 + gorduraPreview * 9)) / 4
  );

  const safeFaixaMin = Number(__mfFaixa?.minimo ?? Math.round(__mfKcalAlvo * 0.92));
  const safeFaixaMax = Number(__mfFaixa?.maximo ?? Math.round(__mfKcalAlvo * 1.08));
  const tmb = tmbBase || Math.round(__mfBaseKcal * 0.66);

  const strategyCards = [
    {
      key: "deficit-agressivo",
      title: "Déficit agressivo",
      desc: "Maior redução calórica",
    },
    {
      key: "deficit-moderado",
      title: "Déficit moderado",
      desc: "Equilíbrio entre resultado e aderência",
    },
    {
      key: "deficit-leve",
      title: "Déficit leve",
      desc: "Mais sustentável para constância",
    },
    {
      key: "manutencao",
      title: "Manutenção",
      desc: "Estabilidade e ajuste fino",
    },
    {
      key: "superavit",
      title: "Superávit",
      desc: "Apoio para ganho de massa",
    },
  ] as const;

  const gerarPlanejamento = () => {
    try {
      const caloriasBase = state.metabolismo?.caloriasAlvo || __mfKcalAlvo || 2000;
      const peso =
        (draftStep1 as any)?.peso ||
        state.avaliacao?.peso ||
        draftStep2?.peso ||
        70;

      const pct = mfStrategyPercent(estrategia);
      const caloriasAjustadas = caloriasBase * (1 + pct / 100);

      const proteina = Math.round(Number(peso) * 2);
      const gorduras = Math.round(Number(peso) * 1);

      const kcalFixas = proteina * 4 + gorduras * 9;
      const kcalTarget = Math.round(caloriasAjustadas);
      const kcalRest = Math.max(0, kcalTarget - kcalFixas);
      const carboFix = Math.max(0, Math.round(kcalRest / 4));
      const carboidratos = mfClampSSOT(carboFix, 0, 900);

      const kcalFinal = mfKcalFromMacros(proteina, carboidratos, gorduras);
      const caloriasFinais = mfClampSSOT(Math.round(kcalFinal), 800, 6500);

      try {
        const inputs = __mfBuildNutritionInputs(state, undefined);
        saveActivePlanNutrition(inputs.body as any, inputs.opts as any);
      } catch {}

      const refeicoesPreview = refeicoesSelecionadas.map((tipoRefeicao) => {
        const infoRefeicao = refeicoesDiponiveis.find(
          (r) => r.value === tipoRefeicao
        )!;

        return {
          tipo: tipoRefeicao,
          horario: infoRefeicao.horarioPadrao,
          nome: infoRefeicao.label,
          alimentos: [],
        };
      });

      const planejamento: PlanejamentoNutricional = {
        estrategia,
        percentualEstrategia: mfStrategyPercent(estrategia),
        kcalAlvo: Math.round(caloriasFinais),
        restricoes,
        macros: {
          proteina,
          gorduras,
          carboidratos,
          calorias: Math.round(caloriasFinais),
        },
        refeicoesSelecionadas,
        refeicoes: refeicoesPreview,
      };

      updateState({
        metabolismo: {
          ...(state as any)?.metabolismo,
          tmb: tmbBase,
          caloriasAlvo: __mfBaseKcalFromMetabolic,
          metaDiaria: __mfBaseKcalFromMetabolic,
          get: __mfBaseKcalFromMetabolic,
        },
        nutricao: planejamento,
        dieta: planejamento,
        planoDieta: planejamento,
      } as any);

      try {
        if (typeof onChange === "function") {
          onChange(planejamento);
        }
      } catch {}

      try {
        saveOnboardingProgress({
          step: 4,
          data: {
            metabolismo: {
              tmb: tmbBase,
              caloriasAlvo: __mfBaseKcalFromMetabolic,
              metaDiaria: __mfBaseKcalFromMetabolic,
              get: __mfBaseKcalFromMetabolic,
            },
            nutricao: planejamento,
            dieta: planejamento,
            macros: planejamento?.macros,
            refeicoesSelecionadas: planejamento?.refeicoesSelecionadas ?? [],
            refeicoes: planejamento?.refeicoes ?? [],
            timezone: timeZone,
          },
        } as any);
      } catch {}

      mfOnContinue(planejamento);
    } catch (e) {
      console.error("[MF] erro ao gerar planejamento:", e);
    }
  };

  const nextMealPreview = useMemo(() => {
    const selectedMeals = refeicoesDiponiveis
      .filter((r) => refeicoesSelecionadas.includes(r.value))
      .map((meal) => ({
        ...meal,
        minutes: timeStringToMinutes(meal.horarioPadrao),
      }))
      .filter((meal) => meal.minutes != null)
      .sort((a, b) => a.minutes! - b.minutes!);

    if (!selectedMeals.length) return null;

    const currentTime = formatTimeInZone(horaAtual, timeZone);
    const currentMinutes = timeStringToMinutes(currentTime);

    if (currentMinutes == null) {
      return selectedMeals[0];
    }

    const nextToday = selectedMeals.find((meal) => meal.minutes! >= currentMinutes);
    return nextToday ?? selectedMeals[0];
  }, [refeicoesSelecionadas, horaAtual, timeZone]);

  return (
    <div className="w-full text-white" data-testid="mf-step-root">
      <div className="space-y-6">
        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00D7FF] shadow-[0_0_20px_rgba(0,149,255,0.22)]">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-[22px] font-semibold tracking-tight text-white">
                Faixa calórica segura
              </h3>
              <p className="mt-1 text-[13px] leading-5 text-white/48">
                Base científica para definir calorias e macros com segurança.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-4">
              <div className="text-[12px] text-white/45">TMB (repouso)</div>
              <div className="mt-2 text-[38px] leading-none font-semibold tracking-tight text-[#58AFFF]">
                {tmb}
                <span className="ml-1 text-[18px] text-white/40">kcal</span>
              </div>
              <div className="mt-3 text-[12px] leading-5 text-white/40">
                Energia mínima para função vital.
              </div>
            </div>

            <div className="rounded-[20px] border border-emerald-400/40 bg-black/20 px-4 py-4 shadow-[0_0_24px_rgba(34,197,94,0.08)]">
              <div className="text-[12px] text-white/45">Meta calórica</div>
              <div className="mt-2 text-[38px] leading-none font-semibold tracking-tight text-emerald-400">
                {__mfKcalAlvo}
                <span className="ml-1 text-[18px] text-white/40">kcal</span>
              </div>
              <div className="mt-3 text-[12px] leading-5 text-white/40">
                Inclui rotina e nível metabólico ativo.
              </div>
            </div>
          </div>

          <div className="mt-5 h-[4px] w-full overflow-hidden rounded-full bg-[#403400]">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-[#E6B800] via-[#F4D000] to-[#E6B800]" />
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-4 flex items-center gap-2">
            <Flame className="h-4 w-4 text-cyan-300" />
            <h3 className="text-[18px] font-semibold text-white">
              Caloria segura
            </h3>
          </div>

          <p className="mb-4 text-[12px] leading-5 text-white/45">
            Faixa de consumo otimizada para constância, energia e aderência.
          </p>

          <div className="space-y-2">
            {[
              { label: "Cunningham", value: safeFaixaMax - 10 },
              { label: "FAO/WHO", value: safeFaixaMin + 20 },
              { label: "Harris Benedict", value: Math.round((safeFaixaMin + safeFaixaMax) / 2) },
              { label: "Mifflin-St Jeor", value: __mfKcalAlvo, active: true },
              { label: "Tinsley", value: safeFaixaMax + 30 },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/20 px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[14px] text-white/75">{item.label}</span>
                  {item.active && (
                    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] text-emerald-300">
                      Recomendada
                    </span>
                  )}
                </div>
                <div className="text-[14px] font-semibold text-white">
                  {item.value} kcal
                </div>
              </div>
            ))}
          </div>

          <p className="mt-3 text-[11px] text-white/35">
            Variação normal entre fórmulas. O plano final respeita guardrails metabólicos.
          </p>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-4">
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              Estratégia calórica
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-white/48">
              Escolha a intensidade do ajuste do seu plano.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {strategyCards.map((item) => {
              const active = estrategia === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setEstrategia(item.key)}
                  className={[
                    "w-full rounded-[20px] border px-4 py-3 text-left transition-all",
                    active
                      ? "border-emerald-400/40 bg-emerald-400/10 shadow-[0_0_24px_rgba(34,197,94,0.08)]"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={[
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                        active
                          ? "border-emerald-400 bg-emerald-400 text-black"
                          : "border-white/20 bg-transparent text-transparent",
                      ].join(" ")}
                    >
                      <Check className="h-3 w-3" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold text-white">
                        {item.title}
                      </div>
                      <div className="mt-1 text-[12px] leading-5 text-white/50">
                        {item.desc}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-4">
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              Estrutura do seu dia
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-white/48">
              Escolha só o que você realmente consegue sustentar.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {refeicoesDiponiveis.map((ref) => {
              const active = refeicoesSelecionadas.includes(ref.value);
              return (
                <button
                  key={ref.value}
                  type="button"
                  onClick={() => toggleRefeicao(ref.value)}
                  className={[
                    "rounded-[20px] border px-4 py-4 text-left transition-all",
                    active
                      ? "border-cyan-400/35 bg-cyan-400/10 shadow-[0_0_24px_rgba(0,183,255,0.08)]"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                  ].join(" ")}
                >
                  <div className="text-[14px] font-semibold text-white">{ref.label}</div>
                  <div className="mt-1 text-[12px] text-white/45">{ref.horarioPadrao}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 text-[12px] text-white/40">
            {refeicoesSelecionadas.length} refeições selecionadas
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-4">
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              Restrições e preferências
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-white/48">
              Opcional. Isso ajuda o plano a fazer sentido para sua rotina.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {restricoesDisponiveis.map((rest) => {
              const active = restricoes.includes(rest.value);
              return (
                <button
                  key={rest.value}
                  type="button"
                  onClick={() => toggleRestricao(rest.value)}
                  className={[
                    "flex items-center gap-2 rounded-[18px] border px-3 py-3 text-left transition-all",
                    active
                      ? "border-emerald-400/35 bg-emerald-400/10"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                  ].join(" ")}
                >
                  <Checkbox
                    checked={active}
                    onCheckedChange={() => toggleRestricao(rest.value)}
                  />
                  <Label className="cursor-pointer text-[13px] text-white">
                    {rest.label}
                  </Label>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-[18px] font-semibold text-white">
                Horário local do plano
              </h3>
              <p className="mt-1 text-[13px] leading-5 text-white/48">
                Usamos seu fuso atual para estimar corretamente a próxima refeição.
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={syncUserTimeZone}
              className="rounded-[16px] border border-white/15 bg-black/20 text-white hover:bg-white/5"
            >
              Usar meu fuso atual
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <div className="text-[12px] text-white/45">Hora local</div>
              <div className="mt-2 text-[24px] font-semibold text-cyan-300">
                {formatTimeInZone(horaAtual, timeZone)}
              </div>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <div className="text-[12px] text-white/45">Data local</div>
              <div className="mt-2 text-[16px] font-semibold text-white capitalize">
                {formatDateInZone(horaAtual, timeZone)}
              </div>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <div className="text-[12px] text-white/45">Fuso detectado</div>
              <div className="mt-2 text-[14px] font-semibold text-white break-all">
                {timeZone}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
          <div className="mb-4">
            <h3 className="text-[22px] font-semibold tracking-tight text-white">
              Prévia do plano alimentar
            </h3>
            <p className="mt-1 text-[13px] leading-5 text-white/48">
              Estimativa inicial de macros e próximo momento alimentar.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <div className="text-[12px] text-white/45">Proteína</div>
              <div className="mt-2 text-[24px] font-semibold text-white">
                {proteinaPreview}g
              </div>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <div className="text-[12px] text-white/45">Carbos</div>
              <div className="mt-2 text-[24px] font-semibold text-white">
                ~{Math.max(0, carboPreview)}g
              </div>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <div className="text-[12px] text-white/45">Gorduras</div>
              <div className="mt-2 text-[24px] font-semibold text-white">
                {gorduraPreview}g
              </div>
            </div>

            <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
              <div className="text-[12px] text-white/45">Próxima refeição</div>
              <div className="mt-2 text-[16px] font-semibold text-white">
                {nextMealPreview?.label ?? "Plano inicial"}
              </div>
              <div className="mt-1 text-[12px] text-white/40">
                {nextMealPreview?.horarioPadrao ?? "—"}
              </div>
            </div>
          </div>
        </section>

        <div className="pt-1 flex gap-3">
          {onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="h-14 w-[120px] rounded-[20px] border border-white/15 bg-black/20 text-white hover:bg-white/5"
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Voltar
            </Button>
          )}

          <Button
            type="button"
            onClick={gerarPlanejamento}
            disabled={refeicoesSelecionadas.length === 0}
            variant="ghost"
            className="h-14 flex-1 overflow-hidden rounded-[20px] border-0 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] transition-all hover:brightness-110 hover:bg-transparent disabled:opacity-50"
          >
            Gerar planejamento
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Step4Nutricao;
