// MF_ONBOARDING_CONTRACT_V1
// REGRA_FIXA_NO_HEALTH_CONTEXT_STEP: nunca criar etapa de Segurança/Contexto de saúde/Sinais do corpo.
// PREMIUM_REFINEMENT_PHASE2_1: copy clara, validação explícita, feedback visual, sem sobrecarga cognitiva.

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import type { ResultadoMetabolico } from "@/types";
import { calcularMetabolismo } from "@/lib/metabolismo"; 
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { BrandIcon } from "@/components/branding/BrandIcon";

type OnboardingStepProps = {
  value?: any;
  onChange?: (v: any) => void;
  onNext?: () => void;
  onBack?: () => void;
};

export function Step3Metabolismo({
  value,
  onChange,
  onNext,
  onBack,
}: OnboardingStepProps) {
  void value;
  void onChange;

  const { state, updateState, nextStep } = useDrMindSetfit();

  const [calcStatus, setCalcStatus] = useState<
    "idle" | "calculando" | "ok" | "erro"
  >("idle");
  const [calcError, setCalcError] = useState<string | null>(null);

  const resultado = (state as any)?.metabolismo as
    | ResultadoMetabolico
    | undefined;

  // Autosave leve do resultado no draft global
  useOnboardingDraftSaver(
    {
      step3: {
        metabolismo: resultado ?? null,
      },
    } as any,
    400
  );

  // =========================
  // Cálculo do metabolismo
  // =========================
  useEffect(() => {
    const perfil = (state as any)?.perfil ?? {};
    const avaliacao = (state as any)?.avaliacao ?? {};

    // Se ainda não passou pelos steps anteriores, não tenta calcular nada
    if (!perfil || !avaliacao) {
      setCalcStatus("idle");
      return;
    }

    const sexo = perfil.sexo;
    const idade = Number(perfil.idade);
    const peso = Number(avaliacao.peso);
    const altura = Number(avaliacao.altura);

    const hasRequired =
      (sexo === "masculino" || sexo === "feminino") &&
      Number.isFinite(idade) &&
      idade > 0 &&
      Number.isFinite(peso) &&
      peso > 0 &&
      Number.isFinite(altura) &&
      altura > 0;

    if (!hasRequired) {
      console.warn("[Step3Metabolismo] Dados insuficientes para cálculo:", {
        sexo,
        idade,
        peso,
        altura,
      });
      setCalcStatus("idle");
      setCalcError(
        "Revise os dados dos passos anteriores (sexo, idade, peso e altura)."
      );
      return;
    }

    setCalcStatus("calculando");
    setCalcError(null);

    let cancelled = false;

    const run = () => {
      try {
        console.log("[Step3Metabolismo] Calculando metabolismo com:", {
          perfil,
          avaliacao,
        });

        const res = calcularMetabolismo(perfil as any, avaliacao as any);

        if (cancelled) return;

        updateState({ metabolismo: res });
        setCalcStatus("ok");
      } catch (e: any) {
        if (cancelled) return;
        console.error("[Step3Metabolismo] Erro ao calcular metabolismo:", e);
        setCalcStatus("erro");
        setCalcError(
          e?.message ||
            "Não foi possível calcular seu metabolismo. Revise os dados dos passos anteriores."
        );
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [state.perfil, state.avaliacao, updateState]);

  // =========================
  // Helpers de UI
  // =========================

  const tmb = resultado?.tmb ?? 0;
  const get = resultado?.get ?? 0;
  const caloriasAlvo = resultado?.caloriasAlvo ?? 0;

  const faixaMin = resultado?.faixaSegura?.minimo ?? 0;
  const faixaIdeal = resultado?.faixaSegura?.ideal ?? 0;
  const faixaMax = resultado?.faixaSegura?.maximo ?? 0;

  const equacao = resultado?.equacaoUtilizada;
  const justificativa = resultado?.justificativa;

  const fafBase = resultado?.fafBase ?? 0;
  const fafMult = resultado?.fafMult ?? 0;
  const fafFinal = resultado?.fafFinal ?? 0;

  const ajusteBiotipoKcal = resultado?.ajusteBiotipoKcal ?? 0;
  const ajusteBiotipoMotivo = resultado?.ajusteBiotipoMotivo ?? "";

  const comparativo = resultado?.comparativo ?? {};

  const nivelAtividadeSemanal =
    (resultado as any)?.nivelAtividadeSemanal ??
    (state as any)?.avaliacao?.frequenciaAtividadeSemanal ??
    (state as any)?.perfil?.nivelTreino ??
    "moderadamente_ativo";

  const biotipo =
    (state as any)?.avaliacao?.biotipo ??
    (state as any)?.perfil?.biotipo ??
    "mesomorfo";

  const labelAtividade = (() => {
    switch (nivelAtividadeSemanal) {
      case "sedentario":
        return "sedentário";
      case "moderadamente_ativo":
        return "moderadamente ativo";
      case "ativo":
        return "ativo";
      case "muito_ativo":
        return "muito ativo";
      default:
        return nivelAtividadeSemanal;
    }
  })();

  const labelEquacao = (() => {
    switch (equacao) {
      case "mifflin":
        return "Mifflin-St Jeor";
      case "cunningham":
        return "Cunningham";
      case "fao-who":
        return "FAO/WHO";
      case "harris-benedict":
        return "Harris-Benedict";
      case "tinsley":
        return "Tinsley (atletas)";
      default:
        return "Equação metabólica";
    }
  })();

  const handleContinuar = () => {
    if (typeof onNext === "function") onNext();
    else if (typeof nextStep === "function") nextStep();
  };

  const handleVoltar = () => {
    if (typeof onBack === "function") onBack();
  };

  // =========================
  // Render
  // =========================

  return (
    <div
      className="max-w-4xl mx-auto px-4 py-8"
      data-testid="mf-step-root"
    >
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Metabolismo calibrado
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Usamos seus dados para estimar metabolismo de repouso (TMB), gasto
          diário (GET/TDEE) e uma faixa calórica segura para seu objetivo.
          Isso vira a base do plano de treino, dieta e ajustes ao longo do
          acompanhamento.
        </p>
      </div>

      <div className="mb-8 mt-6 text-center">
        <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
        <h2 className="text-3xl font-bold mb-2">
          Base científica para definir calorias e macros
        </h2>
        <p className="text-muted-foreground">
          Nada de chute: usamos fórmulas validadas + seu nível de atividade e
          biotipo para chegar em um alvo realista.
        </p>
      </div>

      {/* Banner da equação escolhida */}
      <Card className="mb-6 border-white/10 bg-white/[0.03]">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between gap-2 text-base sm:text-lg">
            <span>Equação escolhida: {labelEquacao}</span>
            {equacao && (
              <Badge variant="outline" className="text-xs">
                Automático pelo seu perfil
              </Badge>
            )}
          </CardTitle>
          {justificativa && (
            <CardDescription className="text-sm text-muted-foreground">
              {justificativa}
            </CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Mensagens de erro / estado */}
      {calcStatus === "erro" && calcError && (
        <Alert className="mb-6 border-red-500/40 bg-red-500/5">
          <AlertTitle>Não foi possível calcular seu gasto diário</AlertTitle>
          <AlertDescription>{calcError}</AlertDescription>
        </Alert>
      )}

      {/* Cards principais só aparecem quando temos resultado */}
      {resultado && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* TMB */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  TMB (repouso)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-sky-400">
                  {tmb.toLocaleString("pt-BR")}{" "}
                  <span className="text-base text-muted-foreground">
                    kcal
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Energia mínima para manter funções vitais.
                </p>
              </CardContent>
            </Card>

            {/* GET */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  GET (dia todo)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-sky-400">
                  {get.toLocaleString("pt-BR")}{" "}
                  <span className="text-base text-muted-foreground">
                    kcal
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Inclui rotina + nível de atividade.
                </p>
              </CardContent>
            </Card>

            {/* Meta diária */}
            <Card className="border-emerald-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">
                  Meta diária
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-semibold text-emerald-400">
                  {caloriasAlvo.toLocaleString("pt-BR")}{" "}
                  <span className="text-base text-muted-foreground">
                    kcal
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Direcionada ao seu objetivo atual.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Faixa calórica segura */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Faixa Calórica Segura</CardTitle>
                  <CardDescription>
                    Uma zona de trabalho realista para consistência.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Mínimo
                  </div>
                  <div className="inline-flex items-baseline px-4 py-1 rounded-full bg-white/5 text-lg font-semibold">
                    {faixaMin.toLocaleString("pt-BR")}{" "}
                    <span className="ml-1 text-xs text-muted-foreground">
                      kcal
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Ideal
                  </div>
                  <div className="inline-flex items-baseline px-4 py-1 rounded-full bg-emerald-500/10 text-lg font-semibold text-emerald-400">
                    {faixaIdeal.toLocaleString("pt-BR")}{" "}
                    <span className="ml-1 text-xs text-muted-foreground">
                      kcal
                    </span>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-muted-foreground mb-1">
                    Máximo
                  </div>
                  <div className="inline-flex items-baseline px-4 py-1 rounded-full bg-white/5 text-lg font-semibold">
                    {faixaMax.toLocaleString("pt-BR")}{" "}
                    <span className="ml-1 text-xs text-muted-foreground">
                      kcal
                    </span>
                  </div>
                </div>
              </div>

              {/* Detalhes do cálculo */}
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                  Detalhes do cálculo (premium)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">
                      FAF base (nível)
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      {fafBase.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      Multiplicador (freq. semanal)
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      {fafMult.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">
                      FAF final (aplicado)
                    </div>
                    <div className="mt-1 text-lg font-semibold">
                      {fafFinal.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline">
                    Frequência: {labelAtividade}
                  </Badge>
                  <Badge variant="outline">Biotipo: {biotipo}</Badge>
                  <Badge variant="outline">
                    Ajuste biotipo: {ajusteBiotipoKcal} kcal
                  </Badge>
                </div>

                {ajusteBiotipoKcal !== 0 && ajusteBiotipoMotivo && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {ajusteBiotipoMotivo}
                  </p>
                )}

                <p className="mt-3 text-[11px] text-muted-foreground">
                  FAF = fator de atividade. Aplicamos multiplicador premium com
                  base na frequência semanal e limitamos o FAF final entre 1.0 e
                  2.4 para segurança.
                </p>
              </div>

              {/* Barrinha de "zona de trabalho" */}
              <div className="mt-4 h-2 w-full rounded-full bg-yellow-400/20 overflow-hidden">
                <div className="h-full w-1/2 bg-emerald-400" />
              </div>
            </CardContent>
          </Card>

          {/* Comparativo entre equações */}
          {comparativo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Comparativo Entre Equações
                </CardTitle>
                <CardDescription className="text-sm">
                  Veja como as fórmulas variam para o seu perfil.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { key: "cunningham", label: "Cunningham" },
                  { key: "faoWho", label: "FAO/WHO" },
                  { key: "harrisBenedict", label: "Harris-Benedict" },
                  { key: "mifflin", label: "Mifflin-St Jeor" },
                  { key: "tinsley", label: "Tinsley" },
                ].map((row) => {
                  const valor = (comparativo as any)?.[row.key];
                  if (!valor) return null;
                  const isEscolhida =
                    row.key === String(equacao ?? "").toLowerCase() ||
                    (row.key === "mifflin" && equacao === "mifflin");
                  return (
                    <div
                      key={row.key}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span>{row.label}</span>
                        {isEscolhida && (
                          <Badge
                            variant="outline"
                            className="text-[10px] border-emerald-500/60 text-emerald-400"
                          >
                            Escolhida
                          </Badge>
                        )}
                      </div>
                      <div className="font-semibold">
                        {Number(valor).toLocaleString("pt-BR")} kcal
                      </div>
                    </div>
                  );
                })}

                <p className="mt-2 text-[11px] text-muted-foreground text-center">
                  Variação de{" "}
                  {Math.min(
                    ...(Object.values(comparativo) as number[])
                  ).toLocaleString("pt-BR")}{" "}
                  a{" "}
                  {Math.max(
                    ...(Object.values(comparativo) as number[])
                  ).toLocaleString("pt-BR")}{" "}
                  kcal entre os métodos.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Estado "calculando" no fim da página */}
      {calcStatus === "calculando" && (
        <div className="mt-8 flex flex-col items-center justify-center text-sm text-muted-foreground">
          <div className="mb-3 h-8 w-8 rounded-full border border-sky-400 border-t-transparent animate-spin" />
          Calculando seu gasto diário…
        </div>
      )}

      {/* Barra de ações inferior (usar botões do fluxo principal) */}
      <div className="mt-8 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={handleVoltar}
          className="px-4"
        >
          Voltar
        </Button>
        <Button
          type="button"
          onClick={handleContinuar}
          className="px-6 bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF]"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}