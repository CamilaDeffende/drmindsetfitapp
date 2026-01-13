import { useState } from 'react'
import { BrandIcon } from "@/components/branding/BrandIcon";
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { DivisaoTreinoSelector } from '@/components/DivisaoTreinoSelector'
import { gerarTreinoPersonalizado } from '@/utils/geradorTreino'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { DivisaoTreinoConfig, PlanejamentoTreino } from '@/types'

export function Step5Treino() {
  const { state, updateState, nextStep, prevStep } = useDrMindSetfit()
  const [treinoGerado, setTreinoGerado] = useState<PlanejamentoTreino | null>(state.treino || null)
  const [mostrandoSelector, setMostrandoSelector] = useState(!state.treino)

  const handleSelecionarDivisao = (config: DivisaoTreinoConfig) => {
    const treino = gerarTreinoPersonalizado(config, state.perfil)
    setTreinoGerado(treino)
    setMostrandoSelector(false)
  }

  const handleContinuar = () => {
    if (treinoGerado) {
      updateState({ treino: treinoGerado })
      nextStep()
    }
  }

  const handleRefazer = () => {
    setMostrandoSelector(true)
  }

  if (mostrandoSelector) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
          <h2 className="text-3xl font-bold mb-2">Treinamento Inteligente</h2>
          <p className="text-muted-foreground">Configure seu programa personalizado de treino</p>
        </div>

        <DivisaoTreinoSelector onSelect={handleSelecionarDivisao} />

        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" size="lg" onClick={prevStep}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>
        </div>
      </div>
    )
  }

  if (!treinoGerado) return null

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Seu Treino Personalizado</h2>
        <p className="text-muted-foreground">Treino gerado baseado no seu perfil e disponibilidade</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Divisão: {treinoGerado.divisaoSemanal}</CardTitle>
          <CardDescription>
            Modalidade: {treinoGerado.modalidade} • {treinoGerado.frequencia}x por semana •{' '}
            Intensidade: {treinoGerado.divisao.intensidade}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Dias:</span>
            {treinoGerado.divisao.diasSelecionados.map(dia => (
              <Badge key={dia} variant="outline">
                {dia}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {treinoGerado.treinos.map((dia, index) => (
        <Card key={index} className="mb-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {dia.dia}
              <Badge>{dia.volumeTotal} séries</Badge>
            </CardTitle>
            <CardDescription>
              Grupamentos: {dia.grupamentos.join(', ')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dia.exercicios.map((ex, idx) => (
                <div key={idx} className="p-4 border rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold">{ex.exercicio.nome}</h4>
                      <p className="text-sm text-muted-foreground">{ex.exercicio.equipamento}</p>
                    </div>
                    <Badge variant="outline">{ex.exercicio.grupoMuscular}</Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                    <div>
                      <span className="text-muted-foreground">Séries:</span>
                      <span className="ml-1 font-semibold">{ex.series}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reps:</span>
                      <span className="ml-1 font-semibold">{ex.repeticoes}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Descanso:</span>
                      <span className="ml-1 font-semibold">{ex.descanso}s</span>
                    </div>
                  </div>

                  <details className="text-sm">
                    <summary className="cursor-pointer text-[#1E6BFF] hover:underline">
                      Ver substituições
                    </summary>
                    <div className="mt-2 pl-4 border-l-2 border-[#1E6BFF]">
                      <p className="text-muted-foreground">Você pode substituir por:</p>
                      <ul className="list-disc list-inside mt-1">
                        {ex.exercicio.substituicoes.map((sub, i) => (
                          <li key={i}>{sub}</li>
                        ))}
                      </ul>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="mb-4">
        <Button
          onClick={handleRefazer}
          variant="outline"
          className="w-full"
        >
          Refazer Treino com Outra Divisão
        </Button>
      </div>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" size="lg" onClick={prevStep}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        <Button type="button" size="lg" onClick={handleContinuar} className="bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0">
          Próxima Etapa
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
