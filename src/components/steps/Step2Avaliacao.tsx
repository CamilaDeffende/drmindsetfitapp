// REGRA_FIXA_NO_HEALTH_CONTEXT_STEP: nunca criar etapa de Segurança/Contexto de saúde/Sinais do corpo.
// PREMIUM_REFINEMENT_PHASE2_1: copy clara, validação explícita, feedback visual, sem sobrecarga cognitiva.
import { GlobalProfilePicker } from "@/features/global-profile/ui/GlobalProfilePicker";
import { useForm } from 'react-hook-form'
import { BrandIcon } from "@/components/branding/BrandIcon";
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { AvaliacaoFisica, MetodoComposicao } from '@/types';
import { useState } from 'react'


type OnboardingStepProps = {
  value?: any;
  onChange?: (v: any) => void;
  onNext?: () => void;
  onBack?: () => void;
};

const avaliacaoSchema = z.object({
  peso: z.coerce.number().min(30).max(300),
  altura: z.coerce.number().min(100).max(250),
  metodoComposicao: z.enum(['bioimpedancia', 'pollock7', 'nenhum']),

  frequenciaAtividadeSemanal: z.enum(['sedentario','moderadamente_ativo','ativo','muito_ativo']),
  biotipo: z.enum(['ectomorfo','mesomorfo','endomorfo']),

  // Circunferências (opcionais)
  cintura: z.coerce.number().optional().or(z.literal('')),
  quadril: z.coerce.number().optional().or(z.literal('')),
  abdomen: z.coerce.number().optional().or(z.literal('')),
  torax: z.coerce.number().optional().or(z.literal('')),
  gluteo: z.coerce.number().optional().or(z.literal('')),

  // Pollock 7 Dobras
  peitoral: z.coerce.number().optional().or(z.literal('')),
  axilarMedia: z.coerce.number().optional().or(z.literal('')),
  triceps: z.coerce.number().optional().or(z.literal('')),
  subescapular: z.coerce.number().optional().or(z.literal('')),
  abdominal: z.coerce.number().optional().or(z.literal('')),
  supraIliaca: z.coerce.number().optional().or(z.literal('')),
  coxa: z.coerce.number().optional().or(z.literal('')),

  // Bioimpedância
  bioPercentualGordura: z.coerce.number().optional().or(z.literal('')),
  bioPercentualMassaMagra: z.coerce.number().optional().or(z.literal('')),
  bioAguaCorporal: z.coerce.number().optional().or(z.literal('')),
  bioIdadeMetabolica: z.coerce.number().optional().or(z.literal(''))
})

type AvaliacaoFormData = z.infer<typeof avaliacaoSchema>

