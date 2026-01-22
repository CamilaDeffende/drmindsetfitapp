import { useForm } from 'react-hook-form'
import { BrandIcon } from "@/components/branding/BrandIcon";
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { SaudeContexto, DorArticular } from '@/types'

export function Step6Saude() {
  const { updateState, nextStep, prevStep } = useDrMindSetfit()
  const { register, handleSubmit, watch, setValue } = useForm()

  const doresDisponiveis: { value: DorArticular; label: string }[] = [
    { value: 'joelho', label: 'Joelho' },
    { value: 'ombro', label: 'Ombro' },
    { value: 'cotovelo', label: 'Cotovelo' },
    { value: 'punho', label: 'Punho' },
    { value: 'tornozelo', label: 'Tornozelo' },
    { value: 'lombar', label: 'Lombar' },
    { value: 'cervical', label: 'Cervical' }
  ]

  const doresSelecionadas = watch('dores', [])

// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const onSubmit = (data: any) => {
    const saude: SaudeContexto = {
      doresArticulares: data.dores || [],
      limitacoesFisicas: data.limitacoes?.split('\n').filter(Boolean) || [],
      observacoesClinicas: data.observacoes || '',
      historicoLesoes: data.historico || ''
    }

    updateState({ saude })
    nextStep()
  }

  const toggleDor = (dor: DorArticular) => {
    const current = doresSelecionadas || []
    if (current.includes(dor)) {
      setValue('dores', current.filter((d: DorArticular) => d !== dor))
    } else {
      setValue('dores', [...current, dor])
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Segurança, recuperação e contexto</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Aqui você sinaliza o que pode influenciar sua recuperação e evolução. Não é diagnóstico — é calibração.
            Se algo doer, limitar ou exigir cuidado, o plano fica mais seguro e sustentável.
          </p>
        </div>

      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Contexto de saúde</h2>
        <p className="text-muted-foreground">Preferências, limites e histórico — para um plano inteligente e seguro.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-7">
        
<Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Sinais do corpo (opcional)</CardTitle>
            <CardDescription>Se algo incomoda com frequência, marque aqui. Isso ajuda a ajustar estímulos e evitar piora.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {doresDisponiveis.map((dor) => (
                <div
                  key={dor.value}
                  onClick={() => toggleDor(dor.value)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    doresSelecionadas?.includes(dor.value)
                      ? 'border-red-500 bg-red-50 dark:bg-red-950'
                      : 'border-gray-200 dark:border-gray-800'
                  }`}
                >
                  <Checkbox
                    checked={doresSelecionadas?.includes(dor.value)}
                    className="pointer-events-none mb-2"
                  />
                  <p className="font-medium">{dor.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limitações e cuidados</CardTitle>
            <CardDescription>Se existe algo que você evita ou precisa adaptar, escreva em linhas separadas (opcional).</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('limitacoes')}
              placeholder="Ex: Evito corrida por dor no joelho&#10;Limitação acima da cabeça (ombro)&#10;Dor lombar em agachamentos pesados"
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contexto clínico (opcional)</CardTitle>
            <CardDescription>Condições/medicações relevantes que impactam treino, dieta ou recuperação (opcional).</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('observacoes')}
              placeholder="Ex: Hipertensão controlada (medicação)&#10;Acompanhamento médico em andamento&#10;Qualquer observação relevante"
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de lesões (opcional)</CardTitle>
            <CardDescription>Se já teve lesão/cirurgia importante, registre aqui. Uma linha por evento (opcional).</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('historico')}
              placeholder="Ex: Cirurgia no ombro direito (2020)&#10;Entorse de tornozelo (2022)&#10;Tendinite recorrente (local/ano)"
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        <div className="flex justify-between pt-6">
          <Button type="button" variant="outline" size="lg" onClick={prevStep}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Voltar
          </Button>
          <Button type="submit" size="lg" className="bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0">
            Próxima Etapa
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
