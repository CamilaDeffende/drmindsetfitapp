import { useEffect, useMemo, useState } from "react";
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { loadActivePlan } from "@/services/plan.service"
import { FileText, Calendar, Target, UtensilsCrossed, Dumbbell, Activity, ArrowLeft, Clock, TrendingUp } from 'lucide-react'
import { adaptActivePlanNutrition } from "@/services/nutrition/nutrition.adapter";
// DEMO-safe: hidrata Report via localStorage e evita loader infinito
type MFAny = any;

function mfSafeJsonParse(v: string | null): MFAny | null {
  if (!v) return null;
  try { return JSON.parse(v); } catch { return null; }
}

function mfReadFirstProfileFromLS(): MFAny | null {
  const draft = mfSafeJsonParse(localStorage.getItem("mf:onboarding:draft:v1"));
  if (draft) return draft;

  const gp = mfSafeJsonParse(localStorage.getItem("drmindsetfit.globalProfile.v1"));
  if (gp) return gp;

  const st = mfSafeJsonParse(localStorage.getItem("drmindsetfit_state"));
  if (st) return st;

  return null;
}

function mfExtractFafLabel(profile: MFAny | null): string | null {
  if (!profile) return null;
  const cands = [
    profile?.atividadeFisica?.fatorAtividade,
    profile?.atividadeFisica?.nivelAtividade,
    profile?.activityFactor,
    profile?.faf,
    profile?.fatorAtividade,
    profile?.nivelAtividade,
    profile?.globalProfile?.atividadeFisica?.fatorAtividade,
    profile?.globalProfile?.atividadeFisica?.nivelAtividade,
  ].filter(Boolean);

  const raw = (cands[0] ?? null);
  if (!raw) return null;

  const v = String(raw).trim();
  if (/sedent|leve|moder|alta|muito/i.test(v)) return v;

  const num = Number(v.replace(",", "."));
  if (!Number.isFinite(num)) return v;

  if (num < 1.3) return "Sedentário";
  if (num < 1.5) return "Levemente ativo";
  if (num < 1.7) return "Moderadamente ativo";
  if (num < 1.9) return "Muito ativo";
  return "Extremamente ativo";
}
function __mfGetTrainingWorkouts(): any[] {
  try {
    if (typeof window === "undefined") return [];
    const raw = localStorage.getItem("mf:activePlan:v1");
    const ap = raw ? JSON.parse(raw) : null;
    const w = ap?.training?.workouts;
    return Array.isArray(w) ? w : [];
  } catch {
    return [];
  }
}

function mfActivityWeeklyLabel(v: unknown) {
  const x = String(v || "").toLowerCase();
  if (x === "sedentario") return "Sedentário (0x/semana)";
  if (x === "moderadamente_ativo" || x === "moderadamente-ativo") return "Moderadamente ativo (1–3x/semana)";
  if (x === "ativo") return "Ativo (3–5x/semana)";
  if (x === "muito_ativo" || x === "muito-ativo") return "Muito ativo (5x+/semana)";
  return "—";
}

