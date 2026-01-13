/* eslint-disable react-hooks/rules-of-hooks */
import { useState, useEffect } from 'react'
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Home, Check, ArrowLeft, ArrowRight, Timer, Dumbbell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import ProgressaoCargaHint from '@/components/ProgressaoCargaHint'
import logoUrl from "@/assets/branding/mindsetfit-logo.png";
import { generateMindsetFitPremiumPdf } from "@/lib/pdf/mindsetfitPdf";
import { mindsetfitSignatureLines } from "@/assets/branding/signature";

function buildWorkoutExportText() {
  const lines = [
    "DRMINDSETFIT — TREINO (RELATÓRIO)",
    "",
    "Template: MindSetFit Premium (PDF)",
    "",
    "Conteúdo recomendado:",
    "- Divisão (A/B/C...)",
    "- Exercícios, séries, reps, descanso",
    "- Observações técnicas",
    "- Progressão",
    ""
  ];
  return lines.join("\n");
}

async function downloadPdfPremiumWorkout() {
  await generateMindsetFitPremiumPdf({
    signatureLines: mindsetfitSignatureLines,
logoUrl,
    fileName: "mindsetfit-treino.pdf",
    wordmarkText: "MindSetFit",
    reportLabel: "RELATÓRIO TREINO",
    metaLines: [
      "Módulo: Treino",
      "Template: MindSetFit Premium (PDF)",
    ],
    bodyText: buildWorkoutExportText(),
    layout: {
      logoW: 220,
      logoH: 150,
      logoY: 78,
      wordmarkSize: 38,
      wordmarkGap: 92,
      headerGap: 32,
      margin: 60,
      lineHeight: 13,
      drawFrame: true,
    },
  });
}

interface SerieDados {
  numero: number
  carga: number
  tempoDescanso: number // em segundos
  completa: boolean
}