export function Step2Avaliacao({ value, onChange, onNext, onBack }: OnboardingStepProps) {
  void value; void onChange; void onNext; void onBack;
  const { state, updateState, nextStep, prevStep } = useDrMindSetfit()
  const [metodoSelecionado, setMetodoSelecionado] = useState<MetodoComposicao>('nenhum')

  const form = useForm<AvaliacaoFormData>({
    resolver: zodResolver(avaliacaoSchema),
    defaultValues: {
      peso: state.perfil?.pesoAtual || 70,
      altura: state.perfil?.altura || 170,
      metodoComposicao: 'nenhum',
      cintura: '',
      quadril: '',
      abdomen: '',
      torax: '',
      gluteo: '',
      peitoral: '',
      axilarMedia: '',
      triceps: '',
      subescapular: '',
      abdominal: '',
      supraIliaca: '',
      coxa: '',
      bioPercentualGordura: '',
      bioPercentualMassaMagra: '',
      bioAguaCorporal: '',
      bioIdadeMetabolica: ''
    }
  })

  const calcularIMC = (peso: number, altura: number) => {
    return (peso / Math.pow(altura / 100, 2)).toFixed(1)
  }

  const calcularPollock7 = (data: AvaliacaoFormData, sexo: string) => {
    if (!data.peitoral || !data.axilarMedia || !data.triceps || !data.subescapular ||
        !data.abdominal || !data.supraIliaca || !data.coxa) {
      return null
    }

    const somaDobras = Number(data.peitoral) + Number(data.axilarMedia) + Number(data.triceps) +
                       Number(data.subescapular) + Number(data.abdominal) + Number(data.supraIliaca) + Number(data.coxa)

    let densidadeCorporal: number
    let percentualGordura: number = 0
    if (sexo === 'masculino') {
      densidadeCorporal = 1.112 - (0.00043499 * somaDobras) + (0.00000055 * Math.pow(somaDobras, 2)) - (0.00028826 * (state.perfil?.idade || 30))
    } else {
      densidadeCorporal = 1.097 - (0.00046971 * somaDobras) + (0.00000056 * Math.pow(somaDobras, 2)) - (0.00012828 * (state.perfil?.idade || 30))
    }

    percentualGordura = ((4.95 / densidadeCorporal) - 4.5) * 100

    return {
      densidadeCorporal: Number(densidadeCorporal.toFixed(4)),
      percentualGordura: Number(percentualGordura.toFixed(1)),
      percentualMassaMagra: Number((100 - percentualGordura).toFixed(1))
    }
  }

  const onSubmit = (data: AvaliacaoFormData) => {
    const imc = Number(calcularIMC(data.peso, data.altura))

    const avaliacao: AvaliacaoFisica = {
      frequenciaAtividadeSemanal: data.frequenciaAtividadeSemanal,
      peso: data.peso,
      altura: data.altura,
      imc,
      circunferencias: {
        cintura: data.cintura ? Number(data.cintura) : undefined,
        quadril: data.quadril ? Number(data.quadril) : undefined,
        abdomen: data.abdomen ? Number(data.abdomen) : undefined,
        torax: data.torax ? Number(data.torax) : undefined,
        gluteo: data.gluteo ? Number(data.gluteo) : undefined
      },
      composicao: {
        metodo: data.metodoComposicao
      }
    }

    // Processar método de composição corporal
    if (data.metodoComposicao === 'pollock7') {
      const resultado = calcularPollock7(data, state.perfil?.sexo || 'masculino')
      if (resultado) {
        avaliacao.composicao.pollock7 = {
          peitoral: Number(data.peitoral),
          axilarMedia: Number(data.axilarMedia),
          triceps: Number(data.triceps),
          subescapular: Number(data.subescapular),
          abdominal: Number(data.abdominal),
          supraIliaca: Number(data.supraIliaca),
          coxa: Number(data.coxa)
        }
        avaliacao.composicao.densidadeCorporal = resultado.densidadeCorporal
        avaliacao.composicao.percentualGordura = resultado.percentualGordura
        avaliacao.composicao.percentualMassaMagra = resultado.percentualMassaMagra
      }
    } else if (data.metodoComposicao === 'bioimpedancia') {
      if (data.bioPercentualGordura && data.bioPercentualMassaMagra) {
        avaliacao.composicao.bioimpedancia = {
          percentualGordura: Number(data.bioPercentualGordura),
          percentualMassaMagra: Number(data.bioPercentualMassaMagra),
          aguaCorporal: data.bioAguaCorporal ? Number(data.bioAguaCorporal) : 0,
          idadeMetabolica: data.bioIdadeMetabolica ? Number(data.bioIdadeMetabolica) : 0
        }
        avaliacao.composicao.percentualGordura = Number(data.bioPercentualGordura)
        avaliacao.composicao.percentualMassaMagra = Number(data.bioPercentualMassaMagra)
      }
    }

    updateState({ avaliacao })
    nextStep()
  }

  const peso = form.watch('peso')
  const altura = form.watch('altura')

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <GlobalProfilePicker title="Localização, fuso e unidades" />
      </div>
        
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Composição corporal</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Essas medidas ajudam a estimar composição corporal e o padrão de distribuição de gordura.
            Quanto mais fiel o registro, mais preciso fica o seu plano (treino, dieta e metas) nas próximas etapas.
          </p>
        </div>

      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
        <h2 className="text-3xl font-bold mb-2">Calibração corporal</h2>
        <p className="text-muted-foreground">Antropometria + composição (opcional)</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-7">

          
          {/* Atividade semanal + Biotipo */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Atividade física semanal</CardTitle>
                <CardDescription>Esse dado melhora a precisão do GET (gasto energético total diário).</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormField
                  control={form.control}
                  name="frequenciaAtividadeSemanal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qual a sua frequência de atividade física semanal?</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="sedentario">Sedentário</SelectItem>
                          <SelectItem value="moderadamente_ativo">Moderadamente ativo (1 a 3x/semana)</SelectItem>
                          <SelectItem value="ativo">Ativo (3 a 5x/semana)</SelectItem>
                          <SelectItem value="muito_ativo">Muito ativo (+5x/semana)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Autoavaliação de biotipo</CardTitle>
                <CardDescription>Referência prática para individualizar calorias.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormField
                  control={form.control}
                  name="biotipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qual biotipo mais se parece com você?</FormLabel>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                          { key: "ectomorfo", title: "Ectomorfo", desc: "Tende a perder peso com facilidade." },
                          { key: "mesomorfo", title: "Mesomorfo", desc: "Atlético • ganha massa com mais facilidade." },
                          { key: "endomorfo", title: "Endomorfo", desc: "Tende a ganhar/reter peso com facilidade." },
                        ].map((x) => {
                          const active = field.value === x.key;
                          return (
                            <button
                              type="button"
                              key={x.key}
                              onClick={() => field.onChange(x.key)}
                              className={[
                                "text-left rounded-2xl border p-3 transition-all",
                                "bg-white/5 hover:bg-white/10 border-white/10",
                                active ? "ring-2 ring-[#00B7FF] border-[#00B7FF]/40" : "",
                              ].join(" ")}
                            >
                              <div className="font-semibold">{x.title}</div>
                              <div className="text-xs text-muted-foreground leading-relaxed">{x.desc}</div>
                            </button>
                          );
                        })}
                      </div>

                      <FormDescription className="text-xs">
                        Ectomorfo recebe ajuste automático de calorias para manter sustentabilidade do plano.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

