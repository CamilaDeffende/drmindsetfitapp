import { useMemo, useState } from "react";
import { BrandIcon } from "@/components/branding/BrandIcon";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { buildWeeklyProtocol } from "@/features/fitness-suite/engine/weeklyProtocol";
import { planWeek, type PlannerInput } from "@/engine/planner/trainingPlanner.engine";
import { plannerWeekToTreinoPlan } from "@/engine/planner/plannerWeekToTreino.adapter";

import { buildStrengthWeekPlan } from "@/features/fitness-suite/engine/strength/strengthWeekPlanner";
import { toWeekdayKey } from "@/utils/strength/weekdayMap";
import { loadSelectedGroups, saveWeekPlan } from "@/utils/strength/strengthWeekStorage";
import { StrengthMuscleGroupsPicker } from "@/components/strength/StrengthMuscleGroupsPicker";
import type { WeekdayKey } from "@/utils/strength/strengthWeekStorage";
import { computeFinalTargetCalories } from "@/features/fitness-suite/engine/goalEnergy";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
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
/* MF_PLANNER2_MODALITY_MAP_V1 */
function mfMapModalitiesToPlanner(raw: any): PlannerInput["modalities"] {
  const arr = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  const out = [];
  for (const x of arr) {
    const k = String(x ?? "").toLowerCase();
    if (!k) continue;
    if (k.includes("mus") || k.includes("strength") || k.includes("gym")) out.push("strength");
    else if (k.includes("corr") || k.includes("run")) out.push("running");
    else if (k.includes("cic") || k.includes("bike") || k.includes("cycl")) out.push("cycling");
  }
  // fallback seguro
  const unique = Array.from(new Set(out));
  return (unique.length ? unique : (["strength"] as any)) as any;
}

function mfMapLevelToPlanner(raw: any): PlannerInput["level"] {
  const k = String(raw ?? "").toLowerCase();
  if (k.includes("avan")) return "avancado";
  if (k.includes("inter")) return "intermediario";
  return "iniciante";
}

function mfMapGoalToPlanner(raw: any): PlannerInput["goal"] {
  const k = String(raw ?? "").toLowerCase();
  if (k.includes("perf")) return "performance";
  if (k.includes("cond")) return "condicionamento";
  if (k.includes("emag") || k.includes("cut")) return "emagrecimento";
  return "condicionamento";
}

