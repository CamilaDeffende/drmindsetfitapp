// REGRA_FIXA_NO_HEALTH_CONTEXT_STEP: nunca criar etapa de Segurança/Contexto de saúde/Sinais do corpo.
// PREMIUM_REFINEMENT_PHASE2_1: copy clara, validação explícita, feedback visual, sem sobrecarga cognitiva.
import { useEffect, useState } from 'react'

import { BrandIcon } from "@/components/branding/BrandIcon";
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { saveOnboardingProgress } from "@/lib/onboardingProgress";
import { ArrowLeft, ArrowRight, Zap, TrendingUp, CheckCircle2 } from 'lucide-react'
import { calcularMetabolismo } from '@/lib/metabolismo'
import type { ResultadoMetabolico } from '@/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { computeGET, getActivityFactor, inferNivelTreinoFromState } from "@/features/fitness-suite/engine/metabolismoActivity";
import { WeeklyProtocolActive } from "@/components/treino/WeeklyProtocolActive";

import { mfActivityWeeklyLabel } from "@/types";

type OnboardingStepProps = {

  value?: any;
  onChange?: (v: any) => void;
  onNext?: () => void;
  onBack?: () => void;
};

export function Step3Metabolismo({
  // Observação: biotipo = tendência prática (UX/planejamento), não diagnóstico.

 value, onChange, onNext, onBack }: OnboardingStepProps) {
  // =========================
  // BEGIN_MF_PAL_BIOTIPO_V1
  // BLOCO 4: AF/PAL + BIOTIPO (SAFE) — biotipo = tendência prática (não diagnóstico).
  // =========================
  const { state, updateState, nextStep, prevStep } = useDrMindSetfit();
  void value; void onChange; void onBack;
  const MF_AF_OPTIONS = [
    { key: "sedentario", label: "Sedentário", desc: "Pouca ou nenhuma atividade física semanal.", pal: 1.2 },
    { key: "moderadamente_ativo", label: "Moderadamente ativo (1–3x/sem)", desc: "Atividade leve a moderada algumas vezes por semana.", pal: 1.375 },
    { key: "ativo", label: "Ativo (3–5x/sem)", desc: "Treinos regulares na semana.", pal: 1.55 },
    { key: "muito_ativo", label: "Muito ativo (+5x/sem)", desc: "Alta frequência/volume semanal.", pal: 1.725 },
  ] as const;

  const MF_BIOTIPO_OPTIONS = [
    { key: "ectomorfo", label: "Ectomorfo", desc: "Tende a manter baixo % de gordura e ter mais dificuldade em ganhar massa." },
    { key: "mesomorfo", label: "Mesomorfo", desc: "Tende a responder bem a treino/hipertrofia, com perfil equilibrado." },
    { key: "endomorfo", label: "Endomorfo", desc: "Tende a acumular gordura com mais facilidade; foco em aderência e estratégia." },
    { key: "misto", label: "Misto", desc: "Características combinadas; ajustamos pelo seu progresso e dados." },
  ] as const;
// END_MF_PAL_BIOTIPO_V1

  // BEGIN_MF_BLOCK5_UI_PAL_BIOTIPO_V1
  const [mfPALKey, setMfPALKey] = useState<string>(() => String(
    (state as any)?.avaliacao?.frequenciaAtividadeSemanal ??
    (state as any)?.metabolismo?.nivelAtividadeSemanal ??
    (state as any)?.perfil?.nivelAtividadeSemanal ??
    (state as any)?.perfil?.frequenciaAtividadeSemanal ??
    "moderadamente_ativo"
));
  const [mfBioKey, setMfBioKey] = useState<string>(() => String(
    (state as any)?.avaliacao?.biotipo ??
    (state as any)?.perfil?.biotipoTendencia ??
    (state as any)?.perfil?.biotipo ??
    "mesomorfo"
));

  const mfCanAdvance = Boolean(mfPALKey && mfBioKey);

function mfPersistStep3(){
    try {
      updateState?.({
        perfil: {
          ...(state as any)?.perfil,
          nivelAtividadeSemanal: mfPALKey,
          biotipoTendencia: mfBioKey,
        }
      } as any);
    } catch {}
    try {
      saveOnboardingProgress({ step: 3, data: {
        nivelAtividadeSemanal: mfPALKey,
        biotipoTendencia: mfBioKey,
      } });
    } catch {}
  }

  function mfOnContinue(){
    if (!mfCanAdvance) return;
    mfPersistStep3();
    if (typeof onNext === "function") onNext();
    else if (typeof nextStep === "function") nextStep();
  }
  // END_MF_BLOCK5_UI_PAL_BIOTIPO_V1

  // BEGIN_MF_BLOCK6_AUTOSAVE_V1
  useEffect(() => {
    if (mfPALKey && mfBioKey) {
      // autosave leve (não navega)
      try { mfPersistStep3(); } catch {}
    }
  }, [mfPALKey, mfBioKey]);
  // END_MF_BLOCK6_AUTOSAVE_V1

// END_MF_PAL_BIOTIPO_V1
  // =========================
  // MF_BLOCK15_COHERENCE_WARNING_V1
  // Coerência premium: Step1 (frequenciaSemanal 1–7) vs Step2 (PAL/atividade geral).
  // Não bloqueia. Apenas alerta quando há grande discrepância.
  const mfFreqTreino = Number((state as any)?.perfil?.frequenciaSemanal ?? 0);
  const mfPalKeyFromAvaliacao = String(
    (state as any)?.avaliacao?.frequenciaAtividadeSemanal ?? (mfPALKey ?? "")
  );
  const mfCoherenceWarn =
    (mfFreqTreino >= 5 && (mfPalKeyFromAvaliacao === "sedentario")) ||
    (mfFreqTreino <= 1 && (mfPalKeyFromAvaliacao === "muito_ativo"));
  // END_MF_BLOCK15_COHERENCE_WARNING_V1
// MF_BLOCO5C_DELTA_GET_TMB_CALC: impacto real do fator semanal (apenas via state => sem risco de escopo)
  const __tmb = Number(
    (state as any)?.resultadoMetabolico?.tmb ??
    (state as any)?.resultadoMetabolico?.TMB ??
    (state as any)?.metabolismo?.tmb ??
    (state as any)?.metabolismo?.TMB ??
    0
  );
  const __get = Number(
    (state as any)?.resultadoMetabolico?.get ??
    (state as any)?.resultadoMetabolico?.GET ??
    (state as any)?.metabolismo?.get ??
    (state as any)?.metabolismo?.GET ??
    0
  );
  const __delta = (isFinite(__get) && isFinite(__tmb)) ? Math.max(0, Math.round(__get - __tmb)) : 0;

  const __weeklyRaw =
    (state as any)?.perfil?.nivelAtividadeSemanal ??
    (state as any)?.resultadoMetabolico?.nivelAtividadeSemanal ??
    (state as any)?.metabolismo?.nivelAtividadeSemanal ??
    "—";
  const __weeklyLabel = mfActivityWeeklyLabel(__weeklyRaw);

  // Preview objetivo do treino (pós-metabolismo)
  const __mfTreinoAtivo: any = (state as any)?.treinoAtivo;
  const __mfSessions: any[] = Array.isArray(__mfTreinoAtivo?.sessions) ? __mfTreinoAtivo.sessions : [];
  const __mfModalities: any[] = Array.isArray(__mfTreinoAtivo?.modalities) ? __mfTreinoAtivo.modalities : [];
  const __mfTreinoPreview = __mfSessions.length ? (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Treino gerado para você
        {/* MF_BLOCO5C_DELTA_GET_TMB */}
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-300">
              <span className="font-semibold text-white">Atividade semanal</span>: {__weeklyLabel}
            </div>
            <div className="text-xs text-gray-300">
              <span className="font-semibold text-white">Impacto (Δ GET − TMB)</span>: {__delta} kcal/dia
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
            Esse delta representa o efeito do seu fator de atividade semanal sobre o gasto energético total (GET).
            Não é “chute”: é a diferença matemática entre GET e TMB no seu cálculo atual.
          </p>
        </div>
</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Prévia objetiva da sua semana. O plano respeita seu nível e suas modalidades selecionadas.
          </p>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">
          {(__mfModalities.length || 1)} modalidade(s)
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        {__mfSessions.slice(0, 7).map((x, i) => (
          <div key={x?.day ?? i} className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 flex items-center justify-between">
            <div className="text-sm font-semibold">{String(x?.day ?? "Dia")}</div>
            <div className="text-xs text-muted-foreground">{String(x?.title ?? x?.modalityKey ?? "")}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground">
        Você pode ajustar detalhes do treino nas próximas etapas, se necessário.
      </div>
    </div>
  ) : null;

  const [resultado, setResultado] = useState<ResultadoMetabolico | null>(null)

  useEffect(() => {
    if (state.perfil && state.avaliacao && !state.metabolismo) {
      const calc = calcularMetabolismo(state.perfil, state.avaliacao)

      // GET by activity level (iniciante/intermediario/avancado)
      const nivel = inferNivelTreinoFromState(state as any)
      const fator = getActivityFactor(nivel)
      const get = computeGET((calc as any).tmb, fator)

      ;(calc as any).nivelAtividade = nivel
      ;(calc as any).fatorAtividade = fator
      ;(calc as any).get = get

      setResultado(calc)
      updateState({
metabolismo: calc
  ,
  // MF_BLOCK14_CANONICALIZE_V1: espelha Step3 -> avaliacao (fonte da verdade do app)
  avaliacao: {
    ...((state as any)?.avaliacao ?? {}),
    frequenciaAtividadeSemanal: mfPALKey,
    biotipo: mfBioKey,
  },
} as any);} else if (state.metabolismo) {
      setResultado(state.metabolismo)
    }
  }, [state.perfil, state.avaliacao, state.metabolismo, updateState])

  if (!resultado) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">

<Card className="mt-4 border-white/10 bg-white/5">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between gap-3">
      <div>
        <CardTitle className="text-base sm:text-lg">Prévia do seu treino</CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Um resumo objetivo do protocolo semanal, baseado no seu metabolismo e perfil.
        </p>
      </div>
      <Badge variant="secondary" className="border-white/10 bg-black/20">inteligente</Badge>
    </div>
  </CardHeader>
  <CardContent className="pt-0">
        {/* BEGIN_MF_UI_PAL_BIOTIPO_RENDER_V1 */}
        <div className="mt-6 grid gap-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Frequência semanal</p>
                <p className="text-xs text-muted-foreground mt-1">Define o fator de atividade (PAL) usado no cálculo do GET.</p>
              </div>
              <Badge className="bg-white/10 text-white border-white/10">PAL</Badge>
            </div>

            <div className="mt-3 grid gap-2">
              {MF_AF_OPTIONS.map((opt) => {
                const active = mfPALKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setMfPALKey(opt.key)}
                    className={[
                      "w-full text-left rounded-xl border px-3 py-3 transition",
                      active ? "border-white/30 bg-white/10" : "border-white/10 bg-black/10 hover:bg-white/5"
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{opt.label}</div>
                        <div className="text-[11px] text-muted-foreground mt-1">{opt.desc}</div>
                      </div>
                      <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">
                        PAL {opt.pal}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">Biotipo (tendência prática)</p>
                <p className="text-xs text-muted-foreground mt-1">Não é diagnóstico. Serve para ajustar estratégia do plano.</p>
              </div>
              <Badge className="bg-white/10 text-white border-white/10">Estratégia</Badge>
            </div>

            <div className="mt-3 grid gap-2">
              {MF_BIOTIPO_OPTIONS.map((opt) => {
                const active = mfBioKey === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setMfBioKey(opt.key)}
                    className={[
                      "w-full text-left rounded-xl border px-3 py-3 transition",
                      active ? "border-white/30 bg-white/10" : "border-white/10 bg-black/10 hover:bg-white/5"
                    ].join(" ")}
                  >
                    <div className="text-sm font-semibold text-white">{opt.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {/* END_MF_UI_PAL_BIOTIPO_RENDER_V1 */}

    <div className="text-sm text-muted-foreground">
      Conclua as próximas etapas para gerar o protocolo completo com dias, modalidades e progressão.
    </div>
  </CardContent>
</Card>

      {__mfTreinoPreview}

        
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Metabolismo e energia diária</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Aqui estimamos seu gasto energético (TMB e gasto total diário) com base no seu perfil.
            Esse número vira a referência para calorias e macros — deixando o plano mais consistente e sustentável.
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E6BFF] mx-auto mb-4"></div>
            <p className="text-muted-foreground">Calculando seu gasto diário…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const nomeEquacoes: Record<string, string> = {
    cunningham: 'Cunningham',
    'fao-who': 'FAO/WHO',
    'harris-benedict': 'Harris-Benedict',
    mifflin: 'Mifflin-St Jeor',
    tinsley: 'Tinsley'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Metabolismo calibrado</h2>
        <p className="text-muted-foreground">Base científica para definir calorias e macros com segurança.</p>
      </div>

      {/* Equação Escolhida */}
      <Alert className="mb-6 border-[#1E6BFF]/40 bg-[#1E6BFF]/10">
        <CheckCircle2 className="h-5 w-5 text-[#00B7FF]" />
        <AlertTitle className="text-white font-bold">
          Equação escolhida: {nomeEquacoes[resultado.equacaoUtilizada]}
        </AlertTitle>
        <AlertDescription className="text-white/80">
          {resultado.justificativa}
        </AlertDescription>
      </Alert>

      {/* Resultados Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>TMB (repouso)</CardDescription>

          /* MF_BLOCO3_WEEKLY_PROTOCOL_PREVIEW */
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400">Seu protocolo semanal</div>
                <div className="text-base sm:text-lg font-semibold text-white">Semana completa • por modalidade • sem mistura</div>
              </div>
              <div className="text-[11px] text-gray-400 text-right">
                Visual premium • leitura rápida
              </div>
            </div>

            <div className="mt-3">
              {/* Reusa o componente já existente no app (PlanosAtivos) */}
              <WeeklyProtocolActive />
            </div>

            <div className="mt-3 text-xs text-gray-400">
              Dica: cada dia respeita a modalidade escolhida. Musculação mostra grupamentos; corrida/bike/crossfit/funcional mostram sessão completa.
            </div>
          </div>
  
            <CardTitle className="text-3xl font-bold text-[#1E6BFF]">
              {resultado.tmb}
              <span className="text-lg font-normal text-muted-foreground ml-1">kcal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Energia mínima para manter funções vitais.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>GET (dia todo)</CardDescription>
            <CardTitle className="text-3xl font-bold text-[#1E6BFF]">
              {resultado.get}
              <span className="text-lg font-normal text-muted-foreground ml-1">kcal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Inclui rotina e nível de atividade.</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-600">
          <CardHeader className="pb-3">
            <CardDescription>Meta diária</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600">
              {resultado.caloriasAlvo}
              <span className="text-lg font-normal text-muted-foreground ml-1">kcal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Direcionada ao seu objetivo atual.</p>
          </CardContent>
        </Card>
      </div>

      {/* Faixa Segura */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Faixa Calórica Segura
          </CardTitle>
          <CardDescription>Uma zona de trabalho realista para consistência.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">Mínimo</p>
              <Badge variant="outline" className="text-base">{resultado.faixaSegura.minimo} kcal</Badge>
            </div>
            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">Ideal</p>
              <Badge className="bg-green-600 text-base">{resultado.faixaSegura.ideal} kcal</Badge>
            </div>
            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">Máximo</p>
              <Badge variant="outline" className="text-base">{resultado.faixaSegura.maximo} kcal</Badge>
            
            
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white">Detalhes do cálculo (premium)</div>
                <div className="text-[11px] text-gray-400">FAF • Frequência semanal • Biotipo</div>
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[11px] text-gray-400">FAF base (nível)</div>
                  <div className="text-white font-semibold">{(resultado as any)?.fafBase ?? "-"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[11px] text-gray-400">Multiplicador (freq. semanal)</div>
                  <div className="text-white font-semibold">{(resultado as any)?.fafMult ?? "-"}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="text-[11px] text-gray-400">FAF final (aplicado)</div>
                  <div className="text-white font-semibold">{(resultado as any)?.fafFinal ?? "-"}</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-200">
                  Frequência: <b className="text-white">{String(state?.avaliacao?.frequenciaAtividadeSemanal ?? "-")}</b>
                </span>
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-200">
                  Biotipo: <b className="text-white">{String(state?.avaliacao?.biotipo ?? "-")}</b>

                {/* MF_BLOCK15_RENDER_WARNING_V1 */}
                {mfCoherenceWarn && (
                  <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                    <div className="text-sm font-semibold text-amber-200">Checagem rápida de coerência</div>
                    <div className="text-xs text-amber-100/90 mt-1 leading-relaxed">
                      Sua frequência de treino e seu nível de atividade geral parecem diferentes.
                      Isso é normal em fases de transição. Se precisar, ajuste no Step2 (atividade semanal) para o cálculo ficar ainda mais fiel.
                    </div>
                  </div>
                )}
                {/* END_MF_BLOCK15_RENDER_WARNING_V1 */}

                </span>
                {(resultado as any)?.ajusteBiotipoKcal ? (
                  <span className="px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-300">
                    Ajuste biotipo: <b className="text-green-200">+{String((resultado as any).ajusteBiotipoKcal)}</b> kcal
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-400">
                    Ajuste biotipo: <b className="text-white">0</b> kcal
                  </span>
                )}
              </div>

              <div className="mt-2 text-[11px] text-gray-500 leading-relaxed">
                FAF = fator de atividade. Aplicamos multiplicador premium com base na frequência semanal e limitamos o FAF final entre 1.0 e 2.4 para segurança.
              </div>
            </div>
</div>
          </div>
          <div className="w-full h-3 bg-gradient-to-r from-yellow-400 via-green-500 to-yellow-400 rounded-full mt-4 hover:from-[#1E6BFF] hover:via-[#00B7FF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0"></div>
        </CardContent>
      </Card>

      {/* Comparativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1E6BFF]" />
            Comparativo Entre Equações
          </CardTitle>
          <CardDescription>Veja como as fórmulas variam para o seu perfil.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(resultado.comparativo).map(([key, value]) => {
              const isEscolhida = key === resultado.equacaoUtilizada.replace('-', '')
              return (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{nomeEquacoes[key === 'faoWho' ? 'fao-who' : key === 'harrisBenedict' ? 'harris-benedict' : key]}</span>
                    {isEscolhida && (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Escolhida
                      </Badge>
                    )}
                  </div>
                  <span className="font-bold text-lg">{value} kcal</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Variação de {Math.min(...Object.values(resultado.comparativo))} a {Math.max(...Object.values(resultado.comparativo))} kcal entre os métodos
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" size="lg" onClick={prevStep}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        <Button type="button" size="lg" onClick={mfOnContinue} className="bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0">
          Próxima Etapa
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
