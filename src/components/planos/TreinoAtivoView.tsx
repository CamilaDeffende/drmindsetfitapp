import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar, TrendingUp, Clock, Dumbbell, Save } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import type { TreinoAtivo, CargaSerie } from '@/types'
import { calcularSemanaAtual, formatarPeriodo, getMensagemStatus } from '@/lib/planos-ativos-utils'
import {
  salvarCargaSerie,
  obterCargasExercicio,
  obterUltimaCarga
} from '@/lib/cargas-storage'

interface TreinoAtivoViewProps {
  treinoAtivo: TreinoAtivo
}

export function TreinoAtivoView({ treinoAtivo }: TreinoAtivoViewProps) {
  const { treino, dataInicio, dataFim, duracaoSemanas, estrategia } = treinoAtivo
  const { toast } = useToast()

  const [cargasTemporarias, setCargasTemporarias] = useState<Record<string, Record<number, string>>>({})
  const [cargasSalvas, setCargasSalvas] = useState<Record<string, Record<number, number>>>({})

  const { semanaAtual, totalSemanas, status, diasRestantes, progressoPorcentagem } =
    calcularSemanaAtual(dataInicio, dataFim, duracaoSemanas)

  const periodoFormatado = formatarPeriodo(dataInicio, dataFim)
  const mensagemStatus = getMensagemStatus(status)

  // Carregar cargas salvas ao montar o componente
  useEffect(() => {
    const cargasCarregadas: Record<string, Record<number, number>> = {}

    treino.treinos.forEach(treinoDia => {
      treinoDia.exercicios.forEach(exercicioTreino => {
        const chaveExercicio = `${treinoDia.dia}-${exercicioTreino.exercicio.id}`
        const cargas = obterCargasExercicio(exercicioTreino.exercicio.id, treinoDia.dia)
        if (Object.keys(cargas).length > 0) {
          cargasCarregadas[chaveExercicio] = cargas
        }
      })
    })

    setCargasSalvas(cargasCarregadas)
  }, [treino])

  const handleCargaChange = (
    treinoDia: string,
    exercicioId: string,
    serie: number,
    valor: string
  ) => {
    const chaveExercicio = `${treinoDia}-${exercicioId}`

    setCargasTemporarias(prev => ({
      ...prev,
      [chaveExercicio]: {
        ...(prev[chaveExercicio] || {}),
        [serie]: valor
      }
    }))
  }

  const salvarCargas = (treinoDia: string, exercicioId: string, totalSeries: number) => {
    const chaveExercicio = `${treinoDia}-${exercicioId}`
    const cargasExercicio = cargasTemporarias[chaveExercicio] || {}

    let algumaSalva = false

    for (let serie = 1; serie <= totalSeries; serie++) {
      const valorStr = cargasExercicio[serie]
      if (valorStr !== undefined && valorStr.trim() !== '') {
        const carga = parseFloat(valorStr)

        if (!isNaN(carga) && carga >= 0) {
          const cargaSerie: CargaSerie = {
            exercicioId,
            dia: treinoDia,
            serie,
            carga,
            data: new Date().toISOString().split('T')[0]
          }

          salvarCargaSerie(cargaSerie)
          algumaSalva = true

          // Atualizar cargas salvas localmente
          setCargasSalvas(prev => ({
            ...prev,
            [chaveExercicio]: {
              ...(prev[chaveExercicio] || {}),
              [serie]: carga
            }
          }))
        }
      }
    }

    if (algumaSalva) {
      // Limpar cargas temporárias
      setCargasTemporarias(prev => {
        const nova = { ...prev }
        delete nova[chaveExercicio]
        return nova
      })

      toast({
        title: 'Cargas salvas!',
        description: 'As cargas foram registradas com sucesso.'
      })
    } else {
      toast({
        title: 'Nenhuma carga para salvar',
        description: 'Preencha ao menos uma carga antes de salvar.',
        variant: 'destructive'
      })
    }
  }

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

      {/* Informações do Treino */}
      <Card className="glass-effect border-green-500/20">
        <CardHeader>
          <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Resumo do Treino
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl border border-green-500/30">
              <p className="text-xs text-gray-400 mb-1">Divisão</p>
              <p className="text-xl font-bold text-green-400">{treino.divisao.tipo}</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl border border-blue-500/30">
              <p className="text-xs text-gray-400 mb-1">Frequência</p>
              <p className="text-xl font-bold text-blue-400">{treino.frequencia}x/semana</p>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl border border-purple-500/30">
              <p className="text-xs text-gray-400 mb-1">Intensidade</p>
              <p className="text-xl font-bold text-purple-400 capitalize">{treino.divisao.intensidade}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Treinos da Semana */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-100">Seus Treinos</h3>
        {treino.treinos.map((treinoDia, indexDia) => (
          <Card key={indexDia} className="glass-effect border-white/10">
            <CardHeader className="pb-3 bg-gradient-to-r from-green-500/10 to-transparent">
              <CardTitle className="text-lg text-gray-100 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-green-400" />
                {treinoDia.dia}
              </CardTitle>
              <CardDescription className="text-sm text-gray-400">
                {treinoDia.grupamentos.join(' • ')} • {treinoDia.exercicios.length} exercícios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {treinoDia.exercicios.map((exercicioTreino, indexEx) => {
                  const chaveExercicio = `${treinoDia.dia}-${exercicioTreino.exercicio.id}`
                  const cargasExercicio = cargasTemporarias[chaveExercicio] || {}
                  const cargasSalvasExercicio = cargasSalvas[chaveExercicio] || {}
                  const ultimaCarga = obterUltimaCarga(exercicioTreino.exercicio.id)

                  return (
                    <div
                      key={indexEx}
                      className="p-4 border border-white/10 rounded-xl bg-black/20 space-y-4"
                    >
                      {/* Cabeçalho do Exercício */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-100">{exercicioTreino.exercicio.nome}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {exercicioTreino.series} séries • {exercicioTreino.repeticoes} reps • {exercicioTreino.descanso}s descanso
                          </p>
                          {ultimaCarga && (
                            <p className="text-xs text-green-400 mt-1">
                              Última carga: {ultimaCarga} kg
                            </p>
                          )}
                        </div>
                        <Badge variant="outline" className="border-green-500/50 text-green-400">
                          {exercicioTreino.exercicio.grupoMuscular}
                        </Badge>
                      </div>

                      {/* Campos de Carga por Série */}
                      <div className="space-y-3">
                        <Label className="text-sm text-gray-400">Carga por série (kg)</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {Array.from({ length: exercicioTreino.series }, (_, i) => {
                            const serie = i + 1
                            const cargaSalva = cargasSalvasExercicio[serie]
                            const cargaTemporaria = cargasExercicio[serie]

                            return (
                              <div key={serie} className="space-y-1">
                                <Label htmlFor={`carga-${chaveExercicio}-${serie}`} className="text-xs text-gray-500">
                                  Série {serie}
                                </Label>
                                <Input
                                  id={`carga-${chaveExercicio}-${serie}`}
                                  type="number"
                                  step="0.5"
                                  min="0"
                                  placeholder={cargaSalva ? `${cargaSalva}` : '0'}
                                  value={cargaTemporaria || ''}
                                  onChange={(e) =>
                                    handleCargaChange(
                                      treinoDia.dia,
                                      exercicioTreino.exercicio.id,
                                      serie,
                                      e.target.value
                                    )
                                  }
                                  className="h-9 text-center bg-black/40 border-green-500/30 focus:border-green-500"
                                />
                                {cargaSalva && !cargaTemporaria && (
                                  <p className="text-xs text-green-400 text-center">{cargaSalva} kg</p>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {/* Botão Salvar Cargas */}
                      <Button
                        onClick={() =>
                          salvarCargas(treinoDia.dia, exercicioTreino.exercicio.id, exercicioTreino.series)
                        }
                        className="w-full sm:w-auto bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/50"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Cargas
                      </Button>

                      {/* Observações (se houver) */}
                      {exercicioTreino.observacoes && (
                        <p className="text-xs text-gray-500 italic border-l-2 border-green-500/30 pl-3">
                          {exercicioTreino.observacoes}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
