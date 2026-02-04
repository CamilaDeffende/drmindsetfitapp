import { useEffect, useState } from "react";
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Home, Calendar, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DietaAtivaView } from '@/components/planos/DietaAtivaView'
import { TreinoAtivoView } from '@/components/planos/TreinoAtivoView'
import type { DietaAtiva, TreinoAtivo } from '@/types'
import { buildWeeklyPlan } from "@/features/fitness-suite/workouts/library";
import { MODALITIES } from "@/features/fitness-suite/workouts/library";
import { WeeklyProtocolActive } from "@/components/treino/WeeklyProtocolActive";
import { adaptActivePlanNutrition } from "@/services/nutrition/nutrition.adapter";

import { loadActivePlan } from "@/services/plan.service";

const HIDE_ADVANCED_MODALITY_UI = true;

export function PlanosAtivos() {
  // BLOCO G1 (fonte única): PlanosAtivos apenas LÊ ActivePlan e renderiza (não calcula aqui).
  const [activePlan, setActivePlan] = useState<any>(null);
  const [planLoaded, setPlanLoaded] = useState(false);

  useEffect(() => {
    try {
      const p = loadActivePlan();
      setActivePlan(p);
    } finally {
      setPlanLoaded(true);
    }
  }, []);

  const kcal = activePlan?.nutrition?.kcalTarget ?? activePlan?.nutrition?.kcal ?? null;
  const macros = activePlan?.nutrition?.macros ?? null;
  const meals = activePlan?.nutrition?.meals ?? [];
  
  // __MF_NUTRITION_ADAPTER_V1__
  const adapted = adaptActivePlanNutrition(activePlan?.nutrition);
const week = activePlan?.workout?.week ?? activePlan?.workout?.days ?? [];

  const { state, updateState } = useDrMindSetfit()
  

  // Fonte da verdade do treino ativo (gerado no Step5)
  const treinoPlan = (state as any)?.treino ?? (state as any)?.workoutProtocolWeekly?.treinoPlan ?? null;
const navigate = useNavigate()

  const exportarPDF = async () => {
    try {
      const { exportarPDFCompleto } = await import('@/lib/exportar-pdf')
      await exportarPDFCompleto(state, 0, 0, 0)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao gerar PDF. Tente novamente.')
    }
  }

  // Inicializar planos ativos na primeira renderização (se ainda não existirem)
  useEffect(() => {
    // __MF_NUTRITION_ADAPTER_APPLY_V1__
    // Se houver plano ativo com meals/macros e nutricao ainda nao estiver hidratada, popula no formato do app.
    try {
      const hasRef = !!(state as any)?.nutricao?.refeicoes?.length;
      const hasMacros = !!(state as any)?.nutricao?.macros;
      if ((!hasRef || !hasMacros) && adapted) {
        updateState({
          nutricao: {
            ...(state as any).nutricao,
            macros: adapted.macros,
            refeicoes: adapted.refeicoes,
          },
        });
      }
    } catch {}

    // Criar dieta ativa se ainda não existir
    if (state.nutricao && !state.dietaAtiva) {
      const hoje = new Date()
      const dataInicio = hoje.toISOString().split('T')[0]
      const dataFim = new Date(hoje.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +4 semanas

      const dietaAtiva: DietaAtiva = {
        dataInicio,
        dataFim,
        duracaoSemanas: 4,
        estrategia: 'Dieta 4 semanas',
        nutricao: state.nutricao
      }

      updateState({ dietaAtiva })
    }

    // Criar treino ativo se ainda não existir
    if (state.treino && !state.treinoAtivo) {
      const hoje = new Date()
      const dataInicio = hoje.toISOString().split('T')[0]
      const dataFim = new Date(hoje.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +4 semanas

      const treinoAtivo: TreinoAtivo = {
        dataInicio,
        dataFim,
        duracaoSemanas: 4,
        estrategia: 'Treino 4 semanas',
        treino: state.treino,
        cargasPorSerie: []
      }

      updateState({ treinoAtivo })
    }
  }, [state.nutricao, state.treino, state.dietaAtiva, state.treinoAtivo, updateState])

  if (!state.concluido) {
    
  const __mfWeeklyPlan = (typeof buildDeterministicWeeklyPlan === "function")
    ? buildDeterministicWeeklyPlan(state as any)
    : ((typeof mfBuildWeeklyPlanFromState === "function") ? mfBuildWeeklyPlanFromState(state as any) : null);
  const __mfSessions = Array.isArray((__mfWeeklyPlan as any)?.sessions) ? (__mfWeeklyPlan as any).sessions : [];
  const __mfModalities = Array.from(new Set(__mfSessions.map((x: any) => String(x?.modality ?? ""))).values()).filter(Boolean);
  const __mfPlanLevel = (__mfModalities.length <= 1) ? "foco" : "misto";

  const __mfHasMulti = Array.isArray((state as any)?.workoutModalities) && ((state as any).workoutModalities.length > 0);

  const __mfLevelByModality = ((state as any)?.workoutLevelByModality ?? null) as any;

  
  const getModalityLevelLabel = (key: string | null) => {
    if (!key) return null;
    const label =
      (typeof MODALITIES !== "undefined"
        ? MODALITIES.find((m) => m.key === key)?.label
        : null) || key;
    const level = __mfLevelByModality ? __mfLevelByModality[key] : null;
    return level ? `${label} • ${level}` : label;
  };

return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="mb-4">
          <div data-testid="active-plan-panel" className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm text-white/60">Plano Ativo</div>
                <div className="text-lg font-semibold">Nutrição + Treino (fonte única)</div>
              </div>
              <div className="text-xs text-white/50">Carregado: {planLoaded ? "sim" : "não"}</div>
            </div>

            {activePlan ? (
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-xl bg-white/5 p-3">
                  <div className="text-xs text-white/60">Calorias alvo</div>
                  <div className="mt-1 text-xl font-semibold">{kcal ? `${kcal} kcal/dia` : "—"}</div>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <div className="text-xs text-white/60">Macros</div>
                  <div className="mt-1 text-sm text-white/80">
                    {macros ? `${macros.protein ?? "—"}g P • ${macros.carbs ?? "—"}g C • ${macros.fat ?? "—"}g G` : "—"}
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <div className="text-xs text-white/60">Refeições</div>
                  <div className="mt-1 text-sm text-white/80">{Array.isArray(meals) ? meals.length : 0} / dia</div>
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-white/70">
                Nenhum plano ativo encontrado ainda. Finalize o onboarding e confirme para salvar o plano.
              </div>
            )}

            {activePlan && Array.isArray(week) && week.length ? (
              <div className="mt-4">
                <div className="text-xs text-white/60">Semana (preview)</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {week.slice(0, 7).map((d: any, i: number) => (
                    <div key={i} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/80">
                      {d?.day ?? d?.label ?? `Dia ${i+1}`} • {d?.modality ?? d?.type ?? "—"}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

      {/* MF_TREINOS_ATIVOS_PREMIUM_CLEAN_V1 */}
      <WeeklyProtocolActive />
      {/* MF_TREINOS_ATIVOS_PROTOCOL_V4 */}
      <WeeklyProtocolActive />
      {}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          {!HIDE_ADVANCED_MODALITY_UI && (
<div>
            <h3 className="text-base sm:text-lg font-semibold">Modalidade secundária</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Opcional. Combine dois focos na semana (ex.: musculação + crossfit). Se não quiser, selecione “Sem modalidade secundária”.
            </p>
          </div>
)}
          <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">opcional</span>
        </div>

        <select
          className="w-full rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-white/10"
          value={String(((state as any)?.workoutSecondaryModality ?? "none"))}
          onChange={(e) => updateState({ workoutSecondaryModality: e.target.value } as any)}
        >
          <option value="none">Sem modalidade secundária</option>
          {MODALITIES.map((m) => (
            <option key={m.key} value={m.key}>{m.label}</option>
          ))}
        </select>

        <p className="text-[11px] text-muted-foreground">
          Isso cria um segundo protocolo completo de treino (semanal), respeitando seu nível e os dias escolhidos.
        </p>
      </div>

      {}
      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          {!HIDE_ADVANCED_MODALITY_UI && (
<div>
            <h3 className="text-base sm:text-lg font-semibold">Dias por modalidade</h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Selecione em quais dias você quer executar cada modalidade. Se você não marcar nada, a distribuição automática continua valendo.
            </p>
          </div>
)}
          <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">agenda</span>
        </div>

        {(() => {
          const days = [
            { key: "Seg", label: "Seg" },
            { key: "Ter", label: "Ter" },
            { key: "Qua", label: "Qua" },
            { key: "Qui", label: "Qui" },
            { key: "Sex", label: "Sex" },
            { key: "Sab", label: "Sáb" },
            { key: "Dom", label: "Dom" },
          ];

          const primarySelected = ((state as any)?.workoutModalities?.length
            ? (state as any).workoutModalities
            : ((state as any)?.workoutModality ? [(state as any).workoutModality] : [])) as string[];

          const sec = String(((state as any)?.workoutSecondaryModality ?? "none"));
          const selected = Array.from(new Set([
            ...(Array.isArray(primarySelected) ? primarySelected : []),
            ...(sec && sec !== "none" ? [sec] : []),
          ].filter(Boolean)));

          const schedule = ((state as any)?.workoutScheduleByModality ?? {}) as Record<string, string[]>;

          if (!selected.length) {
            return (
              <div className="text-sm text-muted-foreground">Selecione ao menos uma modalidade para configurar os dias.</div>
            );
          }

          const toggle = (modKey: string, dayKey: string) => {
            const cur = Array.isArray(schedule[modKey]) ? schedule[modKey] : [];
            const next = cur.includes(dayKey) ? cur.filter((d) => d !== dayKey) : [...cur, dayKey];
            updateState({ workoutScheduleByModality: { ...schedule, [modKey]: next } } as any);
          };

          const clear = (modKey: string) => {
            const next = { ...schedule };
            delete next[modKey];
            updateState({ workoutScheduleByModality: next } as any);
          };

          return (
            <div className="space-y-4">
              {selected.map((modKey) => {
                const mod = MODALITIES.find((m) => m.key === modKey);
                const label = mod?.label ?? modKey;
                const cur = Array.isArray(schedule[modKey]) ? schedule[modKey] : [];

                return (
                  <div key={modKey} className="rounded-xl border border-white/10 bg-black/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{label}</div>
                      <button
                        type="button"
                        className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground hover:text-white"
                        onClick={() => clear(modKey)}
                      >
                        Limpar
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {days.map((d) => {
                        const active = cur.includes(d.key);
                        return (
                          <button
                            key={d.key}
                            type="button"
                            onClick={() => toggle(modKey, d.key)}
                            className={
                              "px-3 py-2 rounded-xl text-xs border transition " +
                              (active
                                ? "border-white/20 bg-white/10 text-white"
                                : "border-white/10 bg-black/10 text-muted-foreground hover:text-white")
                            }
                          >
                            {d.label}
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

      {}
      {__mfHasMulti && __mfWeeklyPlan?.sessions?.length ? (
        <div className="mt-6 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Treinos da semana</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Distribuição automática por dia, alternando as modalidades selecionadas.
              </p>
            </div>
            <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">
              {__mfModalities.length} modalidades
            </span>
          </div>

          <div className="grid gap-3">
            {__mfWeeklyPlan.sessions.map((sesh: any) => (
              <div key={sesh.day} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">{sesh.day}
        
        {(sesh as any)?.modality && (
          <span className="ml-2 text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">
            {getModalityLevelLabel((sesh as any).modality)}
          </span>
        )}
      </div>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-2">
                    <span>{__mfPlanLevel}</span>
                    
                    {(() => {
                      try {
                        const __k =
                          (sesh as any)?.modality ||
                          (sesh as any)?.modalityKey ||
                          (sesh as any)?.modKey ||
                          null;
                        
                        const __label = (__k && typeof MODALITIES !== "undefined") ? (MODALITIES.find((m) => m.key === __k)?.label ?? __k) : __k;

                        void __label; // TS6133 guard (fallback seguro)
const __lvl = (__k && __mfLevelByModality) ? __mfLevelByModality[__k] : null;
                        return __lvl ? (
                          <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5">
                            {String(__lvl)}
                          </span>
                        ) : null;
                      } catch {
                        return null;
                      }
                    })()}
                  </div>
                </div>

                <div className="mt-3 space-y-3">
    {(sesh as any)?.modality && (
      <div className="text-xs text-muted-foreground">
        {getModalityLevelLabel((sesh as any).modality)}
      </div>
    )}
  
                  {(sesh.blocks || []).map((b: any, bi: number) => (
                    <div key={bi} className="rounded-xl border border-white/10 bg-black/10 p-3">
                      <div className="text-sm font-medium">{b.title}</div>
                      <div className="text-xs text-muted-foreground">{b.goal}</div>

                      <div className="mt-3 space-y-2">
                        {(b.main || []).slice(0, 8).map((it: any, ii: number) => (
                          <div key={ii} className="flex items-start justify-between gap-3 text-xs">
                            <div className="text-foreground/90">{it.name}</div>
                            <div className="text-muted-foreground whitespace-nowrap">
                              {it.time ? it.time : String((it.sets ?? "")) + "x " + String((it.reps ?? ""))} {it.rest ? "• " + it.rest : ""}
                            </div>
                          </div>
                        ))}
                        {Array.isArray(b.main) && b.main.length > 8 ? (
                          <div className="text-[11px] text-muted-foreground">+ {b.main.length - 8} exercícios (variações no plano)</div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

        <Card className="w-full max-w-md mx-4 glass-effect neon-border">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-neon mb-4">Complete seu Perfil</h2>
            <p className="text-gray-400 mb-6">Inicie o questionário para desbloquear seus planos</p>
            <Button onClick={() => navigate('/')} className="w-full glow-blue">
              Iniciar Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const temDieta = !!state.dietaAtiva
  const temTreino = !!state.treinoAtivo

  if (!temDieta && !temTreino) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="w-full max-w-md mx-4 glass-effect neon-border">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-neon mb-4">Nenhum Plano Ativo</h2>
            <p className="text-gray-400 mb-6">Configure seus planos de dieta e treino primeiro</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full glow-blue">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-green-950/20 to-black text-white">
      {/* Header Premium com Verde Neon */}
      <header className="sticky top-0 z-50 glass-effect border-b border-green-500/30 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                Planos Ativos
              </h1>
              <p className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                <Calendar className="w-3 h-3" />
                Acompanhe sua dieta e treino
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={exportarPDF}
                className="hover:bg-green-500/20"
                title="Exportar PDF completo"
              >
                <Download className="w-5 h-5 text-green-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="hover:bg-green-500/20"
              >
                <Home className="w-5 h-5 text-green-400" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Container com efeito verde neon */}
        <div className="relative">
          {/* Glow verde de fundo */}
          <div className="absolute inset-0 bg-green-500/5 rounded-3xl blur-3xl" />

          {/* Card principal */}
          <Card className="relative glass-effect border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
            <CardContent className="p-6">
              <Tabs defaultValue={temDieta ? 'dieta' : 'treino'} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/40 border border-green-500/20">
                  {temDieta && (
                    <TabsTrigger
                      value="dieta"
                      className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 data-[state=active]:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    >
                      Dieta Ativa
                    </TabsTrigger>
                  )}
                  {temTreino && (
                    <TabsTrigger
                      value="treino"
                      className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 data-[state=active]:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    >
                      Treino Ativo
                    </TabsTrigger>
                  )}
                </TabsList>

                {temDieta && (
                  <TabsContent value="dieta" className="mt-0">
                    <DietaAtivaView dietaAtiva={state.dietaAtiva!} />
                  

        <div className="mt-4">
          <Button
            onClick={() => navigate("/nutrition")}
            className="w-full h-11 text-base font-semibold glow-blue"
          >
            Editar Nutrição
          </Button>
          <p className="mt-2 text-xs text-gray-400">
            Ajuste refeições, alimentos e equivalências mantendo a consistência calórica do plano.
          </p>
        </div>
</TabsContent>
                )}

                {temTreino && (
                  <TabsContent value="treino" className="mt-0">
        {/* Protocolo Inteligente (Active Workouts) */}
        <div data-testid="active-workout-protocol" className="mt-4 space-y-3">
          {!treinoPlan ? (
            <div className="rounded-xl border border-border/50 p-4 text-sm text-muted-foreground">
              Nenhum treino ativo gerado ainda. Finalize o onboarding e clique em <strong>Gerar Treino</strong> no Step 5.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-xl border border-border/50 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold">Treinos Ativos</p>
                    <p className="text-xs text-muted-foreground">
                      {treinoPlan?.divisaoSemanal} • {treinoPlan?.frequencia}x/semana
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Fonte: <span className="font-medium">treinoPlan</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {(treinoPlan?.treinos ?? []).map((dia: any, idx: number) => (
                  <div key={idx} className="rounded-xl border border-border/50 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{dia?.dia} • {dia?.modalidade}</p>
                        <p className="text-xs text-muted-foreground mt-1">{dia?.titulo}</p>
                        {Array.isArray(dia?.grupamentos) && dia.grupamentos.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Grupamentos: <span className="font-medium">{dia.grupamentos.join(" + ")}</span>
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(dia?.exercicios?.length ?? 0)} exercícios
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {(dia?.exercicios ?? []).map((ex: any, eIdx: number) => (
                        <div key={eIdx} className="rounded-lg bg-muted/40 p-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <p className="text-sm font-medium">{ex?.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {ex?.series ? `${ex.series}x` : ""}
                              {ex?.reps ? ` ${ex.reps}` : ""}
                              {ex?.descanso ? ` • Desc: ${ex.descanso}` : ""}
                              {ex?.rpe ? ` • ${ex.rpe}` : ""}
                            </p>
                          </div>
                          {ex?.observacoes && (
                            <p className="text-xs text-muted-foreground mt-1">{ex.observacoes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

                    
          <WeeklyProtocolActive />
<TreinoAtivoView treinoAtivo={state.treinoAtivo!} />
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

export function mfBuildWeeklyPlanFromState(state: any) {
  const __mfPickModalityForDay = (day: string, idx: number, modalities: string[], rawState: any): string | null => {
    const sch = (rawState && rawState.workoutScheduleByModality) ? rawState.workoutScheduleByModality : null;
    
    const mfLevelByModality = ((rawState && rawState.workoutLevelByModality) ? rawState.workoutLevelByModality : null) as any;

    
    void mfLevelByModality;

void mfLevelByModality;
if (sch && typeof sch === "object") {
      for (const mk of (modalities || [])) {
        const arr = sch[mk];
        if (Array.isArray(arr) && arr.includes(day)) return mk;
      }
    }
    return (modalities && modalities.length) ? __mfPickModalityForDay(day, idx, modalities, state as any) : null;
  };

  const modalities = (state?.workoutModalities?.length ? state.workoutModalities : (state?.workoutModality ? [state.workoutModality] : ["musculacao"])) as any[];
  const level = (state?.workoutLevel ?? state?.nivelTreino ?? "intermediario") as any;
  const days = (state?.workoutDays ?? state?.diasTreino ?? ["Seg", "Qua", "Sex"]) as any[];
  return buildWeeklyPlan({ modalities, level, days });
}

function buildDeterministicWeeklyPlan(state: any) {
  const raw = (state || {}) as any;

  const modalities: string[] = Array.isArray(raw.workoutModalities) && raw.workoutModalities.length
    ? raw.workoutModalities
    : (raw.workoutModality ? [raw.workoutModality] : []);

  const levels = (raw.workoutLevelByModality || {}) as Record<string, string>;
  const sched = (raw.workoutScheduleByModality || {}) as Record<string, string[]>;
  const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  const picked = modalities.filter(Boolean);
  if (!picked.length) return { sessions: [], levelByModality: levels };

  // agenda determinística por dia
  const byDay: Record<string, string[]> = {};
  for (const d of days) {
    const dayPicked = picked.filter((m) => Array.isArray(sched[m]) ? sched[m].includes(d) : false);
    byDay[d] = dayPicked.length ? dayPicked : [picked[days.indexOf(d) % picked.length]];
  }

  const sessions = days.map((d) => {
    const m = byDay[d][0];
    return { day: d, modality: m, modalityLevel: (levels && m) ? (levels[m] || null) : null };
  });

  return { sessions, levelByModality: levels };
}
