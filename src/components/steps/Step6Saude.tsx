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
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Saúde e Contexto Clínico</h2>
        <p className="text-muted-foreground">Informações importantes para sua segurança</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Dores Articulares</CardTitle>
            <CardDescription>Selecione as regiões com dor ou desconforto</CardDescription>
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
            <CardTitle>Limitações Físicas</CardTitle>
            <CardDescription>Liste qualquer limitação física (opcional)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('limitacoes')}
              placeholder="Ex: Não consigo correr devido a problema no joelho&#10;Dificuldade para levantar peso acima da cabeça"
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observações Clínicas</CardTitle>
            <CardDescription>Informações médicas relevantes (opcional)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('observacoes')}
              placeholder="Ex: Hipertensão controlada, uso de medicamento X"
              className="min-h-[100px] resize-none"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Histórico de Lesões</CardTitle>
            <CardDescription>Lesões anteriores importantes (opcional)</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              {...register('historico')}
              placeholder="Ex: Cirurgia no ombro direito em 2020&#10;Entorse de tornozelo em 2022"
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
