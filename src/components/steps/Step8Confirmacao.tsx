// MF_ONBOARDING_CONTRACT_V1
// PREMIUM_REFINEMENT_PHASE3_STEP8_UI_V3
// FIX_STEP8_NUTRICAO_SOURCE_V1

import { useMemo } from "react";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Check, Flame, UtensilsCrossed, CalendarDays } from "lucide-react";

type Props = {
  summary: any;
  onConfirm: () => void;
  onBack?: () => void;
};

export default function Step8Confirmacao({
  summary,
  onConfirm,
  onBack,
}: Props) {
  const { state } = useDrMindSetfit();

  // =========================
  // FONTES PRINCIPAIS
  // =========================
  const metabolismo =
    (state as any)?.metabolismo ??
    (state as any)?.resultadoMetabolico ??
    {};

  // IMPORTANTE:
  // usar state.nutricao como fonte canônica para evitar ler estrutura antiga
  const nutricao = (state as any)?.nutricao ?? {};

  // =========================
  // CALORIAS / TMB
  // =========================
  const kcalAlvo: number | null =
    nutricao?.kcalAlvo ??
    nutricao?.macros?.calorias ??
    metabolismo?.caloriasAlvo ??
    metabolismo?.get ??
    null;

  const tmb: number | null =
    metabolismo?.tmb ??
    null;

  // =========================
  // MACROS
  // =========================
  const macros = nutricao?.macros ?? {};

  const proteina: number | null =
    macros?.proteina != null
      ? Number(macros.proteina)
      : macros?.proteinas != null
      ? Number(macros.proteinas)
      : null;

  const carboidratos: number | null =
    macros?.carboidratos != null
      ? Number(macros.carboidratos)
      : macros?.carbo != null
      ? Number(macros.carbo)
      : null;

  const gorduras: number | null =
    macros?.gorduras != null
      ? Number(macros.gorduras)
      : macros?.gordura != null
      ? Number(macros.gordura)
      : null;

  // =========================
  // REFEIÇÕES
  // =========================
  const refeicoes: any[] = Array.isArray(nutricao?.refeicoes)
    ? nutricao.refeicoes
    : [];

  const proximaRefeicao = useMemo(() => {
    if (!refeicoes.length) return null;
    return refeicoes[0];
  }, [refeicoes]);

  // =========================
  // DADOS DO ONBOARDING
  // =========================
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

  const modalidadeLabel =
    step5?.primary ??
    step1?.modalidadePrincipal ??
    "Não informado";

  const dietaLabel =
    dietaLabelMap[step7?.dieta] ?? "Flexível";

  const diasTreino = Array.isArray(step6?.days)
    ? step6.days
    : [];

  const diasTreinoLabel =
    diasTreino.length > 0
      ? diasTreino.map((d: string) => d.toUpperCase()).join(" • ")
      : "Não definido";

  const nomeUsuario =
    (step1?.nomeCompleto as string) ||
    (state as any)?.perfil?.nomeCompleto ||
    "seu plano";

  // =========================
  // FORMATADORES
  // =========================
  const fmtKcal = (n: number | null) =>
    n == null || Number.isNaN(n) ? "–––" : `${Math.round(n)}`;

  const fmtGramas = (n: number | null) =>
    n == null || Number.isNaN(n) ? "–––" : `${Math.round(n)} g`;

  return (
    <div className="w-full text-white space-y-6" data-testid="mf-step-root">
      {/* HERO */}
      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <h2 className="text-[22px] font-semibold tracking-tight">
          Plano calibrado
        </h2>
        <p className="mt-1 text-[13px] text-white/50">
          Base científica para estruturar seu protocolo.
        </p>
      </section>

      {/* CALORIAS */}
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

      {/* MACROS */}
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

      {/* RESUMO */}
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
            <span className="text-white/40">Modalidade:</span>{" "}
            {modalidadeLabel}
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
      </section>

      {/* PRÓXIMA REFEIÇÃO */}
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

      {/* CTA */}
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
          className="h-14 flex-1 rounded-[20px] border border-cyan-300/20 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] hover:brightness-110"
        >
          Finalizar plano
          <Check className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}