// MF_STEP5_PROPS_V2
export type Step5TreinoProps = {
  onNext?: () => void;
  onBack?: () => void;
};
export function Step5Treino({ onNext, onBack }: Step5TreinoProps) {
  
  // MF_STEP5_FLOW_V2: avanço/volta via props (OnboardingFlow) com fallback no context
  const __onNext = typeof onNext === "function" ? onNext : () => { try { nextStep?.(); } catch {} };
  const __onBack = typeof onBack === "function" ? onBack : () => { try { prevStep?.(); } catch {} };

const [strengthGroupsError, setStrengthGroupsError] = useState<string | null>(null);
  const { state, updateState, nextStep, prevStep } = useDrMindSetfit();

/* MF_BLOCK2_1_STEP5TREINO_AUTOSAVE */
  const __mf_step5treino_payload = {
    step5Treino: (state as any).treino ?? (state as any).training ?? {},
    treino: (state as any).treino,
    workoutProtocolWeekly: (state as any).workoutProtocolWeekly,
  };
  useOnboardingDraftSaver(__mf_step5treino_payload as any, 400);

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

  function ensureStrengthWeekPlan(): boolean {
    try {
      setStrengthGroupsError(null);

      const byDay = (planByDay ?? {}) as Record<string, unknown>;
      const strengthDays: WeekdayKey[] = [];

      const pushDay = (raw: unknown) => {
        const k = toWeekdayKey(String(raw ?? ""));
        if (k && !strengthDays.includes(k)) strengthDays.push(k);
      };

      for (const [day, modRaw] of Object.entries(byDay)) {
        const mod = String(modRaw ?? "").toLowerCase();
        if (mod === "musculacao" || mod === "musculação") pushDay(day);
      }

      if (strengthDays.length === 0) return true;

      const selectedGroups = loadSelectedGroups();
      if (!Array.isArray(selectedGroups) || selectedGroups.length === 0) {
        setStrengthGroupsError("Selecione pelo menos 1 grupamento para Musculação antes de gerar sua semana.");
        return false;
      }

      const userLevel = (levelByModality?.["musculacao"] ?? "iniciante") as any;
      const goal = ("hipertrofia" as any);

      const plan = buildStrengthWeekPlan({ strengthDays, selectedGroups, userLevel, goal });
      saveWeekPlan(plan);
      return true;
    } catch(_e) {
      console.warn("[strength] weekPlan ensure failed:", _e);
      return true;
    }
  }

    const handleGerarTreino = () => {
    if (!ensureStrengthWeekPlan()) {
      alert("Selecione pelo menos 1 grupamento para Musculação antes de gerar sua semana.");
      return;
    }

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
    /* MF_PLANNER2_TREINOPLAN_V1 */
    const _rawModalities =
      ((state as any)?.workoutModalities?.length ? (state as any).workoutModalities
        : ((state as any)?.workoutModality ? [(state as any).workoutModality] : []));
    const plannerInput: PlannerInput = {
      level: mfMapLevelToPlanner((state as any)?.workoutLevel ?? (state as any)?.nivelTreino ?? "iniciante"),
      goal: mfMapGoalToPlanner((state as any)?.objetivoTreino ?? (state as any)?.goal ?? "condicionamento"),
      available_days: Array.isArray(daysSelected) ? daysSelected.length : Number((state as any)?.workoutDaysCount ?? 3),
      modalities: mfMapModalitiesToPlanner(_rawModalities),
    };

    const weekly = planWeek(plannerInput);

    const treinoPlan = plannerWeekToTreinoPlan({
      weekly,
      input: plannerInput,
      daysSelectedPT: Array.isArray(daysSelected) && daysSelected.length ? daysSelected : ["Seg","Qua","Sex"],
    });
updateState({ treino: treinoPlan } as any);

    // anexar ao protocolo semanal (fallback p/ telas que leem workoutProtocolWeekly)
    try { (__protocol as any).treinoPlan = treinoPlan; } catch(_e) {}
    
updateState({ workoutProtocolWeekly: __protocol } as any);

    // Preview completo do protocolo (antes de avançar)
    set__mfTreinoPreview(treinoPlan);
    set__mfProtocolPreview(__protocol);
    set__mfGenerated(true);

  };

  const handleContinuar = () => {
    if (!__mfGenerated) return;
    // já gerado e persistido — apenas avança no fluxo
    __onNext();
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

      
      {/* 1.5) Grupamentos musculares (Musculação) */}
      {selectedModalities.includes("musculacao") && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Grupamentos musculares (Musculação)</CardTitle>
            <CardDescription>
              Selecione quais grupamentos você quer priorizar. Isso personaliza a distribuição da semana de musculação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {strengthGroupsError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {strengthGroupsError}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Dica premium: escolha 2–4 grupamentos para um plano mais consistente e inteligente.
              </div>
            )}

            {/* Picker premium (mesmo padrão dos demais) */}
            <div onClick={() => setStrengthGroupsError(null)} className="rounded-xl border bg-background/60 p-3">
              <StrengthMuscleGroupsPicker />
            </div>

            <div className="text-xs text-muted-foreground">
              Obrigatório para gerar o plano de <span className="font-medium">Musculação</span>.
            </div>
          </CardContent>
        </Card>
      )}

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
                        {ex?.series ? (
                          <>
                            {" "}
                            — {ex.series}x{ex?.reps ?? ""}
                          </>
                        ) : null}
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
        <Button type="button" variant="outline" onClick={__onBack} className="gap-2">
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
