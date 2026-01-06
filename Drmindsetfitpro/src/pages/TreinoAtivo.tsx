import { useState } from 'react'
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Home, Check, ArrowLeft, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Progress } from '@/components/ui/progress'

export function TreinoAtivo() {
  const { state, updateState } = useDrMindSetfit()
  const navigate = useNavigate()
  const [treinoSelecionado, setTreinoSelecionado] = useState(0)
  const [exercicioAtual, setExercicioAtual] = useState(0)
  const [seriesCompletas, setSeriesCompletas] = useState<number[]>([])
  const [cargas, setCargas] = useState<Record<string, number>>({}) // Por exercício

  if (!state.treino) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Nenhum Treino Configurado</CardTitle>
            <CardDescription>Configure seu treino antes de iniciar</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const treino = state.treino.treinos[treinoSelecionado]
  const exercicio = treino.exercicios[exercicioAtual]
  const progressoTreino = Math.round(((exercicioAtual + 1) / treino.exercicios.length) * 100)
  const progressoSeries = Math.round((seriesCompletas.length / exercicio.series) * 100)

  const marcarSerieCompleta = (serie: number) => {
    if (!seriesCompletas.includes(serie)) {
      setSeriesCompletas([...seriesCompletas, serie])
    } else {
      setSeriesCompletas(seriesCompletas.filter(s => s !== serie))
    }
  }

  const proximoExercicio = () => {
    if (exercicioAtual < treino.exercicios.length - 1) {
      setExercicioAtual(exercicioAtual + 1)
      setSeriesCompletas([])
    } else {
      // Salvar histórico de cargas
      const dataHoje = new Date().toISOString().split('T')[0]
      const historicoCargas = state.treino?.historicoCargas || []

      // Adicionar registro de carga para cada exercício do treino
      treino.exercicios.forEach(ex => {
        const cargaExercicio = cargas[ex.exercicio.id] || 0
        if (cargaExercicio > 0) {
          historicoCargas.push({
            data: dataHoje,
            exercicioId: ex.exercicio.id,
            exercicioNome: ex.exercicio.nome,
            cargaTotal: cargaExercicio * ex.series,
            detalhes: Array.from({ length: ex.series }, (_, i) => ({
              serie: i + 1,
              carga: cargaExercicio,
              repeticoes: parseInt(ex.repeticoes) || 10
            }))
          })
        }
      })

      updateState({
        treino: {
          ...state.treino!,
          historicoCargas
        }
      })

      alert('🎉 Treino concluído! Parabéns pelo esforço!')
      navigate('/dashboard')
    }
  }

  const exercicioAnterior = () => {
    if (exercicioAtual > 0) {
      setExercicioAtual(exercicioAtual - 1)
      setSeriesCompletas([])
    }
  }

  const selecionarTreino = (index: number) => {
    setTreinoSelecionado(index)
    setExercicioAtual(0)
    setSeriesCompletas([])
    setCargas({})
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header Mobile Optimized */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-bold">{treino.dia}</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Exercício {exercicioAtual + 1} de {treino.exercicios.length}
              </p>
            </div>
            <Button variant="outline" size="icon" onClick={() => navigate('/dashboard')} className="shrink-0">
              <Home className="w-4 h-4" />
            </Button>
          </div>
          <Progress value={progressoTreino} className="h-2" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-24">
        {/* Seletor de Treino - Mobile Optimized */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Selecione o Treino</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {state.treino.treinos.map((t, idx) => (
                <Button
                  key={idx}
                  variant={treinoSelecionado === idx ? 'default' : 'outline'}
                  onClick={() => selecionarTreino(idx)}
                  className="h-auto py-2 sm:py-3 flex-col text-xs sm:text-sm"
                >
                  <span className="font-semibold">{t.dia}</span>
                  <span className="text-xs opacity-80 truncate max-w-full">{t.grupamentos.join(', ')}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exercício Atual - Mobile Optimized */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex-1">
                <CardTitle className="text-lg sm:text-xl">{exercicio.exercicio.nome}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{exercicio.exercicio.equipamento}</CardDescription>
              </div>
              <Badge variant="outline" className="self-start sm:self-auto text-xs">
                {exercicio.exercicio.grupoMuscular}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Info Cards - Mobile Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Séries</p>
                <p className="text-xl sm:text-2xl font-bold">{exercicio.series}</p>
              </div>
              <div className="p-2 sm:p-3 bg-green-50 dark:bg-green-950 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Reps</p>
                <p className="text-xl sm:text-2xl font-bold">{exercicio.repeticoes}</p>
              </div>
              <div className="p-2 sm:p-3 bg-purple-50 dark:bg-purple-950 rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Descanso</p>
                <p className="text-xl sm:text-2xl font-bold">{exercicio.descanso}s</p>
              </div>
            </div>

            {/* Campo de Carga - Mobile Optimized */}
            <div className="space-y-2">
              <Label htmlFor="carga" className="text-sm sm:text-base">
                Carga Utilizada (kg)
              </Label>
              <Input
                id="carga"
                type="number"
                inputMode="decimal"
                value={cargas[exercicio.exercicio.id] || ''}
                onChange={(e) => setCargas({ ...cargas, [exercicio.exercicio.id]: Number(e.target.value) })}
                placeholder="Ex: 20"
                className="text-base sm:text-lg font-semibold text-center"
              />
              <p className="text-xs text-muted-foreground text-center">
                Registre a carga para acompanhar sua evolução
              </p>
            </div>

            {/* Progresso de Séries */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm sm:text-base">Séries Completas</Label>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {seriesCompletas.length}/{exercicio.series}
                </span>
              </div>
              <Progress value={progressoSeries} className="h-2 mb-3" />

              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {Array.from({ length: exercicio.series }, (_, i) => (
                  <Button
                    key={i}
                    variant={seriesCompletas.includes(i) ? 'default' : 'outline'}
                    onClick={() => marcarSerieCompleta(i)}
                    className="h-14 sm:h-16 text-base sm:text-lg font-bold"
                  >
                    {seriesCompletas.includes(i) ? (
                      <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Descrição do Exercício */}
            {exercicio.exercicio.descricao && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs sm:text-sm text-muted-foreground">{exercicio.exercicio.descricao}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Exercícios - Mobile Optimized */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Exercícios do Treino</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {treino.exercicios.map((ex, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setExercicioAtual(idx)
                    setSeriesCompletas([])
                  }}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    idx === exercicioAtual
                      ? 'bg-blue-50 dark:bg-blue-950 border-blue-600'
                      : idx < exercicioAtual
                      ? 'bg-green-50 dark:bg-green-950 border-green-600'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{ex.exercicio.nome}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {ex.series}x{ex.repeticoes} • {cargas[ex.exercicio.id] ? `${cargas[ex.exercicio.id]}kg` : 'Sem carga'}
                      </p>
                    </div>
                    <div className="ml-2 shrink-0">
                      {idx < exercicioAtual ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : idx === exercicioAtual ? (
                        <Badge variant="default" className="text-xs">Atual</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">{idx + 1}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Botões de Navegação - Fixed Bottom on Mobile */}
      <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-t">
        <div className="max-w-3xl mx-auto flex gap-2 sm:gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={exercicioAnterior}
            disabled={exercicioAtual === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
          <Button
            className="flex-[2] bg-gradient-to-r from-blue-600 to-purple-600 text-sm sm:text-base"
            onClick={proximoExercicio}
            disabled={seriesCompletas.length < exercicio.series}
          >
            {exercicioAtual < treino.exercicios.length - 1 ? (
              <>
                Próximo Exercício
                <ArrowRight className="w-4 h-4 ml-1 sm:ml-2" />
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1 sm:mr-2" />
                Finalizar Treino
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
