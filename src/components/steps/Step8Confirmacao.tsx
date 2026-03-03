// MF_ONBOARDING_CONTRACT_V1
import { useMemo } from "react";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  // ---- Dados do plano vindos do estado global ----
  const metabolismo = (state as any)?.metabolismo ??
    (state as any)?.resultadoMetabolico ??
    {};

  const nutricao = (state as any)?.nutricao ??
    (state as any)?.dieta ??
    (state as any)?.planoDieta ??
    {};

  const kcalAlvo: number | null =
    nutricao?.kcalAlvo ??
    nutricao?.macros?.calorias ??
    metabolismo?.caloriasAlvo ??
    metabolismo?.get ??
    null;

  const macros = nutricao?.macros ?? {};
  const proteina = macros.proteina ?? macros.proteinas ?? null;
  const carboidratos = macros.carboidratos ?? macros.carbo ?? null;
  const gorduras = macros.gorduras ?? macros.gordura ?? null;

  const refeicoes: any[] = Array.isArray(nutricao?.refeicoes)
    ? nutricao.refeicoes
    : [];

  const proximaRefeicao = useMemo(() => {
    if (!refeicoes.length) return null;

    // Se quiser algo mais sofisticado depois (usar horário atual), dá pra ajustar.
    // Por enquanto: primeira refeição da lista.
    return refeicoes[0];
  }, [refeicoes]);

  // ---- Resumo das respostas do onboarding (draft) ----
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
    flexivel: "Flexível / Onívora",
    lowcarb: "Low-carb",
    vegetariana: "Vegetariana",
    vegana: "Vegana",
    mediterranea: "Mediterrânea",
  };

  const objetivoLabel =
    objetivoLabelMap[step1?.objetivo] ?? "Não informado";

  const modalidadeLabel =
    step1?.modalidadePrincipal ??
    step5?.primary ??
    "Não informado";

  const dietaLabel =
    dietaLabelMap[step7?.dieta] ?? "Flexível / Onívora";

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

  // Helpers de formatação
  const fmtKcal = (n: number | null) =>
    n == null || Number.isNaN(n) ? "–––" : `${Math.round(n)} kcal`;

  const fmtGramas = (n: number | null) =>
    n == null || Number.isNaN(n) ? "–––" : `${Math.round(n)} g`;

  return (
    <div data-testid="mf-step-root" className="space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-1">
        <h2 className="text-2xl sm:text-3xl font-semibold">
          Confirme seu plano
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Este é o resumo do que foi calibrado para{" "}
          <span className="font-semibold">{nomeUsuario}</span>.  
          Ao confirmar, salvamos esse plano como base do seu dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resumo do plano (card da esquerda) */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo do seu plano</CardTitle>
            <CardDescription>
              Hoje você só precisa executar o próximo passo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Calorias alvo */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Calorias alvo
                </div>
                <div className="text-xl font-semibold">
                  {fmtKcal(kcalAlvo)}
                </div>
              </div>

              {/* Macros */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Macros
                </div>
                <div className="text-xs space-y-0.5">
                  <div>
                    <span className="font-semibold">P: </span>
                    {fmtGramas(proteina)}
                  </div>
                  <div>
                    <span className="font-semibold">C: </span>
                    {fmtGramas(carboidratos)}
                  </div>
                  <div>
                    <span className="font-semibold">G: </span>
                    {fmtGramas(gorduras)}
                  </div>
                </div>
              </div>

              {/* Próxima refeição (preview) */}
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="text-xs text-muted-foreground mb-1">
                  Próxima refeição (preview)
                </div>
                {proximaRefeicao ? (
                  <div className="space-y-1 text-xs">
                    <div className="font-semibold">
                      {proximaRefeicao.nome ?? "Refeição"}
                    </div>
                    {proximaRefeicao.horario && (
                      <div className="text-muted-foreground">
                        {proximaRefeicao.horario}
                      </div>
                    )}
                    {Array.isArray(proximaRefeicao.alimentos) &&
                      proximaRefeicao.alimentos.length > 0 && (
                        <div className="text-muted-foreground truncate">
                          {proximaRefeicao.alimentos
                            .slice(0, 3)
                            .map((a: any) => a?.nome)
                            .filter(Boolean)
                            .join(" · ")}
                          {proximaRefeicao.alimentos.length > 3
                            ? "…"
                            : ""}
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Seu plano alimentar será montado ao entrar no app.
                  </div>
                )}
              </div>
            </div>

            {/* Linha fina de meta */}
            <div className="mt-4 rounded-full bg-white/5 h-2 overflow-hidden">
              <div className="h-full bg-emerald-500/70 w-3/4" />
            </div>
          </CardContent>
        </Card>

        {/* Card de "Complete seu perfil" / CTA de confirmação */}
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 -top-24 h-40 bg-gradient-to-b from-sky-500/30 to-transparent" />
          <CardHeader className="relative">
            <CardTitle className="text-2xl text-sky-300">
              Complete seu Perfil
            </CardTitle>
            <CardDescription className="text-sm">
              Confirme seus dados para desbloquear o dashboard com
              seu plano já carregado.
            </CardDescription>
          </CardHeader>
          <CardContent className="relative space-y-4">
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>
                <span className="font-semibold text-white">
                  Objetivo:
                </span>{" "}
                {objetivoLabel}
              </div>
              <div>
                <span className="font-semibold text-white">
                  Modalidade principal:
                </span>{" "}
                {modalidadeLabel}
              </div>
              <div>
                <span className="font-semibold text-white">
                  Dias de treino:
                </span>{" "}
                {diasTreinoLabel}
              </div>
              <div>
                <span className="font-semibold text-white">
                  Estilo de dieta:
                </span>{" "}
                {dietaLabel}
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              Depois de confirmar, você poderá acompanhar o plano,
              registrar treinos e ajustar calorias/macro ao longo do
              tempo direto no dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {onBack && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={onBack}
                >
                  Voltar
                </Button>
              )}

              <Button
                type="button"
                className="w-full sm:flex-1 bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF]"
                onClick={onConfirm}
              >
                Confirmar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}