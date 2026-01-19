import { Button } from '@/components/ui/button'
import { BrandIcon } from "@/components/branding/BrandIcon";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react'
export function Step7Acompanhamento() {
  const { state, nextStep, prevStep } = useDrMindSetfit()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Acompanhamento e consistência</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Nesta etapa alinhamos a frequência de ajustes e o ritmo de evolução. A consistência do acompanhamento influencia aderência,
            tomada de decisão e expectativas realistas de resultado ao longo das semanas.
          </p>
        </div>

      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Acompanhamento e Evolução</h2>
        <p className="text-muted-foreground">Monitore seu progresso ao longo do tempo</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Sistema de Acompanhamento
          </CardTitle>
          <CardDescription>
            Como você vai acompanhar sua evolução
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-[#1E6BFF] dark:bg-[#1E6BFF] rounded-lg">
            <h4 className="font-semibold mb-2">📊 Registre suas medidas regularmente</h4>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>Peso corporal: semanalmente</li>
              <li>Circunferências: a cada 2-4 semanas</li>
              <li>Fotos de progresso: mensalmente</li>
            </ul>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h4 className="font-semibold mb-2">💪 Acompanhe sua performance no treino</h4>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>Anote as cargas utilizadas</li>
              <li>Registre sensações de treino</li>
              <li>Observe progressões de força</li>
            </ul>
          </div>

          <div className="p-4 bg-[#1E6BFF] dark:bg-[#1E6BFF] rounded-lg">
            <h4 className="font-semibold mb-2">🎯 Sinais de ajuste necessário</h4>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>Peso estagnado por mais de 3 semanas</li>
              <li>Queda de performance no treino</li>
              <li>Fadiga excessiva ou sono ruim</li>
              <li>Fome extrema ou falta de energia</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <h4 className="font-semibold mb-2">⚡ Quando ajustar o plano</h4>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>A cada 4-6 semanas para progressão</li>
              <li>Se mudanças no peso excederem 1kg/semana</li>
              <li>Ao atingir 8-10% de mudança no peso corporal</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados Atuais para Comparação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Peso</p>
              <p className="text-2xl font-bold">{state.avaliacao?.peso}kg</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">IMC</p>
              <p className="text-2xl font-bold">{state.avaliacao?.imc.toFixed(1)}</p>
            </div>
            {state.avaliacao?.composicao.percentualGordura && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">% Gordura</p>
                <p className="text-2xl font-bold">{state.avaliacao.composicao.percentualGordura}%</p>
              </div>
            )}
            {state.avaliacao?.composicao.percentualMassaMagra && (
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">% Magra</p>
                <p className="text-2xl font-bold">{state.avaliacao.composicao.percentualMassaMagra}%</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button type="button" variant="outline" size="lg" onClick={prevStep}>
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        <Button type="button" size="lg" onClick={nextStep} className="bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0">
          Gerar Relatório Final
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
