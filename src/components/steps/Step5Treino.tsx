import { useState } from 'react'
import { BrandIcon } from "@/components/branding/BrandIcon";
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { DivisaoTreinoSelector } from '@/components/DivisaoTreinoSelector'
import { gerarTreinoPersonalizado } from '@/utils/geradorTreino'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { DivisaoTreinoConfig, PlanejamentoTreino } from '@/types'

import { buildWeeklyProtocol } from '@/features/fitness-suite/engine/weeklyProtocol';

// MF_STEP5_CLEAN_V2
const __mfAllowedModalities = ["musculacao","funcional","corrida","spinning","crossfit"] as const;
const __mfLabelByKey: Record<string, string> = {
  musculacao: "Musculação",
  funcional: "Funcional",
  corrida: "Corrida",
  spinning: "Bike Indoor",
  crossfit: "CrossFit",
};
const __mfWeekDays = [
  { key: "seg", label: "Segunda" },
  { key: "ter", label: "Terça" },
  { key: "qua", label: "Quarta" },
  { key: "qui", label: "Quinta" },
  { key: "sex", label: "Sexta" },
  { key: "sab", label: "Sábado" },
  { key: "dom", label: "Domingo" },
] as const;
type __MfDayKey = typeof __mfWeekDays[number]["key"];
export function Step5Treino() {
  const { state, updateState, nextStep, prevStep } = useDrMindSetfit()
    

  const __mfSelectedModalities = (Array.isArray((state as any)?.workoutModalities) ? (state as any).workoutModalities : []).map(String).filter((k: string) => (__mfAllowedModalities as any).includes(k));

  // MF_STEP5_V2_STATE_BLOCK
  const __mfLevelByModality = (((state as any)?.workoutLevelByModality ?? {}) as Record<string, any>);
  const __mfDaysSelected = (Array.isArray((state as any)?.workoutDaysSelected) ? (state as any).workoutDaysSelected : []) as __MfDayKey[];
  const __mfPlanByDay = (((state as any)?.workoutPlanByDay ?? {}) as Record<string, string>);

  const __mfSetModalities = (next: string[]) => {
    const clean = next.map(String).filter((k) => (__mfAllowedModalities as any).includes(k));
    const uniq = Array.from(new Set(clean));
    const nextLevels = { ...__mfLevelByModality };
    for (const k of Object.keys(nextLevels)) if (!uniq.includes(k)) delete nextLevels[k];
    const nextPlan = { ...__mfPlanByDay };
    for (const dk of Object.keys(nextPlan)) if (!uniq.includes(String(nextPlan[dk]))) delete nextPlan[dk];
    updateState({ workoutModalities: uniq, workoutLevelByModality: nextLevels, workoutPlanByDay: nextPlan } as any);
  };

  const __mfSetLevel = (modKey: string, lvl: any) => {
    if (!__mfSelectedModalities.includes(modKey)) return;
    updateState({ workoutLevelByModality: { ...__mfLevelByModality, [modKey]: lvl } } as any);
  };

  const __mfToggleDay = (dayKey: __MfDayKey) => {
    const on = __mfDaysSelected.includes(dayKey);
    const next = on ? __mfDaysSelected.filter((d) => d !== dayKey) : [...__mfDaysSelected, dayKey];
    const nextPlan = { ...__mfPlanByDay };
    if (on) delete nextPlan[dayKey];
    updateState({ workoutDaysSelected: next, workoutPlanByDay: nextPlan } as any);
  };

  const __mfSetDayModality = (dayKey: __MfDayKey, modalityKey: string) => {
    if (!__mfSelectedModalities.includes(modalityKey)) return;
    updateState({ workoutPlanByDay: { ...__mfPlanByDay, [dayKey]: modalityKey } } as any);
  };
  const [treinoGerado, setTreinoGerado] = useState<PlanejamentoTreino | null>(state.treino || null)
  const [mostrandoSelector, setMostrandoSelector] = useState(!state.treino)

  const handleSelecionarDivisao = (config: DivisaoTreinoConfig) => {
    const treino = gerarTreinoPersonalizado(config, state.perfil)
    setTreinoGerado(treino)
    setMostrandoSelector(false)
  }

  function Step5WorkoutSetupPanel({
  selectedModalities,
  setSelectedModalities,
  levelByModality,
  setLevelByModality,
  daysSelected,
  toggleDay,
  planByDay,
  setDayModality,
}: {
  selectedModalities: string[];
  setSelectedModalities: (next: string[]) => void;
  levelByModality: Record<string, any>;
  setLevelByModality: (mod: string, lvl: any) => void;
  daysSelected: __MfDayKey[];
  toggleDay: (d: __MfDayKey) => void;
  planByDay: Record<string, string>;
  setDayModality: (d: __MfDayKey, mod: string) => void;
}) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4">
      {/* Modalidades */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        
{/* MF_PURGE_LEGACY_TREINO_UI */}

        <div className="mt-1 text-xs text-muted-foreground">Selecione apenas as modalidades que você vai realizar ao longo da semana.</div>

        <div className="mt-3 flex flex-wrap gap-2">
          {(__mfAllowedModalities as any).map((k: string) => {
            const on = selectedModalities.includes(k);
            return (
              <button
                key={k}
                type="button"
                onClick={() => {
                  const next = on ? selectedModalities.filter((x) => x !== k) : [...selectedModalities, k];
                  const nextLevels = { ...levelByModality };
                  if (on) delete nextLevels[k];
                  const nextPlan = { ...planByDay };
                  if (on) for (const dk of Object.keys(nextPlan)) if (String(nextPlan[dk]) === k) delete nextPlan[dk];
                  setSelectedModalities(next);}}
                className={`rounded-full px-3 py-1.5 text-xs border transition ${on ? "border-white/20 bg-white/10" : "border-white/10 bg-transparent hover:bg-white/5"}`}
              >
                {__mfLabelByKey[k] ?? k}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nível por modalidade */}
      {selectedModalities.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="text-sm font-semibold">Nível por modalidade</div>
          <div className="mt-1 text-xs text-muted-foreground">Escolha livremente seu nível em cada modalidade (auto-declarado).</div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {selectedModalities.map((modKey: string) => {
              const current = levelByModality?.[modKey] ?? "iniciante";
              const label = __mfLabelByKey[modKey] ?? modKey;

              return (
                <div key={modKey} className="rounded-xl border border-white/10 bg-black/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{label}</div>
                    <div className="text-[11px] text-muted-foreground capitalize">{String(current)}</div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {["iniciante","intermediario","avancado"].map((lvl: any) => {
                      const on = String(current) === String(lvl);
                      return (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setLevelByModality(modKey, lvl)}
                          className={`rounded-full px-3 py-1 text-xs border transition ${on ? "border-white/20 bg-white/10" : "border-white/10 bg-transparent hover:bg-white/5"}`}
                        >
                          {lvl}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Dias + modalidade por dia */}
      {selectedModalities.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="text-sm font-semibold">Dias da semana</div>
          <div className="mt-1 text-xs text-muted-foreground">Selecione os dias e defina qual modalidade será feita em cada dia (somente entre as selecionadas).</div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(__mfWeekDays as any).map((d: any) => {
              const on = daysSelected.includes(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleDay(d.key)}
                  className={`rounded-full px-3 py-1.5 text-xs border transition ${on ? "border-white/20 bg-white/10" : "border-white/10 bg-transparent hover:bg-white/5"}`}
                >
                  {d.label}
                </button>
              );
            })}
          </div>

          {daysSelected.length ? (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {daysSelected.map((dayKey: any) => {
                const dayLabel = (__mfWeekDays as any).find((x: any) => x.key === dayKey)?.label ?? dayKey;
                const current = String(planByDay?.[dayKey] ?? "");
                return (
                  <div key={dayKey} className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <div className="text-sm font-semibold">{dayLabel}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedModalities.map((mk: string) => {
                        const on = current === mk;
                        return (
                          <button
                            key={mk}
                            type="button"
                            onClick={() => setDayModality(dayKey, mk)}
                            className={`rounded-full px-3 py-1 text-xs border transition ${on ? "border-white/20 bg-white/10" : "border-white/10 bg-transparent hover:bg-white/5"}`}
                          >
                            {__mfLabelByKey[mk] ?? mk}
                          </button>
                        );
                      })}
                    </div>
                    {!current ? <div className="mt-2 text-[11px] text-muted-foreground">Escolha uma modalidade para este dia.</div> : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const handleContinuar = () => {
    if (treinoGerado) {
      // MF_STEP5_GUARD_DAY_MAP_V2
      if (__mfDaysSelected.length) {
        const missing = __mfDaysSelected.filter((d: __MfDayKey) => !__mfPlanByDay?.[d]);
        if (missing.length) return;
      }
      const __protocol = buildWeeklyProtocol(state as any);
      // PREMIUM_WEEKLY_PROTOCOL_SAVE_V1
      updateState({ treino: treinoGerado, workoutProtocolWeekly: __protocol } as any);
      nextStep()
    }
  }

  const handleRefazer = () => {
    setMostrandoSelector(true)
  }

  if (mostrandoSelector) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Step5WorkoutSetupPanel
          selectedModalities={__mfSelectedModalities}
          setSelectedModalities={__mfSetModalities}
          levelByModality={__mfLevelByModality}
          setLevelByModality={__mfSetLevel}
          daysSelected={__mfDaysSelected}
          toggleDay={__mfToggleDay}
          planByDay={__mfPlanByDay}
          setDayModality={__mfSetDayModality}
        />


      
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 space-y-3">
        
{/* MF_PURGE_LEGACY_TREINO_UI */}


        </div>

      

      

      
{/* MF_PURGE_MODALITY_LEGACY */}


        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Treino e estratégia</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Esses dados definem frequência, volume e nível de experiência para equilibrar estímulo e recuperação.
            Assim, o treino fica coerente com seu objetivo, tempo disponível e rotina, com progressão mais segura.
          </p>
        </div>

        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
          <h2 className="text-3xl font-bold mb-2">Treinamento Inteligente</h2>
          <p className="text-muted-foreground">Configure seu programa personalizado de treino</p>
        </div>

        <DivisaoTreinoSelector onSelect={handleSelecionarDivisao} />

        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" size="lg" onClick={prevStep}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  if (!treinoGerado) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Seu Treino Personalizado</h2>
        <p className="text-muted-foreground">Treino gerado baseado no seu perfil e disponibilidade</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Divisão: {treinoGerado.divisaoSemanal}</CardTitle>
          <CardDescription>
            Modalidade: {treinoGerado.modalidade} • {treinoGerado.frequencia}x por semana •{' '}
            Intensidade: {treinoGerado.divisao.intensidade}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Dias:</span>
            {treinoGerado.divisao.diasSelecionados.map(dia => (
              <Badge key={dia} variant="outline">
                {dia}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {treinoGerado.treinos.map((dia, index) => (
        <Card key={index} className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {dia.dia}
              <Badge>{dia.volumeTotal} séries</Badge>
            </CardTitle>
            <CardDescription>
              Grupamentos: {dia.grupamentos.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dia.exercicios.map((ex, idx) => (
                <div key={idx} className="p-4 border rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{ex.exercicio.nome}</h4>
                      <p className="text-sm text-muted-foreground">{ex.exercicio.equipamento}</p>
                    </div>
                    <Badge variant="outline">{ex.exercicio.grupoMuscular}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                    <div>
                      <span className="text-muted-foreground">Séries:</span>
                      <span className="ml-1 font-semibold">{ex.series}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reps:</span>
                      <span className="ml-1 font-semibold">{ex.repeticoes}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Descanso:</span>
                      <span className="ml-1 font-semibold">{ex.descanso}s</span>
                    </div>
                  </div>

                  <details className="text-sm">
                    <summary className="cursor-pointer text-[#1E6BFF] hover:underline">
                      Ver substituições
                    </summary>
                    <div className="mt-2 pl-4 border-l-2 border-[#1E6BFF]">
                      <p className="text-muted-foreground">Você pode substituir por:</p>
                      <ul className="list-disc list-inside mt-1">
                        {ex.exercicio.substituicoes.map((sub, i) => (
                          <li key={i}>{sub}</li>
                        ))}
                      </ul>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="mb-4">
        <Button
          onClick={handleRefazer}
          variant="outline"
          className="w-full"
        >
          Refazer Treino com Outra Divisão
        </Button>
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" size="lg" onClick={prevStep}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        <Button type="button" size="lg" onClick={handleContinuar} className="bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0">
          Próxima Etapa
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
