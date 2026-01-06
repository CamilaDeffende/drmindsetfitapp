import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { ArrowLeft, ArrowRight, Activity, Zap, TrendingUp, CheckCircle2 } from 'lucide-react'
import { calcularMetabolismo } from '@/lib/metabolismo'
import type { ResultadoMetabolico } from '@/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function Step3Metabolismo() {
  const { state, updateState, nextStep, prevStep } = useDrMindSetfit()
  const [resultado, setResultado] = useState<ResultadoMetabolico | null>(null)

  useEffect(() => {
    if (state.perfil && state.avaliacao && !state.metabolismo) {
      const calc = calcularMetabolismo(state.perfil, state.avaliacao)
      setResultado(calc)
      updateState({ metabolismo: calc })
    } else if (state.metabolismo) {
      setResultado(state.metabolismo)
    }
  }, [state.perfil, state.avaliacao, state.metabolismo, updateState])

  if (!resultado) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Calculando seu metabolismo...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const nomeEquacoes: Record<string, string> = {
    cunningham: 'Cunningham',
    'fao-who': 'FAO/WHO',
    'harris-benedict': 'Harris-Benedict',
    mifflin: 'Mifflin-St Jeor',
    tinsley: 'Tinsley'
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
          <Activity className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Metabolismo Inteligente</h2>
        <p className="text-muted-foreground">Decisão baseada em ciência, não em achismo</p>
      </div>

      {/* Equação Escolhida */}
      <Alert className="mb-6 border-blue-600 bg-blue-50 dark:bg-blue-950">
        <CheckCircle2 className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-900 dark:text-blue-100 font-bold">
          Equação Selecionada: {nomeEquacoes[resultado.equacaoUtilizada]}
        </AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          {resultado.justificativa}
        </AlertDescription>
      </Alert>

      {/* Resultados Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Taxa Metabólica Basal</CardDescription>
            <CardTitle className="text-3xl font-bold text-blue-600">
              {resultado.tmb}
              <span className="text-lg font-normal text-muted-foreground ml-1">kcal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Energia que seu corpo gasta em repouso</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Gasto Energético Total</CardDescription>
            <CardTitle className="text-3xl font-bold text-purple-600">
              {resultado.get}
              <span className="text-lg font-normal text-muted-foreground ml-1">kcal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Gasto total incluindo atividades</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-600">
          <CardHeader className="pb-3">
            <CardDescription>Calorias Alvo</CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600">
              {resultado.caloriasAlvo}
              <span className="text-lg font-normal text-muted-foreground ml-1">kcal</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Meta diária para seu objetivo</p>
          </CardContent>
        </Card>
      </div>

      {/* Faixa Segura */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Faixa Calórica Segura
          </CardTitle>
          <CardDescription>Zona de operação recomendada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-2">
            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">Mínimo</p>
              <Badge variant="outline" className="text-base">{resultado.faixaSegura.minimo} kcal</Badge>
            </div>
            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">Ideal</p>
              <Badge className="bg-green-600 text-base">{resultado.faixaSegura.ideal} kcal</Badge>
            </div>
            <div className="text-center flex-1">
              <p className="text-sm text-muted-foreground mb-1">Máximo</p>
              <Badge variant="outline" className="text-base">{resultado.faixaSegura.maximo} kcal</Badge>
            </div>
          </div>
          <div className="w-full h-3 bg-gradient-to-r from-yellow-400 via-green-500 to-yellow-400 rounded-full mt-4"></div>
        </CardContent>
      </Card>

      {/* Comparativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Comparativo Entre Equações
          </CardTitle>
          <CardDescription>Todas as fórmulas calculadas para seu perfil</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(resultado.comparativo).map(([key, value]) => {
              const isEscolhida = key === resultado.equacaoUtilizada.replace('-', '')
              return (
                <div key={key} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{nomeEquacoes[key === 'faoWho' ? 'fao-who' : key === 'harrisBenedict' ? 'harris-benedict' : key]}</span>
                    {isEscolhida && (
                      <Badge className="bg-green-600">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Escolhida
                      </Badge>
                    )}
                  </div>
                  <span className="font-bold text-lg">{value} kcal</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Variação de {Math.min(...Object.values(resultado.comparativo))} a {Math.max(...Object.values(resultado.comparativo))} kcal entre os métodos
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" size="lg" onClick={prevStep}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        <Button type="button" size="lg" onClick={nextStep} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
          Próxima Etapa
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
