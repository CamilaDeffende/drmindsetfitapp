import { Button } from '@/components/ui/button'
import { BrandIcon } from "@/components/branding/BrandIcon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { ArrowLeft, Download, RotateCcw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

export function Step8Relatorio() {
  const { state, prevStep, resetApp } = useDrMindSetfit()

  const gerarRelatorioPDF = () => {
    alert('🚀 Funcionalidade de exportação PDF será implementada em breve! Por enquanto, você pode capturar este relatório visualmente.')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        /* MF_STEP8_PREMIUM_COPY_V1 */
        {/* MF_STEP8_HEADER */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Revisão e geração do relatório</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Agora consolidamos seus dados para gerar um resumo executivo do plano: treino, dieta e recomendações com base no seu perfil,
            avaliação corporal, metabolismo e rotina.
          </p>
        </div>

      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Relatório Final Premium</h2>
        <p className="text-muted-foreground">Seu plano completo de saúde e performance</p>
      </div>

      {/* Perfil */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Perfil do Usuário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div><span className="text-muted-foreground">Nome:</span> <strong>{state.perfil?.nomeCompleto}</strong></div>
            <div><span className="text-muted-foreground">Idade:</span> <strong>{state.perfil?.idade} anos</strong></div>
            <div><span className="text-muted-foreground">Sexo:</span> <strong>{state.perfil?.sexo}</strong></div>
            <div><span className="text-muted-foreground">Altura:</span> <strong>{state.perfil?.altura} cm</strong></div>
            <div><span className="text-muted-foreground">Peso:</span> <strong>{state.perfil?.pesoAtual} kg</strong></div>
            <div><span className="text-muted-foreground">Nível:</span> <Badge>{state.perfil?.nivelTreino}</Badge></div>
            <div><span className="text-muted-foreground">Modalidade:</span> <Badge variant="outline">{state.perfil?.modalidadePrincipal}</Badge></div>
            <div><span className="text-muted-foreground">Objetivo:</span> <Badge className="bg-green-600">{state.perfil?.objetivo}</Badge></div>
          </div>
        </CardContent>
      </Card>

      {/* Avaliação Física */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Avaliação Física</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded">
              <p className="text-sm text-muted-foreground">Peso</p>
              <p className="text-xl font-bold">{state.avaliacao?.peso} kg</p>
            </div>
            <div className="text-center p-3 bg-muted rounded">
              <p className="text-sm text-muted-foreground">Altura</p>
              <p className="text-xl font-bold">{state.avaliacao?.altura} cm</p>
            </div>
            <div className="text-center p-3 bg-muted rounded">
              <p className="text-sm text-muted-foreground">IMC</p>
              <p className="text-xl font-bold">{state.avaliacao?.imc.toFixed(1)}</p>
            </div>
          </div>

          {state.avaliacao?.composicao.percentualGordura && (
            <div className="mt-4 p-4 bg-[#1E6BFF] dark:bg-[#1E6BFF] rounded-lg">
              <h4 className="font-semibold mb-2">Composição Corporal</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">% Gordura:</span>
                  <span className="ml-2 font-bold">{state.avaliacao.composicao.percentualGordura}%</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">% Massa Magra:</span>
                  <span className="ml-2 font-bold">{state.avaliacao.composicao.percentualMassaMagra}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Método: {state.avaliacao.composicao.metodo}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metabolismo */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Metabolismo Calculado</CardTitle>
          <CardDescription>Equação: {state.metabolismo?.equacaoUtilizada}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-[#1E6BFF] dark:bg-[#1E6BFF] rounded">
              <p className="text-sm text-muted-foreground">TMB</p>
              <p className="text-xl font-bold text-[#1E6BFF]">{state.metabolismo?.tmb} kcal</p>
            </div>
            <div className="text-center p-3 bg-[#1E6BFF] dark:bg-[#1E6BFF] rounded">
              <p className="text-sm text-muted-foreground">GET</p>
              <p className="text-xl font-bold text-[#1E6BFF]">{state.metabolismo?.get} kcal</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
              <p className="text-sm text-muted-foreground">Alvo</p>
              <p className="text-xl font-bold text-green-600">{state.metabolismo?.caloriasAlvo} kcal</p>
            </div>
          </div>
          <p className="text-sm text-muted-foreground italic">{state.metabolismo?.justificativa}</p>
        </CardContent>
      </Card>

      {/* Nutrição */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Planejamento Nutricional</CardTitle>
          <CardDescription>Estratégia: {state.nutricao?.estrategia}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-[#1E6BFF] dark:bg-[#1E6BFF] rounded">
              <p className="text-sm text-muted-foreground">Proteína</p>
              <p className="text-xl font-bold text-[#1E6BFF]">{state.nutricao?.macros.proteina}g</p>
            </div>
            <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
              <p className="text-sm text-muted-foreground">Gorduras</p>
              <p className="text-xl font-bold text-yellow-600">{state.nutricao?.macros.gorduras}g</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded">
              <p className="text-sm text-muted-foreground">Carbos</p>
              <p className="text-xl font-bold text-green-600">{state.nutricao?.macros.carboidratos}g</p>
            </div>
          </div>

          {state.nutricao?.restricoes && state.nutricao.restricoes.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Restrições:</p>
              <div className="flex gap-2 flex-wrap">
                {state.nutricao.restricoes.map((r) => (
                  <Badge key={r} variant="outline">{r}</Badge>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          <div className="space-y-3">
            <h4 className="font-semibold">Refeições do Dia ({state.nutricao?.refeicoes.length}x)</h4>
            {state.nutricao?.refeicoes.map((ref, idx) => {
              const totalCalorias = ref.alimentos.reduce((acc, a) => acc + a.calorias, 0)
              return (
                <div key={idx} className="p-3 bg-muted rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <h5 className="font-medium">{ref.nome}</h5>
                    <span className="text-sm text-muted-foreground">{ref.horario}</span>
                  </div>
                  <div className="space-y-1">
                    {ref.alimentos.map((alimento, aIdx) => (
                      <div key={aIdx} className="text-xs sm:text-sm text-muted-foreground">
                        • {alimento.nome} ({alimento.gramas}g) - {alimento.calorias} kcal
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <p className="text-xs font-medium">Total: {totalCalorias} kcal</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Treino */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Planejamento de Treino</CardTitle>
          <CardDescription>
            {state.treino?.divisaoSemanal} • {state.treino?.frequencia}x por semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {state.treino?.treinos.map((dia, idx) => (
              <div key={idx} className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between items-center">
                  <h5 className="font-medium">{dia.dia}</h5>
                  <Badge>{dia.exercicios.length} exercícios</Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {dia.grupamentos.join(' + ')}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Saúde */}
      {state.saude && (state.saude.doresArticulares.length > 0 || state.saude.observacoesClinicas) && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Contexto de Saúde</CardTitle>
          </CardHeader>
          <CardContent>
            {state.saude.doresArticulares.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium mb-2">Dores articulares:</p>
                <div className="flex gap-2 flex-wrap">
                  {state.saude.doresArticulares.map((dor) => (
                    <Badge key={dor} variant="destructive">{dor}</Badge>
                  ))}
                </div>
              </div>
            )}
            {state.saude.observacoesClinicas && (
              <div>
                <p className="text-sm font-medium mb-2">Observações clínicas:</p>
                <p className="text-sm text-muted-foreground">{state.saude.observacoesClinicas}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recomendações Finais */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Recomendações Finais</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Siga o plano alimentar e de treino por 4-6 semanas antes de fazer ajustes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Registre seu progresso semanalmente (peso, medidas, fotos)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Priorize a qualidade do sono (7-9 horas por noite)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Mantenha boa hidratação (35ml/kg de peso corporal)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 font-bold">✓</span>
              <span>Consulte profissionais de saúde antes de mudanças significativas</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Button type="button" variant="outline" size="lg" onClick={prevStep}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>

        <div className="flex gap-2">
          <Button
            type="button"
            size="lg"
            variant="outline"
            onClick={resetApp}
          >
            <RotateCcw className="mr-2 w-4 h-4" />
            Novo Plano
          </Button>

          <Button
            type="button"
            size="lg"
            onClick={gerarRelatorioPDF}
            className="bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0"
          >
            <Download className="mr-2 w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
