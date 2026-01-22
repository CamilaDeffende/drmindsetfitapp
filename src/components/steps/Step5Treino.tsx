import { useMemo, useState } from "react";
import { BrandIcon } from "@/components/branding/BrandIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { buildWeeklyProtocol } from "@/features/fitness-suite/engine/weeklyProtocol";

import { computeFinalTargetCalories } from "@/features/fitness-suite/engine/goalEnergy";
const __mfAllowedModalities = ["musculacao","funcional","corrida","bike_indoor","crossfit"] as const;
type __MfModality = typeof __mfAllowedModalities[number];

const __mfLabelByKey: Record<__MfModality, string> = {
  musculacao: "Musculação",
  funcional: "Funcional",
  corrida: "Corrida",
  bike_indoor: "Bike Indoor",
  crossfit: "CrossFit",
};

const __mfLevels = ["iniciante","intermediario","avancado"] as const;
type __MfLevel = typeof __mfLevels[number];


const __mfDefaultLevels: Record<__MfModality, __MfLevel> = {
  musculacao: "iniciante",
  funcional: "iniciante",
  corrida: "iniciante",
  bike_indoor: "iniciante",
  crossfit: "iniciante",
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

function __mfSortDays(keys: __MfDayKey[]) {
  const order = new Map(__mfWeekDays.map((d, i) => [d.key, i] as const));
  return [...keys].sort((a,b) => (order.get(a) ?? 999) - (order.get(b) ?? 999));
}
import { generateWeeklyWorkout } from "@/features/fitness-suite/engine/workoutGenerator";

export function Step5Treino() {
  const { state, updateState, nextStep, prevStep } = useDrMindSetfit();

  // ===== Fonte da verdade (state) =====
  const initialModalities = useMemo(() => {
    const raw = (state as any)?.workoutModalities;
    const arr = Array.isArray(raw) ? raw.map(String) : [];
    return arr.filter((k: string) => (__mfAllowedModalities as any).includes(k)) as __MfModality[];
  }, [state]);

  const initialLevelByModality = useMemo(() => {
    const raw = (state as any)?.workoutLevelByModality;
    const obj = (raw && typeof raw === "object") ? raw : {};
    const next: Record<string, __MfLevel> = {};
    for (const k of Object.keys(obj)) {
      if ((__mfAllowedModalities as any).includes(k)) {
        const v = String((obj as any)[k]);
        next[k] = (__mfLevels as any).includes(v) ? (v as __MfLevel) : "iniciante";
      }
    }
    return next as Record<__MfModality, __MfLevel>;
  }, [state]);

  const initialDays = useMemo(() => {
    const raw = (state as any)?.workoutDaysSelected;
    const arr = Array.isArray(raw) ? raw.map(String) : [];
    const ok = arr.filter((k: string) => (__mfWeekDays as any).some((d: any) => d.key === k)) as __MfDayKey[];
    return __mfSortDays(ok);
  }, [state]);

  const initialPlanByDay = useMemo(() => {
    const raw = (state as any)?.workoutPlanByDay;
    const obj = (raw && typeof raw === "object") ? raw : {};
    const next: Record<string, string> = {};
    for (const k of Object.keys(obj)) {
      const dk = String(k) as __MfDayKey;
      const mk = String((obj as any)[k]);
      if ((__mfWeekDays as any).some((d: any) => d.key === dk) && (__mfAllowedModalities as any).includes(mk)) {
        next[dk] = mk;
      }
    }
    return next as Record<__MfDayKey, __MfModality>;
  }, [state]);

  // ===== Estado local (UI clean) =====
  const [selectedModalities, setSelectedModalities] = useState<__MfModality[]>(initialModalities);
  const [levelByModality, setLevelByModality] = useState<Record<__MfModality, __MfLevel>>(({ ...__mfDefaultLevels, ...initialLevelByModality }) as any);
  const [daysSelected, setDaysSelected] = useState<__MfDayKey[]>(initialDays);
  const [planByDay, setPlanByDay] = useState<Record<__MfDayKey, __MfModality>>((initialPlanByDay as any) ?? ({} as any));
  const [__mfGenerated, set__mfGenerated] = useState(false);
  const [__mfTreinoPreview, set__mfTreinoPreview] = useState<any>(null);
  const [__mfProtocolPreview, set__mfProtocolPreview] = useState<any>(null);

  const toggleModality = (k: __MfModality) => {
    const on = selectedModalities.includes(k);
    const next = on ? selectedModalities.filter((x) => x !== k) : [...selectedModalities, k];
    setSelectedModalities(next);

    // limpa dias que estavam apontando para uma modalidade removida
    if (on) {
      const nextPlan: any = { ...planByDay };
      for (const dk of Object.keys(nextPlan)) {
        if (String(nextPlan[dk]) === k) delete nextPlan[dk as __MfDayKey];
      }
      setPlanByDay(nextPlan);
    }
  };

  const toggleDay = (d: __MfDayKey) => {
    const on = daysSelected.includes(d);
    const next = on ? daysSelected.filter((x) => x !== d) : __mfSortDays([...daysSelected, d]);
    setDaysSelected(next);

    // ao remover um dia, remove também o mapeamento
    if (on) {
      const nextPlan: any = { ...planByDay };
      delete nextPlan[d];
      setPlanByDay(nextPlan);
    }
  };

  const setDayModality = (d: __MfDayKey, mod: __MfModality) => {
    if (!selectedModalities.includes(mod)) return;
    setPlanByDay({ ...planByDay, [d]: mod } as any);
  };

  const setLevel = (mod: __MfModality, lvl: __MfLevel) => {
    setLevelByModality({ ...levelByModality, [mod]: lvl } as any);
  };

  const canContinue = useMemo(() => {
    if (!selectedModalities.length) return false;
    if (!daysSelected.length) return false;
    for (const d of daysSelected) {
      if (!planByDay?.[d]) return false;
    }
    return true;
  }, [selectedModalities, daysSelected, planByDay]);

  const persistToState = () => {
    updateState({
      workoutModalities: selectedModalities,
      workoutLevelByModality: Object.fromEntries(selectedModalities.map((m) => [m, levelByModality[m] ?? "iniciante"])),
      workoutDaysSelected: daysSelected,
      workoutPlanByDay: planByDay,
    } as any);
  };

    const handleGerarTreino = () => {
if (!canContinue) return;

    // persiste coleta essencial
    persistToState();

    // gera protocolo semanal (motor)
    const __protocol = buildWeeklyProtocol({
      ...(state as any),
      workoutModalities: selectedModalities,
      workoutLevelByModality: Object.fromEntries(selectedModalities.map((m) => [m, levelByModality[m] ?? "iniciante"])),
      workoutDaysSelected: daysSelected,
      workoutPlanByDay: planByDay,
    });

        // energia alvo final (GET + ajuste por objetivo + carga semanal)
    const getKcal = Number((state as any)?.metabolismo?.get ?? (state as any)?.metabolismo?.caloriasAlvo ?? 0);
    const pesoKg = Number((state as any)?.avaliacao?.peso ?? (state as any)?.perfil?.pesoAtual ?? 70);
    const nivelAtv = String((state as any)?.metabolismo?.nivelAtividade ?? (state as any)?.perfil?.nivelTreino ?? 'iniciante').toLowerCase();
    const level = (nivelAtv.includes('avan') ? 'avancado' : nivelAtv.includes('inter') ? 'intermediario' : 'iniciante');
    const goalRaw = (state as any)?.perfil?.objetivo;
    const energy = computeFinalTargetCalories({
      getKcal: getKcal || 0,
      goalRaw,
      level,
      daysSelected,
      planByDay: planByDay as any,
      pesoKg,
    });

    // persistir no state para Nutrição/Relatório (transparência + consistência)
    updateState({
      metabolismo: {
        ...(state as any).metabolismo,
        objetivoNormalizado: energy.goal,
        treinoKcalSemanalEstimado: energy.treinoKcalSemanal,
        treinoKcalDiaMedioEstimado: energy.treinoKcalDiaMedio,
        deltaObjetivoKcal: energy.deltaObjetivoKcal,
        caloriasAlvo: energy.caloriasAlvoFinal,
        caloriasAlvoFinal: energy.caloriasAlvoFinal,
      },
    } as any);

    // Treino inteligente (individualizado + variações por seed)
    const treinoPlan = generateWeeklyWorkout({ state, daysSelected, planByDay: (planByDay as any) });
    updateState({ treino: treinoPlan } as any);

    // anexar ao protocolo semanal (fallback p/ telas que leem workoutProtocolWeekly)
    try { (__protocol as any).treinoPlan = treinoPlan; } catch (e) {}
    
updateState({ workoutProtocolWeekly: __protocol } as any);

    // Preview completo do protocolo (antes de avançar)
    set__mfTreinoPreview(treinoPlan);
    set__mfProtocolPreview(__protocol);
    set__mfGenerated(true);

  };

  const handleContinuar = () => {
    if (!__mfGenerated) return;
    // já gerado e persistido — apenas avança no fluxo
    nextStep();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <BrandIcon size={18} />
          <div>
            <div className="text-lg font-semibold">Protocolo de treino</div>
            <div className="text-xs text-muted-foreground">Selecione modalidades, nível e dias. Em seguida, o sistema gera sua semana completa.</div>
          </div>
        </div>
      </div>

      {/* 1) Modalidades da sua semana */}
      <Card className="mt-4 border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Seleção de modalidades</CardTitle>
          <CardDescription>Escolha só o que você realmente pratica. Isso direciona o motor de geração do protocolo.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(__mfAllowedModalities as any).map((k: __MfModality) => {
              const on = selectedModalities.includes(k);
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => toggleModality(k)}
                  className={`rounded-full px-3 py-1.5 text-xs border transition ${on ? "border-white/20 bg-white/10" : "border-white/10 bg-transparent hover:bg-white/5"}`}
                >
                  {__mfLabelByKey[k]}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2) Nível por modalidade */}
      <Card className="mt-4 border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Nível por modalidade</CardTitle>
          <CardDescription>Autoavaliação rápida: isso ajusta volume, intensidade e progressão.</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedModalities.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedModalities.map((modKey) => {
                const current = levelByModality?.[modKey] ?? "iniciante";
                return (
                  <div key={modKey} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-semibold">{__mfLabelByKey[modKey]}</div>
                      <Badge variant="secondary" className="capitalize">{String(current)}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(__mfLevels as any).map((lvl: __MfLevel) => {
                        const on = String(current) === String(lvl);
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setLevel(modKey, lvl)}
                            className={`rounded-full px-3 py-1.5 text-xs border transition capitalize ${on ? "border-white/20 bg-white/10" : "border-white/10 bg-transparent hover:bg-white/5"}`}
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
          ) : (
            <div className="text-xs text-muted-foreground">Selecione pelo menos 1 modalidade para liberar esta etapa.</div>
          )}
        </CardContent>
      </Card>

      {/* 3) Agenda da semana + modalidade por dia */}
      <Card className="mt-4 border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Dias da semana</CardTitle>
          <CardDescription>Escolha os dias de treino e atribua uma modalidade para cada dia selecionado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
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
              {daysSelected.map((dk) => {
                const dLabel = (__mfWeekDays as any).find((x: any) => x.key === dk)?.label ?? dk;
                const chosen = planByDay?.[dk] ?? null;
                return (
                  <div key={dk} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="text-sm font-semibold">{dLabel}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedModalities.map((mk) => {
                        const on = String(chosen) === String(mk);
                        return (
                          <button
                            key={mk}
                            type="button"
                            onClick={() => setDayModality(dk, mk)}
                            className={`rounded-full px-3 py-1.5 text-xs border transition ${on ? "border-white/20 bg-white/10" : "border-white/10 bg-transparent hover:bg-white/5"}`}
                          >
                            {__mfLabelByKey[mk]}
                          </button>
                        );
                      })}
                      {!selectedModalities.length ? (
                        <span className="text-xs text-muted-foreground">Selecione modalidades acima para liberar as opções.</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-3 text-xs text-muted-foreground">Selecione ao menos 1 dia para montar sua agenda.</div>
          )}
        </CardContent>
      </Card>

            {/* PREVIEW TREINO GERADO */}
      {__mfGenerated && (__mfTreinoPreview?.treinos?.length || __mfProtocolPreview) ? (
        <Card className="mt-4 border-white/10 bg-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Seu protocolo semanal</CardTitle>
            <CardDescription>
              Treino individualizado com base nas suas modalidades, nível e dias selecionados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(__mfTreinoPreview?.treinos ?? []).map((dia: any, idx: number) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{dia?.dia ?? "Dia"}</div>
                    <Badge variant="secondary" className="text-xs">
                      {(dia?.exercicios?.length ?? 0)} exercícios
                    </Badge>
                  </div>
                  {dia?.foco ? (
                    <div className="mt-1 text-xs text-muted-foreground">{dia.foco}</div>
                  ) : null}
                  <div className="mt-3 space-y-1">
                    {(dia?.exercicios ?? []).map((ex: any, eIdx: number) => (
                      <div key={eIdx} className="text-xs text-muted-foreground">
                        • <span className="text-foreground/90">{ex?.nome ?? "Exercício"}</span>
                        {ex?.series ? <> — {ex.series}x{ex?.reps ?? ""}</> : null}
                        {ex?.tempo ? <> — {ex.tempo}</> : null}
                        {ex?.descanso ? <> • Desc: {ex.descanso}</> : null}
                        {ex?.intensidade ? <> • {ex.intensidade}</> : null}
                      </div>
                    ))}
                  </div>
                  {dia?.observacoes ? (
                    <div className="mt-3 text-xs text-muted-foreground italic">{dia.observacoes}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={prevStep} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={__mfGenerated ? handleContinuar : handleGerarTreino}
          disabled={!canContinue}
          className="gap-2 bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF]"
        >
          Gerar minha semana <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
