import { useEffect, useState } from 'react'
import { BrandIcon } from "@/components/branding/BrandIcon";
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { ArrowLeft, ArrowRight, Zap, TrendingUp, CheckCircle2 } from 'lucide-react'
import { calcularMetabolismo } from '@/lib/metabolismo'
import type { ResultadoMetabolico } from '@/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function Step3Metabolismo() {
  const { state, updateState, nextStep, prevStep } = useDrMindSetfit()

  // Preview objetivo do treino (pós-metabolismo)
  const __mfTreinoAtivo: any = (state as any)?.treinoAtivo;
  const __mfSessions: any[] = Array.isArray(__mfTreinoAtivo?.sessions) ? __mfTreinoAtivo.sessions : [];
  const __mfModalities: any[] = Array.isArray(__mfTreinoAtivo?.modalities) ? __mfTreinoAtivo.modalities : [];
  const __mfTreinoPreview = __mfSessions.length ? (
    <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Treino gerado para você</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Prévia objetiva da sua semana. O plano respeita seu nível e suas modalidades selecionadas.
          </p>
        </div>
        <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-muted-foreground">
          {(__mfModalities.length || 1)} modalidade(s)
        </span>
      </div>

      <div className="mt-4 grid gap-2">
        {__mfSessions.slice(0, 7).map((x, i) => (
          <div key={x?.day ?? i} className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 flex items-center justify-between">
            <div className="text-sm font-semibold">{String(x?.day ?? "Dia")}</div>
            <div className="text-xs text-muted-foreground">{String(x?.title ?? x?.modalityKey ?? "")}</div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground">
        Você pode ajustar detalhes do treino nas próximas etapas, se necessário.
      </div>
    </div>
  ) : null;

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
{/* PREMIUM_TREINO_PREVIEW_V1 */}
<Card className="mt-4 border-white/10 bg-white/5">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between gap-3">
      <div>
        <CardTitle className="text-base sm:text-lg">Prévia do seu treino</CardTitle>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Um resumo objetivo do protocolo semanal, baseado no seu metabolismo e perfil.
        </p>
      </div>
      <Badge variant="secondary" className="border-white/10 bg-black/20">inteligente</Badge>
    </div>
  </CardHeader>
  <CardContent className="pt-0">
    <div className="text-sm text-muted-foreground">
      Conclua as próximas etapas para gerar o protocolo completo com dias, modalidades e progressão.
    </div>
  </CardContent>
</Card>

      {__mfTreinoPreview}

        
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Metabolismo e gasto diário</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Aqui estimamos seu gasto energético (TMB e gasto total diário) usando seus dados e rotina.
            Isso define a base de calorias e macros do plano, tornando as próximas recomendações mais consistentes.
          </p>
        </div>

        <Card>
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1E6BFF] mx-auto mb-4"></div>
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
        <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Metabolismo Inteligente</h2>
        <p className="text-muted-foreground">Decisão baseada em ciência, não em achismo</p>
      </div>

      {/* Equação Escolhida */}
      <Alert className="mb-6 border-[#1E6BFF] bg-[#1E6BFF] dark:bg-[#1E6BFF]">
        <CheckCircle2 className="h-5 w-5 text-[#1E6BFF]" />
        <AlertTitle className="text-[#1E6BFF] dark:text-[#1E6BFF] font-bold">
          Equação Selecionada: {nomeEquacoes[resultado.equacaoUtilizada]}
        </AlertTitle>
        <AlertDescription className="text-[#1E6BFF] dark:text-[#1E6BFF]">
          {resultado.justificativa}
        </AlertDescription>
      </Alert>

      {/* Resultados Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Taxa Metabólica Basal</CardDescription>
            <CardTitle className="text-3xl font-bold text-[#1E6BFF]">
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
            <CardTitle className="text-3xl font-bold text-[#1E6BFF]">
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
          <div className="w-full h-3 bg-gradient-to-r from-yellow-400 via-green-500 to-yellow-400 rounded-full mt-4 hover:from-[#1E6BFF] hover:via-[#00B7FF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0"></div>
        </CardContent>
      </Card>

      {/* Comparativo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#1E6BFF]" />
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
        <Button type="button" size="lg" onClick={nextStep} className="bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0">
          Próxima Etapa
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