{/* Antropometria Básica */}
          <Card>
            <CardHeader>
              <CardTitle>Base antropométrica</CardTitle>
              <CardDescription>Peso e altura para IMC e cálculos metabólicos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="peso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="altura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col justify-between">
                  <FormLabel>IMC</FormLabel>
                  <div className="h-10 flex items-center px-3 bg-muted rounded-md">
                    <span className="text-lg font-bold">{calcularIMC(peso, altura)}</span>
                  </div>
                  <FormDescription className="text-xs mt-1">Indicador geral (não define composição).</FormDescription>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Circunferências */}
          <Card>
            <CardHeader>
              <CardTitle>Circunferências (opcional)</CardTitle>
              <CardDescription>Em cm — ajuda a estimar distribuição e RCQ (quando disponível).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="cintura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cintura</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="-" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quadril"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quadril</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="-" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="abdomen"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Abdômen</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="-" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="torax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tórax</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="-" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gluteo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Glúteo</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" placeholder="-" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Composição Corporal */}
          <Card>
            <CardHeader>
              <CardTitle>Composição Corporal</CardTitle>
              <CardDescription>Use o método que você tem hoje (se não tiver, pode seguir).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="metodoComposicao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método disponível</FormLabel>
                    <Select onValueChange={(value) => {
                      field.onChange(value)
                      setMetodoSelecionado(value as MetodoComposicao)
                    }} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="nenhum">Nenhum método</SelectItem>
                        <SelectItem value="bioimpedancia">Bioimpedância</SelectItem>
                        <SelectItem value="pollock7">Pollock 7 Dobras</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {metodoSelecionado === 'pollock7' && (

          

                <Tabs defaultValue="dobras" className="w-full">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="dobras">7 Dobras Cutâneas (mm)</TabsTrigger>
                  </TabsList>
                  <TabsContent value="dobras" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <FormField control={form.control} name="peitoral" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peitoral</FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="axilarMedia" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Axilar Média</FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="triceps" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tríceps</FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="subescapular" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subescapular</FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="abdominal" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Abdominal</FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="supraIliaca" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supra-ilíaca</FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="coxa" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coxa</FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                        </FormItem>
                      )} />
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              {metodoSelecionado === 'bioimpedancia' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <FormField control={form.control} name="bioPercentualGordura" render={({ field }) => (
                    <FormItem>
                      <FormLabel>% Gordura</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bioPercentualMassaMagra" render={({ field }) => (
                    <FormItem>
                      <FormLabel>% Massa Magra</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bioAguaCorporal" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Água Corporal (%)</FormLabel>
                      <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="bioIdadeMetabolica" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Idade Metabólica</FormLabel>
                      <FormControl><Input type="number" {...field} /></FormControl>
                    </FormItem>
                  )} />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between pt-6">

            {/* BLOCO 5A — Frequência semanal (calibra GET/TDEE) */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">Frequência de atividade física semanal</div>
              <div className="text-xs text-white/60 mt-1">
                Esse dado melhora a precisão do GET (gasto energético total diário).
              </div>

              <div className="mt-4 grid gap-2">
                {[
                  { key: "sedentario", label: "Sedentário" },
                  { key: "moderadamente_ativo", label: "Moderadamente ativo (1–3x/semana)" },
                  { key: "ativo", label: "Ativo (3–5x/semana)" },
                  { key: "muito_ativo", label: "Muito ativo (+5x/semana)" },
                ].map((opt) => {
                  const cur = (state as any)?.metabolismo?.nivelAtividadeSemanal || "moderadamente_ativo";
                  const selected = cur === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() =>
                        updateState({
                          metabolismo: {
                            ...(state as any).metabolismo,
                            nivelAtividadeSemanal: opt.key,
                          },
                        } as any)
                      }
                      className={
                        "w-full text-left rounded-xl px-4 py-3 border transition " +
                        (selected
                          ? "border-[#00B7FF]/60 bg-[#00B7FF]/10"
                          : "border-white/10 bg-white/0 hover:bg-white/5")
                      }
                    >
                      <div className="text-sm font-semibold text-white">{opt.label}</div>
                      <div className="text-[11px] text-white/60 mt-1">
                        {selected ? "Selecionado" : "Toque para selecionar"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>


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
      </Form>
    </div>
  )
}
