import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Calendar, TrendingUp, Clock } from 'lucide-react'
import type { DietaAtiva } from '@/types'
import { calcularSemanaAtual, formatarPeriodo, getMensagemStatus } from '@/lib/planos-ativos-utils'

interface DietaAtivaViewProps {
  dietaAtiva: DietaAtiva
}

export function DietaAtivaView({ dietaAtiva }: DietaAtivaViewProps) {
  const { nutricao, dataInicio, dataFim, duracaoSemanas, estrategia } = dietaAtiva

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
            <div className="text-center p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl border border-blue-500/30">
              <p className="text-xs text-gray-400 mb-1">Proteína</p>
              <p className="text-2xl font-bold text-blue-400">{nutricao.macros.proteina}</p>
              <p className="text-xs text-gray-500">gramas</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl border border-yellow-500/30">
              <p className="text-xs text-gray-400 mb-1">Gorduras</p>
              <p className="text-2xl font-bold text-yellow-400">{nutricao.macros.gorduras}</p>
              <p className="text-xs text-gray-500">gramas</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl border border-purple-500/30">
              <p className="text-xs text-gray-400 mb-1">Carboidratos</p>
              <p className="text-2xl font-bold text-purple-400">{nutricao.macros.carboidratos}</p>
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

      {/* Refeições do Dia */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-100">Suas Refeições</h3>
        {nutricao.refeicoes.map((refeicao, index) => {
          const totalCalorias = refeicao.alimentos.reduce((acc, a) => acc + a.calorias, 0)
          const totalProteinas = refeicao.alimentos.reduce((acc, a) => acc + a.proteinas, 0)
          const totalCarbs = refeicao.alimentos.reduce((acc, a) => acc + a.carboidratos, 0)
          const totalGorduras = refeicao.alimentos.reduce((acc, a) => acc + a.gorduras, 0)

          return (
            <Card key={index} className="glass-effect border-white/10">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg text-gray-100">{refeicao.nome}</CardTitle>
                    <CardDescription className="text-sm text-gray-400">
                      {refeicao.horario} • {totalCalorias} kcal
                    </CardDescription>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <Badge variant="outline" className="bg-blue-500/20 border-blue-500/30 text-blue-400">
                      P: {totalProteinas.toFixed(1)}g
                    </Badge>
                    <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-400">
                      C: {totalCarbs.toFixed(1)}g
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400">
                      G: {totalGorduras.toFixed(1)}g
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