export function TreinoAtivo() {
  const { state, updateState } = useDrMindSetfit()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [treinoSelecionado, setTreinoSelecionado] = useState(0)
  const [exercicioAtual, setExercicioAtual] = useState(0)
  const [series, setSeries] = useState<SerieDados[]>([])
  const [tempoDecorrido, setTempoDecorrido] = useState(0)
  const [timerAtivo, setTimerAtivo] = useState(false)

  if (!state.treino) {
    
  
  
return (
      <div className="min-h-screen flex items-center justify-center p-4">
{/* PROGRESSAO_CARGA_UI */}
<ProgressaoCargaHint historico={(Array.isArray((state as any)?.treino?.historicoCargas) ? (state as any).treino.historicoCargas : [])}  />

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
  const seriesCompletas = series.filter(s => s.completa).length
  const progressoSeries = Math.round((seriesCompletas / exercicio.series) * 100)

  // Inicializar séries ao mudar de exercício
  useEffect(() => {
    const novasSeries: SerieDados[] = Array.from({ length: exercicio.series }, (_, i) => ({
      numero: i + 1,
      carga: 0,
      tempoDescanso: exercicio.descanso,
      completa: false
    }))
    setSeries(novasSeries)
    setTempoDecorrido(0)
    setTimerAtivo(false)
  }, [exercicioAtual, exercicio.series, exercicio.descanso])

  // Timer de descanso
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerAtivo && tempoDecorrido > 0) {
      interval = setInterval(() => {
        setTempoDecorrido(prev => {
          if (prev <= 1) {
            setTimerAtivo(false)
            toast({
              title: "Descanso concluído!",
              description: "Hora da próxima série",
            })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerAtivo, tempoDecorrido, toast])

  const atualizarSerie = (indice: number, campo: 'carga' | 'tempoDescanso', valor: number) => {
    const novasSeries = [...series]
    novasSeries[indice][campo] = valor
    setSeries(novasSeries)
  }

  const marcarSerieCompleta = (indice: number) => {
    const novasSeries = [...series]
    novasSeries[indice].completa = !novasSeries[indice].completa

    // Se marcou como completa e não é a última série, iniciar timer
    if (novasSeries[indice].completa && indice < series.length - 1) {
      setTempoDecorrido(novasSeries[indice].tempoDescanso)
      setTimerAtivo(true)
    }

    setSeries(novasSeries)

    if (novasSeries[indice].completa) {
      toast({
        title: `Série ${indice + 1} concluída!`,
        description: indice < series.length - 1 ? 'Timer de descanso iniciado' : 'Todas as séries completas!',
      })
    }
  }

  const proximoExercicio = () => {
    if (exercicioAtual < treino.exercicios.length - 1) {
      setExercicioAtual(exercicioAtual + 1)
    } else {
      finalizarTreino()
    }
  }

  const finalizarTreino = () => {
    const dataHoje = new Date().toISOString().split('T')[0]
    const historicoCargas = state.treino?.historicoCargas || []

    // Salvar dados de todas as séries de todos os exercícios
    treino.exercicios.forEach((ex) => {
      // Aqui pegamos os dados reais que o usuário registrou
      const cargaTotal = series.reduce((acc, s) => acc + s.carga, 0)

      if (cargaTotal > 0) {
        historicoCargas.push({
          data: dataHoje,
          exercicioId: ex.exercicio.id,
          exercicioNome: ex.exercicio.nome,
          cargaTotal,
          detalhes: series.map(s => ({
            serie: s.numero,
            carga: s.carga,
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

    toast({
      title: "Treino Concluído!",
      description: "Parabéns pelo esforço! Dados salvos com sucesso.",
    })

    navigate('/dashboard')
  }

  const exercicioAnterior = () => {
    if (exercicioAtual > 0) {
      setExercicioAtual(exercicioAtual - 1)
    }
  }

  const selecionarTreino = (index: number) => {
    setTreinoSelecionado(index)
    setExercicioAtual(0)
  }

  const formatarTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60)
    const secs = segundos % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header Mobile Optimized */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <h1 className="text-lg sm:text-xl font-bold">{treino.dia}</h1>

          <div className="mt-4 flex gap-2 flex-wrap">
            <button type="button" onClick={downloadPdfPremiumWorkout} className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs hover:bg-black/60">Baixar PDF Premium</button>
          </div>

              <p className="text-xs sm:text-sm text-muted-foreground">
                Exercício {exercicioAtual + 1} de {treino.exercicios.length}
              </p>
            </div>
            {timerAtivo && (
              <div className="px-3 py-1 rounded-full bg-[#1E6BFF] text-white font-bold text-sm mr-2">
                <Timer className="w-4 h-4 inline mr-1" />
                {formatarTempo(tempoDecorrido)}
              </div>
            )}
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
              <div className="p-2 sm:p-3 bg-[#1E6BFF] dark:bg-[#1E6BFF] rounded-lg text-center">
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

            {/* Progresso de Séries */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm sm:text-base">Progresso das Séries</Label>
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {seriesCompletas}/{exercicio.series}
                </span>
              </div>
              <Progress value={progressoSeries} className="h-2 mb-3" />
            </div>

            {/* Registro Individual de Séries */}
            <div className="space-y-3">
              <Label className="text-sm sm:text-base font-semibold">Registrar Séries</Label>
              {series.map((serie, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    serie.completa
                      ? 'bg-green-50 dark:bg-green-950 border-green-500'
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-sm">Série {serie.numero}</span>
                    <Button
                      size="sm"
                      variant={serie.completa ? 'default' : 'outline'}
                      onClick={() => marcarSerieCompleta(idx)}
                      className="h-8"
                    >
                      {serie.completa ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Completa
                        </>
                      ) : (
                        'Marcar'
                      )}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor={`carga-${idx}`} className="text-xs flex items-center gap-1">
                        <Dumbbell className="w-3 h-3" />
                        Carga (kg)
                      </Label>
                      <Input
                        id={`carga-${idx}`}
                        type="number"
                        inputMode="decimal"
                        value={serie.carga || ''}
                        onChange={(e) => atualizarSerie(idx, 'carga', Number(e.target.value))}
                        placeholder="Ex: 20"
                        className="text-sm font-semibold text-center"
                        disabled={serie.completa}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor={`descanso-${idx}`} className="text-xs flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        Descanso (s)
                      </Label>
                      <Input
                        id={`descanso-${idx}`}
                        type="number"
                        inputMode="decimal"
                        value={serie.tempoDescanso || ''}
                        onChange={(e) => atualizarSerie(idx, 'tempoDescanso', Number(e.target.value))}
                        placeholder="Ex: 60"
                        className="text-sm font-semibold text-center"
                        disabled={serie.completa}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                  onClick={() => setExercicioAtual(idx)}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    idx === exercicioAtual
                      ? 'bg-[#1E6BFF] dark:bg-[#1E6BFF] border-[#1E6BFF]'
                      : idx < exercicioAtual
                      ? 'bg-green-50 dark:bg-green-950 border-green-600'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{ex.exercicio.nome}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {ex.series}x{ex.repeticoes} • {ex.descanso}s
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
            className="flex-[2] bg-gradient-to-r from-[#1E6BFF] to-[#00B7FF] text-sm sm:text-base"
            onClick={proximoExercicio}
            disabled={seriesCompletas < exercicio.series}
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
