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

import { MODALITIES } from "@/features/fitness-suite/workouts/library";
export function Step5Treino() {
  const { state, updateState, nextStep, prevStep } = useDrMindSetfit()

  
  // PREMIUM_WEEKLY_PROTOCOL_BUILDER_V1
  const buildWeeklyProtocol = (rawState: any) => {
    try {
      const days = ["Segunda","Terça","Quarta","Quinta","Sexta","Sábado","Domingo"];
      const modalities = Array.isArray(rawState?.workoutModalities) && rawState.workoutModalities.length
        ? rawState.workoutModalities.map(String)
        : (typeof rawState?.workoutSecondaryModality === "string" && rawState.workoutSecondaryModality && rawState.workoutSecondaryModality !== "none")
          ? [String(rawState.workoutSecondaryModality)]
          : [];

      const levelByModality = (rawState?.workoutLevelByModality && typeof rawState.workoutLevelByModality === "object")
        ? rawState.workoutLevelByModality
        : {};

      const schedule = (rawState?.workoutScheduleByModality && typeof rawState.workoutScheduleByModality === "object")
        ? rawState.workoutScheduleByModality
        : null;

      const sessions = [];
      let rot = 0;
      for (const day of days) {
        let chosen = null;
        if (schedule && modalities.length) {
          // prioriza modalidade que explicitamente inclui o dia (por chave curta pt-BR, ex: seg/ter/qua/qui/sex/sab/dom)
          const key = day.toLowerCase().slice(0,3);
          const hit = modalities.find((m: any) => Array.isArray(schedule[m]) && schedule[m].some((d) => String(d).toLowerCase().startsWith(key)));
          chosen = hit || null;
        }
        if (!chosen && modalities.length) {
          chosen = modalities[rot % modalities.length];
          rot++;
        }
        if (!chosen) continue;
        sessions.push({
          day,
          modality: chosen,
          modalityLevel: (chosen && levelByModality) ? (levelByModality[chosen] ?? null) : null,
        });
      }

      return {
        generatedAt: new Date().toISOString(),
        modalities,
        levelByModality,
        sessions,
      };
    } catch {
      return null;
    }
  };
const __mfLevels = ["iniciante","intermediario","avancado","atleta"] as const;
  type __MfLevel = typeof __mfLevels[number];

  const __mfGetSelectedModalities = (): string[] => {
    const primary = (state as any)?.workoutModalities?.length
      ? (state as any).workoutModalities
      : ((state as any)?.workoutModality ? [(state as any).workoutModality] : []);
    const sec = String(((state as any)?.workoutSecondaryModality ?? "none"));
    const all = [
      ...(Array.isArray(primary) ? primary : []),
      ...(sec && sec !== "none" ? [sec] : []),
    ].filter(Boolean);
    return Array.from(new Set(all));
  };

  const __mfLevelByModality = (((state as any)?.workoutLevelByModality ?? {}) as Record<string, __MfLevel>);
  const __mfSetLevel = (modKey: string, lvl: __MfLevel) => {
    updateState({ workoutLevelByModality: { ...__mfLevelByModality, [modKey]: lvl } } as any);
  };
  const [treinoGerado, setTreinoGerado] = useState<PlanejamentoTreino | null>(state.treino || null)
  const [mostrandoSelector, setMostrandoSelector] = useState(!state.treino)

  const handleSelecionarDivisao = (config: DivisaoTreinoConfig) => {
    const treino = gerarTreinoPersonalizado(config, state.perfil)
    setTreinoGerado(treino)
    setMostrandoSelector(false)
  }

  const handleContinuar = () => {
    if (treinoGerado) {
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

      
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Nível por modalidade</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Defina seu nível em cada modalidade escolhida. Ex.: atleta na musculação e iniciante no crossfit.
            </p>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">perfil</span>
        </div>

        {(() => {
          const selected = __mfGetSelectedModalities();
          if (!selected.length) {
            return <div className="text-sm text-muted-foreground">Selecione ao menos uma modalidade para ajustar o nível.</div>;
          }
          return (
            <div className="space-y-3">
              {selected.map((modKey) => {
                const current = (__mfLevelByModality[modKey] ?? (state as any)?.perfil?.nivelAtividade ?? "iniciante") as any;
                const mod = MODALITIES.find((m) => m.key === modKey);
                const label = mod?.label ?? modKey;

                return (
                  <div key={modKey} className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{label}</div>
                      <div className="text-[11px] text-muted-foreground">{String(current)}</div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {(__mfLevels as any).map((lvl: any) => {
                        const on = String(current) === String(lvl);
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => __mfSetLevel(modKey, lvl)}
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
          );
        })()}
      </div>

      

      

      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Modalidades da semana</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Você pode combinar mais de uma modalidade. O sistema alterna as modalidades pelos dias escolhidos, mantendo seu nível.
            </p>
          </div>
          <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">multi</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {MODALITIES.map((m) => {
            const selected: string[] =
              ((state as any)?.workoutModalities?.length
                ? (state as any).workoutModalities
                : ((state as any)?.workoutModality ? [(state as any).workoutModality] : [])) as any;

            const isOn = selected.includes(m.key);

            return (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  const cur = new Set(selected);
                  if (cur.has(m.key)) cur.delete(m.key);
                  else cur.add(m.key);
                  const next = Array.from(cur);
                  updateState({
                    workoutModalities: next,
                    workoutModality: next[0] ?? (state as any)?.workoutModality,
                  } as any);
                }}
                className={`w-full text-left rounded-xl border px-3 py-3 transition ${isOn ? "border-white/20 bg-white/10" : "border-white/10 bg-transparent hover:bg-white/5"}`}
              >
                <div className="text-sm font-medium">{m.label}</div>

<div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 space-y-3">
  <div className="flex items-start justify-between gap-3">
    <div>
      <h3 className="text-base sm:text-lg font-semibold">Nível por modalidade</h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
        Ajuste o nível por modalidade (ex.: atleta em musculação, iniciante em crossfit). Se não escolher, usamos seu nível geral como padrão.
      </p>
    </div>
    <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">personalização</span>
  </div>

  {(() => {
    const selected = (((state as any)?.workoutModalities?.length ? (state as any).workoutModalities : ((state as any)?.workoutModality ? [(state as any).workoutModality] : [])) || []) as string[];
    const sec = String(((state as any)?.workoutSecondaryModality ?? "none"));
    const all = Array.from(new Set([...(Array.isArray(selected) ? selected : []), ...(sec && sec !== "none" ? [sec] : [])].filter(Boolean)));
    const levels = (((state as any)?.workoutLevelByModality ?? {}) as Record<string, string>);
    const fallback = String(((state as any)?.perfil?.nivelAtividade ?? (state as any)?.perfil?.nivel ?? "intermediario"));

    if (!all.length) return <div className="text-sm text-muted-foreground">Selecione ao menos uma modalidade para definir níveis.</div>;

    const opts = [
      { v: "iniciante", l: "Iniciante" },
      { v: "intermediario", l: "Intermediário" },
      { v: "avancado", l: "Avançado" },
      { v: "atleta", l: "Atleta" },
    ];

    return (
      <div className="grid gap-3">
        {all.map((modKey) => {
          const mod = MODALITIES.find((m) => m.key === modKey);
          const label = mod?.label ?? modKey;
          const cur = levels[modKey] || fallback;

          return (
            <div key={modKey} className="rounded-xl border border-white/10 bg-black/10 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{label}</div>
                <div className="text-[11px] text-muted-foreground">padrão: {fallback}</div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {opts.map((o) => {
                  const on = cur === o.v;
                  return (
                    <button
                      key={o.v}
                      type="button"
                      onClick={() => {
                        const next = { ...(levels || {}), [modKey]: o.v };
                        updateState({ workoutLevelByModality: next } as any);
                      }}
                      className={`rounded-full px-3 py-1 text-xs border transition ${on ? "border-white/20 bg-white/10" : "border-white/10 bg-transparent hover:bg-white/5"}`}
                    >
                      {o.l}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...(levels || {}) };
                    delete next[modKey];
                    updateState({ workoutLevelByModality: next } as any);
                  }}
                  className="rounded-full px-3 py-1 text-xs border border-white/10 bg-transparent hover:bg-white/5 text-muted-foreground"
                >
                  Reset
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  })()}
</div>

                <div className="text-xs text-muted-foreground">{m.desc}</div>
              </button>
            );
          })}
        </div>

        <p className="text-[11px] text-muted-foreground">
          Dica: selecione 2–3 modalidades para uma semana equilibrada (ex.: musculação + cardio + mobilidade).
        </p>
      </div>

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
