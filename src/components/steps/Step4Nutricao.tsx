// MF_ONBOARDING_CONTRACT_V1
// MF_STEP4_DYNAMIC_KCAL_STRATEGY_V1
// MF_STEP4_KCAL_SSOT_V1
// REGRA_FIXA_NO_HEALTH_CONTEXT_STEP: nunca criar etapa de Segurança/Contexto de saúde/Sinais do corpo.
// PREMIUM_REFINEMENT_PHASE2_1: copy clara, validação explícita, feedback visual, sem sobrecarga cognitiva.

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { ArrowRight, UtensilsCrossed, Check } from "lucide-react";
import type {
  PlanejamentoNutricional,
  Restricao,
  TipoRefeicao,
  AlimentoRefeicao,
} from "@/types";
import { ALIMENTOS_DATABASE, calcularMacros } from "@/types/alimentos";
import { saveOnboardingProgress } from "@/lib/onboardingProgress";
import { saveActivePlanNutrition } from "@/services/plan/activePlanNutrition.writer";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { applyNutritionGuardrails } from "@/services/nutrition/guardrails";
import { mfAudit, type MFWarn } from "@/services/audit/mfAudit";
import { useGamification } from "@/hooks/useGamification/useGamification";
import { mfEvents } from "@/services/events/mfEvents";

// ===== Helpers gerais =====
const mfClampSSOT = (n: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, n));

