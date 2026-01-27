import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { sumAlimentosTotals } from "@/engine/nutrition/NutritionEngine";
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, TrendingUp, Clock } from 'lucide-react'
import type { DietaAtiva } from '@/types'
import { calcularSemanaAtual, formatarPeriodo, getMensagemStatus } from '@/lib/planos-ativos-utils'
import { sumMacrosFromRefeicoes, guessPesoKgFromStateLike, validateDietScience } from "@/engine/nutrition/NutritionEngine";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";

interface DietaAtivaViewProps {
  dietaAtiva: DietaAtiva
}

export function DietaAtivaView({ dietaAtiva }: DietaAtivaViewProps) {
  const { state } = useDrMindSetfit();
  const { nutricao, dataInicio, dataFim, duracaoSemanas, estrategia } = dietaAtiva

  // ===== Phase 3C — Resumo do dia + Check científico =====
  const dayTotals = sumMacrosFromRefeicoes(nutricao?.refeicoes ?? []);
  const pesoKg = guessPesoKgFromStateLike(state);
  const kcalTarget = nutricao?.macros?.calorias;
  const science = validateDietScience({ kcalTarget, refeicoes: nutricao?.refeicoes ?? [], tolerancePct: 10 });

  const { semanaAtual, totalSemanas, status, diasRestantes, progressoPorcentagem } =
    calcularSemanaAtual(dataInicio, dataFim, duracaoSemanas)

  const periodoFormatado = formatarPeriodo(dataInicio, dataFim)
  const mensagemStatus = getMensagemStatus(status)

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Período e Progresso */}
      <Card className="glass-effect border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent">
        <CardHeader>
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="text-xl text-green-400 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {estrategia}
            </CardTitle>
            <Badge variant="outline" className="border-green-500/50 text-green-400">
              Semana {semanaAtual} de {totalSemanas}
            </Badge>
          </div>
          <CardDescription className="text-gray-400 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Período: {periodoFormatado}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Progresso do plano</span>
              <span className="text-green-400 font-semibold">{progressoPorcentagem.toFixed(0)}%</span>
            </div>
            <Progress value={progressoPorcentagem} className="h-2 bg-black/40" />
            <div className="flex items-center justify-between text-xs">
              <span className={mensagemStatus.cor}>{mensagemStatus.texto}</span>
              <span className="text-gray-500">{diasRestantes} dias restantes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo dos Macros */}
      <Card className="glass-effect border-green-500/20">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Metas Diárias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl border border-green-500/30">
              <p className="text-xs text-gray-400 mb-1">Calorias</p>
              <p className="text-2xl font-bold text-green-400">{nutricao.macros.calorias}</p>
              <p className="text-xs text-gray-500">kcal</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-[#1E6BFF]/20 to-[#00B7FF]/10 rounded-xl border border-[#1E6BFF]/30">
              <p className="text-xs text-gray-400 mb-1">Proteína</p>
              <p className="text-2xl font-bold text-[#1E6BFF]">{nutricao.macros.proteina}</p>
              <p className="text-xs text-gray-500">gramas</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl border border-yellow-500/30">
              <p className="text-xs text-gray-400 mb-1">Gorduras</p>
              <p className="text-2xl font-bold text-yellow-400">{nutricao.macros.gorduras}</p>
              <p className="text-xs text-gray-500">gramas</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-[#1E6BFF]/20 to-[#00B7FF]/10 rounded-xl border border-[#1E6BFF]/30">
              <p className="text-xs text-gray-400 mb-1">Carboidratos</p>
              <p className="text-2xl font-bold text-[#1E6BFF]">{nutricao.macros.carboidratos}</p>
              <p className="text-xs text-gray-500">gramas</p>
            </div>
          </div>

          {nutricao.restricoes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-sm text-gray-400 mb-2">Restrições ativas:</p>
              <div className="flex flex-wrap gap-2">
                {nutricao.restricoes.map(rest => (
                  <Badge key={rest} variant="outline" className="text-xs border-red-500/50 text-red-400">
                    {rest}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      
      {/* Resumo do dia (Phase 3C) */}
      <Card className="glass-effect border-white/10">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-lg text-gray-100">Resumo do dia</CardTitle>
              <CardDescription className="text-sm text-gray-400">
                Totais consolidados das refeições + consistência do plano
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className={science.ok
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-red-500/15 border-red-500/30 text-red-300"}
            >
              {science.ok ? "Coerente" : "Atenção"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-gray-400 text-xs">Calorias</p>
              <p className="text-gray-100 font-semibold">{dayTotals.calorias} kcal</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-gray-400 text-xs">Proteínas</p>
              <p className="text-gray-100 font-semibold">{dayTotals.proteinas.toFixed(1)} g</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-gray-400 text-xs">Carboidratos</p>
              <p className="text-gray-100 font-semibold">{dayTotals.carboidratos.toFixed(1)} g</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-gray-400 text-xs">Gorduras</p>
              <p className="text-gray-100 font-semibold">{dayTotals.gorduras.toFixed(1)} g</p>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-gray-400">Check científico</p>
            <p className="text-sm text-gray-200 font-medium">{science.message}</p>
            {pesoKg ? (
              <p className="text-xs text-gray-400 mt-2">Peso inferido: {pesoKg.toFixed(1)} kg (para contexto metabólico)</p>
            ) : (
              <p className="text-xs text-gray-500 mt-2">Peso não disponível para contexto metabólico.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Refeições do Dia */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-100">Suas Refeições</h3>
        {nutricao.refeicoes.map((refeicao, index) => {

            const totals = sumAlimentosTotals(refeicao.alimentos);

          return (
            <Card key={index} className="glass-effect border-white/10">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg text-gray-100">{refeicao.nome}</CardTitle>
                    <CardDescription className="text-sm text-gray-400">
                      {refeicao.horario} • {totals.calorias} kcal
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline" className="bg-[#1E6BFF]/20 border-[#1E6BFF]/30 text-[#1E6BFF]">
                      P: {totals.proteinas.toFixed(1)}g
                    </Badge>
                    <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-400">
                      C: {totals.carboidratos.toFixed(1)}g
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400">
                      G: {totals.gorduras.toFixed(1)}g
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {refeicao.alimentos.map((alimento, idx) => (
                    <div
                      key={idx}
                      className="p-3 border border-white/10 rounded-lg bg-black/20"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-100">{alimento.nome}</p>
                          <p className="text-xs text-gray-500 mt-1">{alimento.gramas}g</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-green-400">{alimento.calorias} kcal</p>
                          <p className="text-xs text-gray-500">
                            P: {alimento.proteinas}g • C: {alimento.carboidratos}g • G: {alimento.gorduras}g
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
