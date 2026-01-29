// REGRA_FIXA_NO_HEALTH_CONTEXT_STEP: nunca criar etapa de Segurança/Contexto de saúde/Sinais do corpo.
// PREMIUM_REFINEMENT_PHASE2_1: copy clara, validação explícita, feedback visual, sem sobrecarga cognitiva.
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { ArrowRight } from "lucide-react";import type { PerfilUsuario } from '@/types'
import { BrandIcon } from "@/components/branding/BrandIcon";
import { saveOnboardingProgress } from "@/lib/onboardingProgress";


type OnboardingStepProps = {
  value?: any;
  onChange?: (v: any) => void;
  onNext?: () => void;
  onBack?: () => void;
};

const perfilSchema = z.object({
  nomeCompleto: z.string().min(3, 'Nome completo é obrigatório'),
  sexo: z.enum(['masculino', 'feminino']),
  idade: z.coerce.number().min(10, 'Idade mínima: 10 anos').max(120, 'Idade máxima: 120 anos'),
  altura: z.coerce.number().min(100, 'Altura mínima: 100cm').max(250, 'Altura máxima: 250cm'),
  pesoAtual: z.coerce.number().min(30, 'Peso mínimo: 30kg').max(300, 'Peso máximo: 300kg'),
  historicoPeso: z.string().optional(),
  nivelTreino: z.enum(['sedentario', 'iniciante', 'intermediario', 'avancado', 'atleta']),
  modalidadePrincipal: z.enum(['musculacao','funcional','corrida','crossfit','spinning']),
  frequenciaSemanal: z.coerce.number().min(1, 'Mínimo 1 vez').max(7, 'Máximo 7 vezes'),
  duracaoTreino: z.coerce.number().min(15, 'Mínimo 15 min').max(240, 'Máximo 240 min'),
  objetivo: z.enum(['emagrecimento', 'reposicao', 'hipertrofia', 'performance', 'longevidade'])
})

export function Step1Perfil({ value, onChange, onNext, onBack }: OnboardingStepProps) {
  
  // BLOCK2A: UNLOCK Step1 -> Step2 (persist progress + draft + goNext)
  const __goNextSafe = (data: PerfilUsuario) => {
    try { saveOnboardingProgress({ step: 2, data: { step1: data } }); } catch {}
    try { if (typeof onChange === "function") onChange(data); } catch {}
    try { if (typeof onNext === "function") onNext(); } catch {}
  };
void value; void onChange; void onNext; void onBack;
  const { state, updateState, nextStep } = useDrMindSetfit()

  const form = useForm<PerfilUsuario>({
    resolver: (zodResolver(perfilSchema) as any),
    defaultValues: {
      nomeCompleto: state.perfil?.nomeCompleto || '',
      sexo: state.perfil?.sexo || 'masculino',
      idade: state.perfil?.idade || 30,
      altura: state.perfil?.altura || 170,
      pesoAtual: state.perfil?.pesoAtual || 70,
      historicoPeso: state.perfil?.historicoPeso || '',
      nivelTreino: state.perfil?.nivelTreino || 'iniciante',
      modalidadePrincipal: (state.perfil?.modalidadePrincipal || "musculacao"),
      frequenciaSemanal: state.perfil?.frequenciaSemanal || 3,
      duracaoTreino: state.perfil?.duracaoTreino || 60,
      objetivo: state.perfil?.objetivo || 'hipertrofia'
    }
  })

  const onSubmit = (data: PerfilUsuario) => {
    updateState({ perfil: data })
    nextStep()
    // avanço oficial do funil (OnboardingFlow)
    __goNextSafe(data);

  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
        
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Base do seu plano</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Esses dados calibram as estimativas iniciais (metabolismo, gasto diário e distribuição de macros).
            Preencha o essencial com precisão — isso aumenta a qualidade do treino, da dieta e do relatório final.
          </p>
        </div>

      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Vamos calibrar seu protocolo</h2>
        <p className="text-muted-foreground">Leva ~2 minutos. Quanto mais fiel, mais assertivo o seu plano.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados para calibração</CardTitle>
          <CardDescription>Usamos isso para estimar metabolismo, definir metas e personalizar treino + nutrição nas próximas etapas.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-7">
              {/* Dados Pessoais Essenciais */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Essenciais</h3>

                <FormField
                  control={form.control}
                  name="nomeCompleto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sexo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sexo biológico (para cálculos)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="masculino">Masculino</SelectItem>
                            <SelectItem value="feminino">Feminino</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="idade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Idade (anos)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="30" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="altura"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Altura (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="170" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pesoAtual"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Peso Atual (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="70" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="historicoPeso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Histórico de peso (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Já pesei 90kg, emagreci para 75kg em 2020..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Perfil Físico e Esportivo */}
              

              {/* Objetivo */}
              <div className="space-y-4 pt-6 border-t">
                <h3 className="font-semibold text-lg">Direção do plano</h3>

                <FormField
                  control={form.control}
                  name="objetivo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qual resultado você quer priorizar agora?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="emagrecimento">Emagrecimento</SelectItem>
                          <SelectItem value="reposicao">Recomposição Corporal</SelectItem>
                          <SelectItem value="hipertrofia">Hipertrofia</SelectItem>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="longevidade">Saúde / Longevidade</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-6">
                <Button type="submit" size="lg" className="bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0">
                  Próxima Etapa
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