// SSOT kcal alvo (base + % + faixa segura)
const mfComputeKcalAlvo = (opts: {
  baseKcal: number;
  percent: number; // ex: -15, 0, +10
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

// kcal a partir de macros
const mfKcalFromMacros = (p: number, c: number, g: number) =>
  p * 4 + c * 4 + g * 9;

// % por estratégia
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

// NUTRITION_WIRE_V1
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
      70
  );
  const alturaCm = Number(
    anyForm?.altura ??
      anyForm?.alturaCm ??
      anyState?.perfil?.altura ??
      anyState?.altura ??
      170
  );
  const massaMagraKg =
    anyForm?.massaMagraKg ??
    anyState?.bioimpedancia?.massaMagraKg ??
    anyState?.massaMagraKg ??
    null;

  const objetivo = (anyForm?.objetivo ??
    anyState?.objetivo ??
    anyState?.meta ??
    "manutencao") as any;
  const biotipo = (anyForm?.biotipo ?? anyState?.biotipo ?? null) as any;
  const atividade = (anyForm?.atividade ??
    anyState?.atividade ??
    anyState?.nivelAtividade ??
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
  void onChange;
  void onBack;

  const { state, updateState, nextStep } = useDrMindSetfit();

  // GAMIFICAÇÃO
  const { actions: __mfGActions } = useGamification();

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
      if (__kcal > 0)
        mfEvents.emit("nutrition_plan_set", {
          kcal: __kcal,
          hasAudit: __hasAudit,
          ts: new Date().toISOString(),
        });
    } catch {}
  }, [
    __mfGActions,
    (state as any)?.nutricao?.kcalAlvo,
    (state as any)?.nutricao?.macros?.calorias,
    (state as any)?.nutrition?.kcalAlvo,
  ]);

  // Autosave leve
  const __mf_step4_payload = {
    step4: (state as any).nutricao ?? (state as any).nutrition ?? {},
    nutricao: (state as any).nutricao,
  };
  useOnboardingDraftSaver(__mf_step4_payload as any, 400);

  // Persistência Step4
  function mfPersistStep4() {
    try {
      const payload = {
        metabolismo:
          (state as any)?.metabolismo ??
          (state as any)?.resultadoMetabolico ??
          undefined,
        dieta:
          (state as any)?.dieta ?? (state as any)?.planoDieta ?? undefined,
        macros: (state as any)?.macros ?? undefined,
      };
      saveOnboardingProgress({ step: 4, data: payload } as any);
    } catch {}
  }

  function mfOnContinue() {
    try {
      mfPersistStep4();
    } catch {}
    try {
      const inputs = __mfBuildNutritionInputs(state, undefined);
      saveActivePlanNutrition(inputs.body as any, inputs.opts as any);
    } catch {}
    // 👉 agora prioriza o onNext passado pelo shell (ordem correta das rotas)
    if (typeof onNext === "function") onNext();
    else if (typeof nextStep === "function") nextStep();
  }

  // =========================
  // Estratégia + Kcal alvo
  // =========================
  const [estrategia, setEstrategia] = useState<
    "deficit-leve" | "deficit-moderado" | "deficit-agressivo" | "manutencao" | "superavit"
  >("manutencao");

  // Base metabólica para estratégia dinâmica
  const __mfBaseKcalFromMetabolic =
    Number(
      (state as any)?.metabolismo?.caloriasAlvo ??
        (state as any)?.metabolismo?.get ??
        0
    ) || 2000;

  // Kcal alvo exibida (resultado do motor + estratégia + faixa segura)
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

  // Efeito: recalcula macros + guardrails quando muda estratégia
  useEffect(() => {
    try {
      const peso =
        Number(
          (state as any)?.perfil?.peso ??
            (state as any)?.perfil?.pesoKg ??
            (state as any)?.peso ??
            0
        ) || 70;
      const proteina = Math.round(peso * 2); // 2g/kg
      const gorduras = Math.round(peso * 1); // 1g/kg

      const kcalFixas = proteina * 4 + gorduras * 9;
      const kcalTarget = Math.round(__mfKcalAlvo);
      const kcalRest = Math.max(0, kcalTarget - kcalFixas);
      const carboFix = Math.max(0, Math.round(kcalRest / 4));
      const carboidratos = mfClampSSOT(carboFix, 0, 900);

      const kcalFinal = mfKcalFromMacros(proteina, carboidratos, gorduras);
      const kcalFinalClamped = mfClampSSOT(
        Math.round(kcalFinal),
        800,
        6500
      );

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
        weightKg: (state as any)?.avaliacao?.peso,
        heightCm: (state as any)?.avaliacao?.altura,
      });

      const kcalGuarded = mfClampSSOT(__mfGuard.kcalTarget, 800, 6500);

      const carboidratosGuarded = (() => {
        if (kcalGuarded === kcalFinalClamped) return carboidratos;
        const kcalRest2 = Math.max(0, kcalGuarded - kcalFixas);
        const carboFix2 = Math.max(0, Math.round(kcalRest2 / 4));
        return carboFix2;
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

      const __mfAudit: ReturnType<typeof mfAudit> = mfAudit(
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
      const kcalFinalGuarded = mfClampSSOT(
        Math.round(kcalFinal2),
        800,
        6500
      );

      updateState({
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
  }, [estrategia, __mfBaseKcalFromMetabolic, __mfKcalAlvo, state, updateState]);

  // =========================
  // Refeições e restrições
  // =========================
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
    { value: "low-sodium", label: "Baixo Sódio" },
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

  // =========================
  // Geração do planejamento
  // =========================
  const gerarPlanejamento = () => {
    try {
      const calorias = state.metabolismo?.caloriasAlvo || __mfKcalAlvo || 2000;
      const peso = state.avaliacao?.peso || 70;

      // Ajuste calórico baseado na estratégia
      let caloriasFinais = calorias;
      const pct = mfStrategyPercent(estrategia);
      caloriasFinais = calorias * (1 + pct / 100);

      // Macronutrientes-base
      const proteina = Math.round(peso * 2); // 2g/kg
      const gorduras = Math.round(peso * 1); // 1g/kg
      const kcalFixas = proteina * 4 + gorduras * 9;

      const kcalTarget = Math.round(caloriasFinais);
      const kcalRest = Math.max(0, kcalTarget - kcalFixas);
      const carboFix = Math.max(0, Math.round(kcalRest / 4));
      const carboidratos = mfClampSSOT(carboFix, 0, 900);

      const kcalFinal = mfKcalFromMacros(proteina, carboidratos, gorduras);
      caloriasFinais = mfClampSSOT(Math.round(kcalFinal), 800, 6500);

      // salvar inputs ativos
      try {
        const inputs = __mfBuildNutritionInputs(state, undefined);
        saveActivePlanNutrition(inputs.body as any, inputs.opts as any);
      } catch {}

      // Helper seguro p/ adicionar alimento
      let alimentosPermitidos = ALIMENTOS_DATABASE;
      const isVegano = restricoes.includes("vegano");
      const isVegetariano = restricoes.includes("vegetariano");

      if (isVegano) {
        alimentosPermitidos = alimentosPermitidos.filter((a) => a.vegano);
      } else if (isVegetariano) {
        alimentosPermitidos = alimentosPermitidos.filter((a) => a.vegetariano);
      }

      const addAlimento = (
        lista: AlimentoRefeicao[],
        alimentoId: string,
        gramas: number
      ) => {
        const base = alimentosPermitidos.find((a) => a.id === alimentoId);
        if (!base) return;
        const macros = calcularMacros(base.id, gramas);
        if (!macros) return;
        lista.push({
          ...macros,
          alimentoId: base.id,
          nome: base.nome,
          gramas,
        });
      };

      // Montar refeições
      const refeicoes = refeicoesSelecionadas.map((tipoRefeicao) => {
        const infoRefeicao = refeicoesDiponiveis.find(
          (r) => r.value === tipoRefeicao
        )!;

        const alimentos: AlimentoRefeicao[] = [];

        if (tipoRefeicao === "desjejum" || tipoRefeicao === "cafe-da-manha") {
          const gramasAveia = 50;
          const gramasBanana = 100;
          const gramasIogurte = isVegano ? 100 : 150;
          const gramasCastanhas = 20;

          addAlimento(alimentos, "aveia", gramasAveia);
          addAlimento(alimentos, "banana", gramasBanana);
          addAlimento(
            alimentos,
            isVegano ? "tofu" : "iogurte-grego",
            gramasIogurte
          );
          addAlimento(alimentos, "castanhas", gramasCastanhas);
        } else if (tipoRefeicao === "almoco" || tipoRefeicao === "jantar") {
          const gramasArroz = 150;
          const gramasProteina = 150;
          const gramasLegume = 100;
          const gramasFolhoso = 50;
          const gramasGordura = 10;

          addAlimento(alimentos, "arroz-integral", gramasArroz);
          addAlimento(
            alimentos,
            isVegano ? "tofu" : "frango-peito",
            gramasProteina
          );
          addAlimento(alimentos, "brocolis", gramasLegume);
          addAlimento(alimentos, "alface", gramasFolhoso);
          addAlimento(alimentos, "azeite", gramasGordura);
        } else if (tipoRefeicao === "lanche-tarde") {
          const gramasFruta = 150;
          const gramasProteina = isVegano ? 100 : 150;
          const gramasGordura = 20;

          addAlimento(alimentos, "maca", gramasFruta);
          addAlimento(
            alimentos,
            isVegano ? "tofu" : "iogurte-grego",
            gramasProteina
          );
          addAlimento(alimentos, "castanhas", gramasGordura);
        } else if (tipoRefeicao === "ceia") {
          const gramasProteina = 100;
          const gramasFruta = 100;

          addAlimento(
            alimentos,
            isVegano ? "tofu" : "queijo-cottage",
            gramasProteina
          );
          addAlimento(alimentos, "morango", gramasFruta);
        }

        return {
          tipo: tipoRefeicao,
          horario: infoRefeicao.horarioPadrao,
          nome: infoRefeicao.label,
          alimentos,
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
        refeicoes,
      };

      updateState({ nutricao: planejamento });

      try {
        const _plano =
          typeof planejamento !== "undefined"
            ? (planejamento as any)
            : undefined;
        if (_plano) {
          updateState?.({
            ...(typeof state === "object" ? state : {}),
            dieta: (state as any)?.dieta ?? _plano,
            planoDieta: (state as any)?.planoDieta ?? _plano,
          } as any);
        }
      } catch {}

      // depois de gerar, avança
      mfOnContinue();
    } catch (e) {
      console.error("[MF] erro ao gerar planejamento:", e);
    }
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8" data-testid="mf-step-root">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Nutrição e aderência
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Aqui a gente calibra seu plano alimentar para ser eficiente e
          sustentável. Preferências, rotina e restrições aumentam a aderência —
          e aderência é o que dá resultado. O sistema usa seu gasto diário e
          objetivo para definir calorias e macros de forma coerente.
        </p>
      </div>

      <div className="mb-6 sm:mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] mb-3 sm:mb-4">
          <UtensilsCrossed className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Plano alimentar</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Ajuste para sua rotina e objetivo
        </p>
      </div>

      {/* Meta Calórica */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Calorias alvo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 sm:py-6">
            <p className="text-4xl sm:text-5xl font-bold text-white">
              {__mfKcalAlvo}
            </p>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">
              calorias por dia
            </p>

            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-wider text-gray-400">
                Ajuste inteligente
              </div>
              <div className="mt-1 text-sm text-white/90">
                Nós fechamos suas calorias com macros consistentes e aplicamos
                limites de segurança para evitar extremos (proteína e gordura
                mínimas/máximas). Isso melhora aderência, energia e
                sustentabilidade.
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-gray-400">Se sentir fome</div>
                  <div className="text-sm text-white/90">
                    aumente volume alimentar (saladas, legumes, sopas), água e
                    fibra.
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-gray-400">
                    Se cair energia
                  </div>
                  <div className="text-sm text-white/90">
                    priorize carbo em torno do treino e sono. Ajustes são
                    ilimitados no app.
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-gray-400">
                    Se travar 10–14 dias
                  </div>
                  <div className="text-sm text-white/90">
                    revise passos, NEAT e consistência. Depois ajuste o
                    déficit/superávit.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estratégia */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Estratégia</CardTitle>
          <CardDescription className="text-sm">
            Como ajustar suas calorias com segurança{" "}
            <span className="text-xs text-muted-foreground">
              • Guardrails premium: macros consistentes e faixa segura.
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="text-sm sm:text-base">Escolha a abordagem</Label>
          <Select
            value={estrategia}
            onValueChange={(v: string) =>
              setEstrategia(v as typeof estrategia)
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deficit-agressivo">
                Déficit Agressivo (-25%)
              </SelectItem>
              <SelectItem value="deficit-moderado">
                Déficit Moderado (-20%)
              </SelectItem>
              <SelectItem value="deficit-leve">
                Déficit Leve (-10%)
              </SelectItem>
              <SelectItem value="manutencao">
                Manutenção (0%)
              </SelectItem>
              <SelectItem value="superavit">Superávit (+15%)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Seleção de Refeições */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Refeições do seu dia
          </CardTitle>
          <CardDescription className="text-sm">
            Selecione somente o que você consegue sustentar no dia a dia
            (quanto mais realista, melhor).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {refeicoesDiponiveis.map((ref) => (
              <div
                key={ref.value}
                onClick={() => toggleRefeicao(ref.value)}
                className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  refeicoesSelecionadas.includes(ref.value)
                    ? "border-[#1E6BFF] bg-white/5 border border-white/10"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm sm:text-base">
                      {ref.label}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {ref.horarioPadrao}
                    </p>
                  </div>
                  {refeicoesSelecionadas.includes(ref.value) && (
                    <Check className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-3">
            {refeicoesSelecionadas.length} refeições selecionadas
          </p>
        </CardContent>
      </Card>

      {/* Restrições */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Restrições e preferências
          </CardTitle>
          <CardDescription className="text-sm">
            Opcional — usamos isso para evitar sugestões que não fazem sentido
            para você.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {restricoesDisponiveis.map((rest) => (
              <div
                key={rest.value}
                onClick={() => toggleRestricao(rest.value)}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Checkbox
                  checked={restricoes.includes(rest.value)}
                  onCheckedChange={() => toggleRestricao(rest.value)}
                />
                <Label className="text-sm cursor-pointer">
                  {rest.label}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Macros Preview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">
            Prévia de macros
          </CardTitle>
          <CardDescription className="text-sm">
            Estimativa inicial baseada no seu peso e na meta calórica. Você
            ajusta ao longo do acompanhamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Proteína
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {Math.round((state.avaliacao?.peso || 70) * 2)}g
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Gorduras
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                {Math.round((state.avaliacao?.peso || 70) * 1)}g
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">
                Carbos
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white">
                ~
                {Math.round(
                  ((__mfKcalAlvo || 2000) -
                    ((state.avaliacao?.peso || 70) * 2 * 4 +
                      (state.avaliacao?.peso || 70) * 1 * 9)) /
                    4
                )}
                g
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botão principal */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
        <Button
          type="button"
          size="lg"
          onClick={gerarPlanejamento}
          disabled={refeicoesSelecionadas.length === 0}
          className="w-full sm:flex-1 bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF]"
        >
          Gerar planejamento
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}