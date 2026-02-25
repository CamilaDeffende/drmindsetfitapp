// MF_ONBOARDING_CONTRACT_V1
// Step3Metabolismo – tela de impacto com resultado da calculadora
// Fix: recalcula quando perfil/avaliacao mudam (evita reaproveitar resultado antigo)
// Fix: não espalhar `state` inteiro no updateState (merge parcial)

import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import type { ResultadoMetabolico } from "@/types";
import { calcularMetabolismo } from "@/lib/metabolismo";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";

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
  void onNext;

  const { state, updateState } = useDrMindSetfit();

  // Fonte canônica (preferência): state.perfil e state.avaliacao
  const perfil = useMemo(
    () =>
      (state as any)?.perfil ??
      (state as any)?.step1 ??
      (state as any)?.avaliacaoPerfil ??
      {},
    [state]
  );

  const avaliacao = useMemo(
    () =>
      (state as any)?.avaliacao ??
      (state as any)?.step2 ??
      (state as any)?.avaliacaoFisica ??
      {},
    [state]
  );

  // Chave simples para detectar mudanças que afetam o metabolismo
  const calcKey = useMemo(() => {
    const p = perfil as any;
    const a = avaliacao as any;
    const peso = a?.peso ?? a?.pesoAtual ?? "";
    const altura = a?.altura ?? "";
    const idade = p?.idade ?? "";
    const sexo = p?.sexo ?? "";
    const nivelTreino = p?.nivelTreino ?? "";
    const objetivo = p?.objetivo ?? "";
    const freq = a?.frequenciaAtividadeSemanal ?? "";
    const biotipo = a?.biotipo ?? p?.biotipo ?? "";
    return [
      peso,
      altura,
      idade,
      sexo,
      nivelTreino,
      objetivo,
      freq,
      biotipo,
    ].join("|");
  }, [perfil, avaliacao]);

  const [resultado, setResultado] = useState<ResultadoMetabolico | null>(
    (state as any)?.metabolismo ?? (state as any)?.resultadoMetabolico ?? null
  );
  const [loading, setLoading] = useState(!resultado);
  const [error, setError] = useState<string | null>(null);

  // Autosave leve do step 3 (mantém rascunho)
  useOnboardingDraftSaver(
    {
      step3: {
        ...(state as any).step3,
        metabolismo: resultado ?? (state as any).metabolismo ?? null,
      },
    } as any,
    400
  );

  // Recalcula sempre que calcKey muda (evita usar resultado antigo)
  useEffect(() => {
    let cancelled = false;

    // Sempre tenta recalcular quando dados mudarem
    setLoading(true);
    setError(null);

    try {
      const calc = calcularMetabolismo(perfil as any, avaliacao as any);

      if (cancelled) return;

      setResultado(calc);
      setLoading(false);
      setError(null);

      // Salva no contexto global (merge parcial)
      try {
        updateState({
          metabolismo: calc,
          resultadoMetabolico: calc,
        } as any);
      } catch {}
    } catch (e: any) {
      if (cancelled) return;

      console.error("[MF] Erro ao calcular metabolismo:", e);
      setResultado(null);
      setError(
        e?.message ||
          "Não foi possível calcular seu metabolismo. Revise os dados dos passos anteriores."
      );
      setLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [calcKey, perfil, avaliacao, updateState]);

  const equacao =
    (resultado as any)?.equacaoUtilizada ??
    (state as any)?.metabolismo?.equacaoUtilizada;

  const faixa = resultado?.faixaSegura;
  const comparativo = resultado?.comparativo;

  return (
    <div
      className="max-w-4xl mx-auto px-4 py-6 sm:py-8"
      data-testid="mf-step-root"
    >
      {/* Cabeçalho */}
      <div className="space-y-2 mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Nível de atividade
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Usamos seus dados para estimar metabolismo de repouso (TMB), gasto
          diário (GET/TDEE) e uma faixa calórica segura para seu objetivo. Esses
          números são a base do plano de treino e nutrição.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Algo deu errado</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && !error && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-sm sm:text-base text-muted-foreground">
            Calculando seu gasto diário…
          </p>
        </div>
      )}

      {!loading && !error && resultado && (
        <div className="space-y-6">
          {/* Bloco 1 – Cards principais */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-normal">
                  TMB (repouso)
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  Energia mínima para manter funções vitais.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-sky-300">
                  {resultado.tmb}{" "}
                  <span className="text-base text-muted-foreground">kcal</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-normal">
                  GET (dia todo)
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  Inclui rotina e nível de atividade.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-300">
                  {resultado.get}{" "}
                  <span className="text-base text-muted-foreground">kcal</span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-emerald-500/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground font-normal">
                  Meta diária
                </CardTitle>
                <CardDescription className="text-[11px] text-muted-foreground">
                  Direcionada ao seu objetivo atual.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-emerald-400">
                  {resultado.caloriasAlvo}{" "}
                  <span className="text-base text-muted-foreground">kcal</span>
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Bloco 2 – Faixa calórica segura */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Faixa calórica segura
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Zona de trabalho realista para consistência e aderência.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-xs">
                  Segurança primeiro
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {faixa && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      Mínimo
                    </div>
                    <div className="text-lg font-semibold">
                      {faixa.minimo} kcal
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      Ideal
                    </div>
                    <div className="text-lg font-semibold text-emerald-400">
                      {faixa.ideal} kcal
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      Máximo
                    </div>
                    <div className="text-lg font-semibold">
                      {faixa.maximo} kcal
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs sm:text-sm text-muted-foreground">
                <div className="rounded-lg border border-white/10 p-3 bg-white/[0.02]">
                  <div className="uppercase tracking-wide text-[10px] text-gray-400 mb-1">
                    FAF base (nível)
                  </div>
                  <div className="text-base text-white">
                    {Number(resultado.fafBase).toFixed(2)}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Fator calculado pelo nível de treino informado.
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 p-3 bg-white/[0.02]">
                  <div className="uppercase tracking-wide text-[10px] text-gray-400 mb-1">
                    FAF final (aplicado)
                  </div>
                  <div className="text-base text-white">
                    {Number(resultado.fafFinal).toFixed(2)}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    Já considerando sua rotina semanal e guardrails.
                  </p>
                </div>

                <div className="rounded-lg border border-white/10 p-3 bg-white/[0.02]">
                  <div className="uppercase tracking-wide text-[10px] text-gray-400 mb-1">
                    Equação escolhida
                  </div>
                  <div className="text-base text-white capitalize">
                    {String(equacao || "mifflin").replace("-", " ")}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-400">
                    {resultado.justificativa}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bloco 3 – Comparativo entre equações */}
          {comparativo && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base sm:text-lg">
                  Comparativo entre equações
                </CardTitle>
                <CardDescription className="text-sm">
                  Veja como as fórmulas variam para o seu perfil (já com
                  atividade aplicada).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {([
                    ["Mifflin-St Jeor", comparativo.mifflin],
                    ["Harris-Benedict", comparativo.harrisBenedict],
                    ["Cunningham", comparativo.cunningham],
                    ["FAO/WHO", comparativo.faoWho],
                    ["Tinsley (atletas)", comparativo.tinsley],
                  ] as const).map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 bg-white/[0.02]"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold">
                        {value} <span className="text-xs">kcal</span>
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-3 text-xs text-muted-foreground">
                  Normal existir uma variação entre fórmulas. Nós usamos a
                  equação mais adequada ao seu caso e mantemos o plano dentro de
                  uma faixa segura.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Navegação local: Voltar (Continuar vem do OnboardingFlow) */}
          <div className="flex justify-start pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="border-white/10"
            >
              Voltar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Step3Metabolismo;