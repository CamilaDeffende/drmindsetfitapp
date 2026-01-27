import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { format, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  FileText,
  Calendar,
  Target,
  UtensilsCrossed,
  Dumbbell,
  Activity,
  ArrowLeft,
  Clock,
  TrendingUp
} from 'lucide-react'
export function Report() {
  const { state } = useDrMindSetfit()
  const navigate = useNavigate()

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
  const dietaAtiva = state.dietaAtiva;
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
                {dietaAtiva.nutricao.refeicoes.map((refeicao, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold capitalize">{refeicao.nome}</h4>
                        <p className="text-xs text-gray-400">{refeicao.horario}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#1E6BFF]">
                          {refeicao.alimentos.reduce((acc, a) => acc + a.calorias, 0).toFixed(0)} kcal
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {refeicao.alimentos.map((alimento, aIdx) => (
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
                {treinoAtivo.treino.treinos.map((treino, idx) => (
                  <div key={idx} className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="mb-4">
                      <h4 className="font-semibold text-lg">{treino.dia}</h4>
                      <p className="text-sm text-gray-400">
                        {treino.grupamentos.join(', ')} • Volume: {treino.volumeTotal} séries
                      </p>
                    </div>
                    <div className="space-y-3">
                      {treino.exercicios.map((ex, exIdx) => (
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