export function Report() {
  const mfProfile = useMemo(() => {
    try { return mfReadFirstProfileFromLS(); } catch { return null; }
  }, []);

  const mfFafLabel = useMemo(() => mfExtractFafLabel(mfProfile), [mfProfile]);

  const [mfForceReady, setMfForceReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setMfForceReady(true), 2800);

      {/* MF_AUDIT_SUMMARY_V1 */}
      {(() => {
        try {
          const a = (state as any)?.planoAtivo?.nutrition?.audit ?? (state as any)?.nutrition?.audit ?? null;
          if (!a) return null;
          const warn = Array.isArray(a?.warnings) ? a.warnings : [];
          return (
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs uppercase tracking-[0.22em] opacity-70">Audit (SSOT)</div>
              <div className="mt-2 text-sm opacity-80">
                versão: <span className="font-semibold text-white">{String(a.version || "")}</span>
                {warn.length ? (
                  <span className="ml-2 opacity-70">• warnings: <span className="font-semibold text-white">{warn.length}</span></span>
                ) : (
                  <span className="ml-2 opacity-70">• sem warnings</span>
                )}
              </div>
            </div>
          );
        } catch {
          return null;
        }
      })()}

    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!mfForceReady) return;
  }, [mfForceReady, mfFafLabel]);
  const __mfReportLogged = (globalThis as any).__mfReportLogged;
  if (!__mfReportLogged) {
    try {
      (globalThis as any).__mfReportLogged = true;
    } catch {}
  }

  function safeRound(n: number | undefined, fallback: number = 0) {
    return Math.round((n ?? fallback));
  }
  function asWorkoutLabel(workout: unknown): string {
    if (!workout || typeof workout !== 'object') return '—';
    const w = workout as Record<string, unknown>;
    const label = w['label'];
    if (typeof label === 'string' && label.trim()) return label;
    const title = w['title'];
    if (typeof title === 'string' && title.trim()) return title;
    return '—';
  }
  function asWorkoutFreq(workout: unknown): string {
    if (!workout || typeof workout !== 'object') return '';
    const w = workout as Record<string, unknown>;
    const f = w['frequencyPerWeek'];
    if (typeof f === 'number' && isFinite(f) && f > 0) return `${f}x/semana`;
    return '';
  }

  const { state } = useDrMindSetfit()
  const navigate = useNavigate()
  const activePlan = loadActivePlan?.() as any;
  const adapted = adaptActivePlanNutrition(activePlan?.nutrition);

  if (!state.concluido) {
    
  // MF_BLOCO6_REPORT_RESOLVER: resolver determinístico (state/perfil) para auditoria premium
  const __mfResolveReportData = () => {
    // tenta pegar "state" de onde o Report já usa (não cria novo store)
    const st: any = (typeof state !== "undefined") ? (state as any) : null;
    const pf: any = st?.perfil ?? st?.profile ?? null;

    const metabolismo: any =
      pf?.metabolismo ??
      pf?.calculoMetabolico ??
      pf?.metabolic ??
      st?.metabolismo ??
      st?.calculoMetabolico ??
      st?.metabolic ??
      null;

    const dieta: any =
      st?.dietaAtiva ??
      pf?.dietaAtiva ??
      pf?.diet ??
      st?.dietPlan ??
      null;

    const macros: any =
      (st?.macros ?? pf?.macros ?? pf?.macroSplit ?? null);

    return { st, pf, metabolismo, dieta, macros };
  };
  const __mfReport = __mfResolveReportData();
  void __mfReport;
  
  // MF_BLOCO7_HEALTHCHECK_V1
  function __mfHealthcheckReport(state: any){
    const perfil = state?.perfil ?? state?.userProfile ?? null;
    const avaliacao = perfil?.avaliacao ?? state?.avaliacao ?? null;
    const metabolismo = (state?.metabolismo ?? perfil?.metabolismo ?? perfil?.calculoMetabolico ?? state?.calculoMetabolico ?? null) as any;
    const dieta = (state?.dietaAtiva ?? state?.dieta ?? perfil?.dieta ?? null) as any;

    const issues: { level: "ok"|"warn"; key: string; msg: string }[] = [];
    const ok = (key: string, msg: string) => issues.push({ level: "ok", key, msg });
    const warn = (key: string, msg: string) => issues.push({ level: "warn", key, msg });

    if (!perfil) warn("perfil", "Perfil não encontrado (estado incompleto)");
    else ok("perfil", "Perfil carregado");

    if (!avaliacao) warn("avaliacao", "Avaliação física ausente. Alguns cálculos podem ficar genéricos");
    else ok("avaliacao", "Avaliação carregada");

    // FAF
    const freq = avaliacao?.frequenciaAtividadeSemanal ?? null;
    if (!freq) warn("faf_freq", "Frequência semanal não informada (FAF padrão aplicado)");
    else ok("faf_freq", "Frequência semanal: " + String(freq));

    // Metabolismo / GET
    if (!metabolismo) warn("metabolismo", "Metabolismo não encontrado no estado. Relatório pode ficar incompleto");
    else {
      ok("metabolismo", "Metabolismo disponível");
      const tmb = Number(metabolismo?.tmb ?? NaN);
      const get = Number(metabolismo?.get ?? metabolismo?.caloriasManutencao ?? NaN);
      const fafFinal = Number(metabolismo?.fafFinal ?? metabolismo?.faf ?? NaN);
      if (Number.isFinite(tmb) && Number.isFinite(get) && Number.isFinite(fafFinal)) {
        const expected = Math.round(tmb * fafFinal);
        const delta = Math.abs(expected - get);
        if (delta > 25) warn("get_consistencia", "GET parece inconsistente (Δ≈" + String(delta) + " kcal)");
        else ok("get_consistencia", "GET consistente com TMB×FAF");
      } else {
        warn("get_consistencia", "Não foi possível auditar GET/TMB/FAF (valores ausentes)");
      }
    }

    // Dieta / macros (se existir)
    const kcal = Number(dieta?.calorias ?? dieta?.kcal ?? NaN);
    const pG = Number(dieta?.proteinas ?? dieta?.proteina ?? NaN);
    const cG = Number(dieta?.carboidratos ?? dieta?.carboidrato ?? NaN);
    const gG = Number(dieta?.gorduras ?? dieta?.gordura ?? NaN);

    if (Number.isFinite(kcal) && Number.isFinite(pG) && Number.isFinite(cG) && Number.isFinite(gG)) {
      const kcalFromMacros = Math.round(pG*4 + cG*4 + gG*9);
      const delta = Math.abs(kcalFromMacros - kcal);
      if (delta > 50) warn("kcal_macros", "Kcal vs macros com diferença (Δ≈" + String(delta) + " kcal)");
      else ok("kcal_macros", "Kcal coerente com macros");
    } else {
      warn("kcal_macros", "Não foi possível auditar macros/kcal (dieta parcial)");
    }

    return { perfil, avaliacao, metabolismo, dieta, issues };
  }

      const __mfHC = __mfHealthcheckReport(state);
  if ((__mfHC as any)?.issues?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
      {/* ActivePlan (source of truth) */}
      {(() => {
  const plan = loadActivePlan();
        if (!plan) return null;
        return (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Plano ativo (resumo)</div>
                <div className="text-xs text-white/60">Gerado no onboarding e salvo localmente</div>
              </div>
              <div className="text-xs text-white/60">
                {plan?.createdAt ? new Date(plan.createdAt).toLocaleString() : ""}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="text-[11px] text-white/60">Metabolismo</div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[12px] text-white/80">
                      Atividade semanal: <b className="text-white">{mfActivityWeeklyLabel(state?.metabolismo?.nivelAtividadeSemanal)}</b>
                    </span>
                  </div>

                <div className="mt-1 text-sm font-semibold">
                  {plan?.metabolic?.tdeeKcal ? `${Math.round(plan.metabolic.tdeeKcal)} kcal/dia` : "—"}
                </div>
                <div className="text-[11px] text-white/60">
                  {plan?.metabolic?.bmrKcal ? `BMR ${Math.round(plan.metabolic.bmrKcal)} kcal` : ""}
                </div>
              </div>

              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="text-[11px] text-white/60">Dieta</div>
                <div className="mt-1 text-sm font-semibold">
                  {plan?.macros?.targetKcal ? `${Math.round(plan.macros?.targetKcal)} kcal` : "—"}
                </div>
                <div className="text-[11px] text-white/60">
                  {plan?.macros
                    ? `P ${safeRound(plan.macros?.proteinG)}g • C ${safeRound(plan.macros?.carbG)}g • G ${safeRound(plan.macros?.fatG)}g`
                    : ""}
                </div>
              </div>

              <div className="rounded-xl bg-white/5 p-3 border border-white/10">
                <div className="text-[11px] text-white/60">Treino</div>
                <div className="mt-1 text-sm font-semibold">
                  {asWorkoutLabel(plan?.workout)}
                </div>
                <div className="text-[11px] text-white/60">
                  {asWorkoutFreq(plan?.workout)}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

        <Card className="w-full max-w-md mx-4 glass-effect neon-border">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-neon mb-4">Complete seu Perfil</h2>
            <p className="text-gray-400 mb-6">Finalize o questionário para ver seu relatório completo</p>
            <Button onClick={() => navigate("/")} className="w-full glow-blue">
              Iniciar Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  const dietaAtiva = (state as any).dietaAtiva ?? (
    adapted?.macros ? {
      estrategia: (activePlan?.nutrition?.strategy ?? activePlan?.nutrition?.estrategia ?? "Plano personalizado"),
      dataInicio: new Date().toISOString(),
      dataFim: new Date(Date.now() + 28*24*60*60*1000).toISOString(),
      duracaoSemanas: 4,
      nutricao: {
        macros: adapted.macros,
        refeicoes: adapted.refeicoes ?? [],
      },
    } : null
  );
  const treinoAtivo = state.treinoAtivo;
  // Calcular dias do plano
  const diasDieta = dietaAtiva ? differenceInDays(new Date(dietaAtiva.dataFim), new Date(dietaAtiva.dataInicio)) : 0
  const diasTreino = treinoAtivo ? differenceInDays(new Date(treinoAtivo.dataFim), new Date(treinoAtivo.dataInicio)) : 0

  const exportarPDF = async () => {
    try {
      const { exportarPDFCompleto } = await import('@/lib/exportar-pdf')
      await exportarPDFCompleto(state, 0, 0, 0)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao gerar PDF. Tente novamente.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-neon">Relatório Completo</h1>
              <p className="text-xs text-gray-400">Seu planejamento detalhado</p>
            </div>
            <Button onClick={exportarPDF} className="glow-blue px-4 py-2 text-sm">
              Exportar PDF
            </Button>
        </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Card de Resumo Geral */}
        <Card className="glass-effect neon-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1E6BFF]" />
              Resumo do Seu Protocolo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-[#1E6BFF]/20 to-[#00B7FF]/10 border border-[#1E6BFF]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-[#1E6BFF]" />
                  <span className="text-sm text-gray-400">Objetivo</span>
                </div>
                <p className="text-lg font-bold text-[#1E6BFF] capitalize">
                  {state.perfil?.objetivo || 'Não definido'}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-400">Duração Dieta</span>
                </div>
                <p className="text-lg font-bold text-green-400">
                  {diasDieta} dias ({Math.floor(diasDieta / 7)} semanas)
                </p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-[#1E6BFF]/20 to-[#00B7FF]/10 border border-[#1E6BFF]/30">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-[#1E6BFF]" />
                  <span className="text-sm text-gray-400">Duração Treino</span>
                </div>
                <p className="text-lg font-bold text-[#1E6BFF]">
                  {diasTreino} dias ({Math.floor(diasTreino / 7)} semanas)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-white/10">
              <div className="text-center">
                <p className="text-xs text-gray-400">Idade</p>
                <p className="text-lg font-bold">{state.perfil?.idade} anos</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Peso Atual</p>
                <p className="text-lg font-bold">{state.perfil?.pesoAtual} kg</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">Altura</p>
                <p className="text-lg font-bold">{state.perfil?.altura} cm</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-400">IMC</p>
                <p className="text-lg font-bold">{state.avaliacao?.imc.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MF_BLOCO7_HEALTHCHECK_UI */}
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">HealthCheck Premium</div>
            <div className="text-xs text-muted-foreground">Auditoria rápida de consistência (sem travar sua experiência).</div>
          </div>
          <div className="text-xs text-muted-foreground">{(__mfHC.issues?.filter((x:any)=>x.level==="warn")?.length ?? 0)} alertas</div>
        </div>
        <div className="mt-3 space-y-1">
          {(__mfHC.issues ?? []).slice(0, 8).map((it:any) => (
            <div key={it.key} className="flex items-start justify-between gap-3 text-xs">
              <span className={it.level === "warn" ? "text-amber-300" : "text-emerald-300"}>{it.level === "warn" ? "• Atenção" : "• OK"}</span>
              <span className="flex-1 text-muted-foreground">{it.msg}</span>
            </div>
          ))}
        </div>
      </div>
        {/* Plano Nutricional Detalhado */}
        {dietaAtiva && (
          <Card className="glass-effect border-green-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-green-400" />
                Plano Nutricional - {diasDieta} Dias
              </CardTitle>
              <p className="text-sm text-gray-400">
                {format(new Date(dietaAtiva.dataInicio), "dd 'de' MMMM", { locale: ptBR })} até{' '}
                {format(new Date(dietaAtiva.dataFim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Macros Diários */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-[#1E6BFF]/10 border border-[#1E6BFF]/30">
                  <p className="text-xs text-gray-400 mb-1">Calorias</p>
                  <p className="text-2xl font-bold text-[#1E6BFF]">{dietaAtiva.nutricao.macros.calorias}</p>
                  <p className="text-xs text-gray-500">kcal/dia</p>
                </div>
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-xs text-gray-400 mb-1">Proteínas</p>
                  <p className="text-2xl font-bold text-red-400">{dietaAtiva.nutricao.macros.proteina}g</p>
                  <p className="text-xs text-gray-500">por dia</p>
                </div>
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-xs text-gray-400 mb-1">Carboidratos</p>
                  <p className="text-2xl font-bold text-yellow-400">{dietaAtiva.nutricao.macros.carboidratos}g</p>
                  <p className="text-xs text-gray-500">por dia</p>
                </div>
                <div className="p-4 rounded-lg bg-[#1E6BFF]/10 border border-[#1E6BFF]/30">
                  <p className="text-xs text-gray-400 mb-1">Gorduras</p>
                  <p className="text-2xl font-bold text-[#1E6BFF]">{dietaAtiva.nutricao.macros.gorduras}g</p>
                  <p className="text-xs text-gray-500">por dia</p>
                </div>
              </div>

              {/* Refeições Diárias */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-green-400" />
                  Refeições do Dia (Repetir por {diasDieta} dias)
                </h3>
                {dietaAtiva.nutricao.refeicoes.map((refeicao: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold capitalize">{refeicao.nome}</h4>
                        <p className="text-xs text-gray-400">{refeicao.horario}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#1E6BFF]">
                          {refeicao.alimentos.reduce((acc: number, a: any) => acc + a.calorias, 0).toFixed(0)} kcal
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {refeicao.alimentos.map((alimento: any, aIdx: number) => (
                        <div key={aIdx} className="flex items-center justify-between text-sm p-2 rounded bg-black/20">
                          <div className="flex-1">
                            <p className="font-medium">{alimento.nome}</p>
                            <p className="text-xs text-gray-500">{alimento.gramas}g</p>
                          </div>
                          <div className="flex gap-4 text-xs">
                            <span className="text-red-400">{alimento.proteinas.toFixed(1)}g P</span>
                            <span className="text-yellow-400">{alimento.carboidratos.toFixed(1)}g C</span>
                            <span className="text-[#1E6BFF]">{alimento.gorduras.toFixed(1)}g G</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={() => navigate('/nutrition')} className="w-full ">
                Editar Minha Dieta
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Plano de Treino Detalhado */}
        {treinoAtivo && (
          <Card className="glass-effect border-[#1E6BFF]/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-[#1E6BFF]" />
                Plano de Treino - {diasTreino} Dias
              </CardTitle>
              <p className="text-sm text-gray-400">
                {format(new Date(treinoAtivo.dataInicio), "dd 'de' MMMM", { locale: ptBR })} até{' '}
                {format(new Date(treinoAtivo.dataFim), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Info do Treino */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-[#1E6BFF]/10 border border-[#1E6BFF]/30">
                  <p className="text-xs text-gray-400 mb-1">Divisão</p>
                  <p className="text-xl font-bold text-[#1E6BFF]">{treinoAtivo.treino.divisao.tipo}</p>
                </div>
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <p className="text-xs text-gray-400 mb-1">Frequência</p>
                  <p className="text-xl font-bold text-green-400">{treinoAtivo.treino.frequencia}x/semana</p>
                </div>
                <div className="p-4 rounded-lg bg-[#1E6BFF]/10 border border-[#1E6BFF]/30">
                  <p className="text-xs text-gray-400 mb-1">Intensidade</p>
                  <p className="text-xl font-bold text-[#1E6BFF] capitalize">{treinoAtivo.treino.divisao.intensidade}</p>
                </div>
              </div>

              {/* Treinos por Dia */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#1E6BFF]" />
                  Treinos Semanais (Ciclo completo por {Math.floor(diasTreino / 7)} semanas)
                </h3>
                {treinoAtivo.treino.treinos.map((treino: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="mb-4">
                      <h4 className="font-semibold text-lg">{treino.dia}</h4>
                      <p className="text-sm text-gray-400">
                        {treino.grupamentos.join(', ')} • Volume: {treino.volumeTotal} séries
                      </p>
                    </div>
                    <div className="space-y-3">
                      {treino.exercicios.map((ex: any, exIdx: number) => (
                        <div key={exIdx} className="p-3 rounded-lg bg-black/30 border border-white/5">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium">{ex.exercicio.nome}</p>
                              <p className="text-xs text-gray-500">{ex.exercicio.grupoMuscular}</p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-bold text-[#1E6BFF]">{ex.series}x{ex.repeticoes}</p>
                              <p className="text-xs text-gray-400">{ex.descanso}s descanso</p>
                            </div>
                          </div>
                          {ex.observacoes && (
                            <p className="text-xs text-gray-400 italic mt-2">{ex.observacoes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={() => navigate('/treino')} className="w-full glow-blue">
                Ir para Treino Ativo
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Metabolismo e Dados Corporais */}
        {state.metabolismo && (
          <Card className="glass-effect border-yellow-500/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                Dados Metabólicos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-xs text-gray-400 mb-1">TMB</p>
                  <p className="text-2xl font-bold text-yellow-400">{state.metabolismo.tmb}</p>
                  <p className="text-xs text-gray-500">kcal/dia</p>
                </div>
                <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/30">
                  <p className="text-xs text-gray-400 mb-1">GET</p>
                  <p className="text-2xl font-bold text-orange-400">{state.metabolismo.get}</p>
                  <p className="text-xs text-gray-500">kcal/dia</p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <p className="text-sm text-gray-400 mb-2">Equação Utilizada</p>
                <p className="font-semibold capitalize">{state.metabolismo.equacaoUtilizada}</p>
                <p className="text-xs text-gray-500 mt-2">{state.metabolismo.justificativa}</p>
                {state.metabolismo.faixaSegura && (
                  <div className="mt-3 text-xs text-gray-300">
                    <div className="text-gray-400 mb-1">Faixa calórica (ingestão)</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="px-2 py-1 rounded bg-white/5 border border-white/10">Mínimo: <b className="text-white">{state.metabolismo.faixaSegura.minimo}</b> kcal</span>
                      <span className="px-2 py-1 rounded bg-white/5 border border-white/10">Ideal: <b className="text-white">{state.metabolismo.faixaSegura.ideal}</b> kcal</span>
                      <span className="px-2 py-1 rounded bg-white/5 border border-white/10">Máximo: <b className="text-white">{state.metabolismo.faixaSegura.maximo}</b> kcal</span>
                    </div>
                    {state?.avaliacao?.biotipo && (
                      <div className="mt-2 text-gray-400">
                        Biotipo: <span className="text-white">{String(state.avaliacao.biotipo)}</span>
                        {state?.metabolismo?.ajusteBiotipoKcal ? (
                          <span className="text-green-400"> • ajuste +{state.metabolismo.ajusteBiotipoKcal} kcal</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão Voltar */}
        <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
          Voltar ao Dashboard
        </Button>
      </main>
    </div>
  )
}

}
        <section style={{ marginTop: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900 }}>Treinos da semana</h2>
            <span style={{ fontSize: 12, opacity: 0.75 }}>SSOT • Agenda</span>
          </div>

          {(() => {
            const __mfReportWorkouts = __mfGetTrainingWorkouts();

            return (!__mfReportWorkouts || __mfReportWorkouts.length === 0) ? (
              <div style={{ marginTop: 10, opacity: 0.85 }}>
                Nenhum treino ativo encontrado no plano atual.
              </div>
            ) : (
              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
                {__mfReportWorkouts.map((w: any, i: number) => (
                  <div key={(w.day||"D") + "-" + (w.modality||"M") + "-" + i} style={{
                    border: "1px solid rgba(255,255,255,0.10)",
                    borderRadius: 14,
                    padding: 12,
                    background: "rgba(255,255,255,0.02)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ fontWeight: 900 }}>{w.day} • {w.modality}</div>
                      <div style={{ fontSize: 12, opacity: 0.8 }}>{w.intensity || "Auto"} • {w.level || "Auto"}</div>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 13, opacity: 0.92 }}>{w.title || "Treino do dia"}</div>
                    {w.focus ? <div style={{ marginTop: 4, fontSize: 12, opacity: 0.75 }}>{w.focus}</div> : null}
                    {w.durationMin ? <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>Duração: {w.durationMin} min</div> : null}
                  </div>
                ))}
              </div>
            );
          })()}
        </section>
