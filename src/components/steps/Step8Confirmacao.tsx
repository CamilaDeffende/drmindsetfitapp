// MF_ONBOARDING_CONTRACT_V1
// PREMIUM_REFINEMENT_PHASE3_STEP8_UI_V4
// FIX_STEP8_NUTRICAO_SOURCE_V2
// WEEKLY_DAYS_BY_MODALITY_SUMMARY_V1

import { useMemo } from "react";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Check } from "lucide-react";

type Props = {
  summary: any;
  onConfirm: () => void;
  onBack?: () => void;
};

const MODALITY_LABELS: Record<string, string> = {
  musculacao: "Musculação",
  corrida: "Corrida",
  bike: "Bike",
  funcional: "Funcional",
  cross: "Cross",
};

export default function Step8Confirmacao({
  summary,
  onConfirm,
  onBack,
}: Props) {
  const { state } = useDrMindSetfit();
  const step4 = (summary as any)?.step4 ?? {};
  const step4Nutrition =
    step4?.nutricao ??
    step4?.nutrition ??
    step4?.dieta ??
    step4?.planoDieta ??
    step4 ??
    {};

  const metabolismo =
    (state as any)?.metabolismo ??
    (state as any)?.resultadoMetabolico ??
    {};

  const nutricao =
    (state as any)?.nutricao &&
    Object.keys((state as any).nutricao).length
      ? (state as any).nutricao
      : step4Nutrition;

  const summaryMacros =
    step4Nutrition?.macros ??
    step4?.macros ??
    {};
  const summaryRefeicoes: any[] = Array.isArray(step4Nutrition?.refeicoes)
    ? step4Nutrition.refeicoes
    : Array.isArray(step4Nutrition?.meals)
      ? step4Nutrition.meals
      : Array.isArray(step4?.refeicoes)
        ? step4.refeicoes
        : Array.isArray(step4?.meals)
          ? step4.meals
          : [];

  const kcalAlvo: number | null =
    nutricao?.kcalAlvo ??
    nutricao?.calorias ??
    nutricao?.macros?.calorias ??
    summaryMacros?.calorias ??
    step4Nutrition?.kcalAlvo ??
    step4Nutrition?.calorias ??
    step4?.kcalAlvo ??
    metabolismo?.caloriasAlvo ??
    metabolismo?.get ??
    null;

  const tmb: number | null = metabolismo?.tmb ?? null;

  const macros =
    (nutricao?.macros && Object.keys(nutricao.macros).length
      ? nutricao.macros
      : summaryMacros) ?? {};

  const proteina: number | null =
    macros?.proteina != null
      ? Number(macros.proteina)
      : macros?.proteinas != null
      ? Number(macros.proteinas)
      : macros?.protein != null
      ? Number(macros.protein)
      : null;

  const carboidratos: number | null =
    macros?.carboidratos != null
      ? Number(macros.carboidratos)
      : macros?.carbo != null
      ? Number(macros.carbo)
      : macros?.carbs != null
      ? Number(macros.carbs)
      : null;

  const gorduras: number | null =
    macros?.gorduras != null
      ? Number(macros.gorduras)
      : macros?.gordura != null
      ? Number(macros.gordura)
      : macros?.fat != null
      ? Number(macros.fat)
      : null;

  const refeicoes: any[] = Array.isArray(nutricao?.refeicoes)
    ? nutricao.refeicoes
    : Array.isArray(nutricao?.meals)
      ? nutricao.meals
      : summaryRefeicoes
        ? summaryRefeicoes
    : [];

  const proximaRefeicao = useMemo(() => {
    if (!refeicoes.length) return null;
    return refeicoes[0];
  }, [refeicoes]);

  const step1 = (summary as any)?.step1 ?? {};
  const step5 = (summary as any)?.step5 ?? {};
  const step6 = (summary as any)?.step6 ?? {};
  const step7 = (summary as any)?.step7 ?? {};

  const objetivoLabelMap: Record<string, string> = {
    emagrecimento: "Emagrecimento",
    reposicao: "Recomposição corporal",
    hipertrofia: "Hipertrofia",
    performance: "Performance",
    longevidade: "Saúde / longevidade",
  };

  const dietaLabelMap: Record<string, string> = {
    flexivel: "Flexível",
    onivoro: "Onívoro",
    lowcarb: "Low carb",
    vegetariano: "Vegetariano",
    vegano: "Vegano",
  };

  const objetivoLabel =
    objetivoLabelMap[step1?.objetivo] ?? "Não informado";

  const selectedModalities: string[] = Array.isArray(step5?.modalidades)
    ? step5.modalidades
    : Array.isArray(step5?.selected)
    ? step5.selected
    : [step5?.primary, step5?.secondary].filter(Boolean);

  const modalidadePrincipalLabel =
    MODALITY_LABELS[step5?.primary] ??
    step5?.primary ??
    step1?.modalidadePrincipal ??
    "Não informado";

  const dietaLabel =
    dietaLabelMap[step7?.dieta] ?? "Flexível";

  const weeklyDaysByModality =
    (step5?.diasPorModalidade as Record<string, string[]>) ??
    (step6?.weeklyDaysByModality as Record<string, string[]>) ??
    {};

  const groupedDaysSummary = selectedModalities.map((modalityId) => ({
    modalityId,
    label: MODALITY_LABELS[modalityId] ?? modalityId,
    days: Array.isArray(weeklyDaysByModality?.[modalityId])
      ? weeklyDaysByModality[modalityId]
      : [],
  }));

  const fallbackDays = Array.isArray(step6?.days) ? step6.days : [];

  const diasTreinoLabel =
    groupedDaysSummary.length > 0
      ? groupedDaysSummary
          .map((item) =>
            `${item.label}: ${
              item.days.length > 0
                ? item.days.map((d: string) => d.toUpperCase()).join(" • ")
                : "sem dias"
            }`
          )
          .join(" | ")
      : fallbackDays.length > 0
      ? fallbackDays.map((d: string) => d.toUpperCase()).join(" • ")
      : "Não definido";

  const nomeUsuario =
    (step1?.nomeCompleto as string) ||
    (state as any)?.perfil?.nomeCompleto ||
    "seu plano";

  const fmtKcal = (n: number | null) =>
    n == null || Number.isNaN(n) ? "–––" : `${Math.round(n)}`;

  const fmtGramas = (n: number | null) =>
    n == null || Number.isNaN(n) ? "–––" : `${Math.round(n)} g`;

  return (
    <div className="w-full text-white space-y-6" data-testid="mf-step-root">
      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <h2 className="text-[22px] font-semibold tracking-tight">
          Plano calibrado
        </h2>
        <p className="mt-1 text-[13px] text-white/50">
          Base científica para estruturar seu protocolo.
        </p>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-[22px] border border-white/10 bg-black/30 p-5">
          <div className="text-white/50 text-[12px]">TMB (repouso)</div>
          <div className="mt-1 text-[28px] font-semibold text-cyan-300">
            {fmtKcal(tmb)}
          </div>
          <div className="text-[12px] text-white/40">kcal</div>
        </div>

        <div className="rounded-[22px] border border-emerald-400/30 bg-emerald-400/10 p-5 shadow-[0_0_25px_rgba(34,197,94,0.15)]">
          <div className="text-white/50 text-[12px]">Meta diária</div>
          <div className="mt-1 text-[28px] font-semibold text-emerald-300">
            {fmtKcal(kcalAlvo)}
          </div>
          <div className="text-[12px] text-white/40">kcal</div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <h3 className="text-[18px] font-semibold">Distribuição de macros</h3>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="rounded-[18px] border border-white/10 p-4 bg-black/20 text-center">
            <div className="text-[22px] font-semibold text-cyan-300">
              {fmtGramas(proteina)}
            </div>
            <div className="text-white/50 text-[12px]">proteína</div>
          </div>

          <div className="rounded-[18px] border border-white/10 p-4 bg-black/20 text-center">
            <div className="text-[22px] font-semibold text-cyan-300">
              {fmtGramas(carboidratos)}
            </div>
            <div className="text-white/50 text-[12px]">carbo</div>
          </div>

          <div className="rounded-[18px] border border-white/10 p-4 bg-black/20 text-center">
            <div className="text-[22px] font-semibold text-cyan-300">
              {fmtGramas(gorduras)}
            </div>
            <div className="text-white/50 text-[12px]">gordura</div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <h3 className="text-[18px] font-semibold">Estrutura do plano</h3>

        <div className="mt-4 space-y-3 text-[14px] text-white/70">
          <div>
            <span className="text-white/40">Usuário:</span>{" "}
            {nomeUsuario}
          </div>

          <div>
            <span className="text-white/40">Objetivo:</span>{" "}
            {objetivoLabel}
          </div>

          <div>
            <span className="text-white/40">Modalidade principal:</span>{" "}
            {modalidadePrincipalLabel}
          </div>

          <div>
            <span className="text-white/40">Modalidades selecionadas:</span>{" "}
            {selectedModalities.length > 0
              ? selectedModalities
                  .map((key) => MODALITY_LABELS[key] ?? key)
                  .join(" • ")
              : "Não informado"}
          </div>

          <div>
            <span className="text-white/40">Dias de treino:</span>{" "}
            {diasTreinoLabel}
          </div>

          <div>
            <span className="text-white/40">Estilo alimentar:</span>{" "}
            {dietaLabel}
          </div>
        </div>

        {groupedDaysSummary.length > 0 ? (
          <div className="mt-4 space-y-2">
            {groupedDaysSummary.map((item) => (
              <div
                key={item.modalityId}
                className="rounded-[16px] border border-white/10 bg-black/20 px-4 py-3 text-[13px] text-white/72"
              >
                <span className="font-semibold text-white">{item.label}:</span>{" "}
                {item.days.length > 0
                  ? item.days.map((d) => d.toUpperCase()).join(" • ")
                  : "Sem dias definidos"}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <h3 className="text-[18px] font-semibold">Próxima refeição</h3>

        <div className="mt-4 rounded-[18px] border border-white/10 bg-black/20 p-4">
          {proximaRefeicao ? (
            <>
              <div className="text-[16px] font-semibold text-white">
                {proximaRefeicao.nome ?? "Refeição"}
              </div>

              <div className="mt-1 text-[13px] text-white/45">
                {proximaRefeicao.horario ?? "Horário a definir"}
              </div>

              {Array.isArray(proximaRefeicao.alimentos) &&
                proximaRefeicao.alimentos.length > 0 && (
                  <div className="mt-2 text-[13px] text-white/55">
                    {proximaRefeicao.alimentos
                      .slice(0, 3)
                      .map((a: any) => a?.nome)
                      .filter(Boolean)
                      .join(" • ")}
                  </div>
                )}
            </>
          ) : (
            <div className="text-[13px] text-white/50">
              O plano alimentar será exibido no dashboard após a confirmação.
            </div>
          )}
        </div>
      </section>

      <div className="flex gap-3 pt-2">
        {onBack && (
          <Button
            variant="outline"
            onClick={() => onBack?.()}
            className="h-14 w-[120px] rounded-[20px] border border-white/15 bg-black/20 text-white hover:bg-white/5"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        )}

        <Button
          onClick={onConfirm}
          variant="ghost"
          className="h-14 flex-1 overflow-hidden rounded-[20px] border-0 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] transition-all hover:brightness-110 hover:bg-transparent"
        >
          Finalizar plano
          <Check className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
