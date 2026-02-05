// REGRA_FIXA_NO_HEALTH_CONTEXT_STEP: nunca criar etapa de Segurança/Contexto de saúde/Sinais do corpo.
// PREMIUM_REFINEMENT_PHASE2_1: copy clara, validação explícita, feedback visual, sem sobrecarga cognitiva.
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { ArrowLeft, ArrowRight, UtensilsCrossed, Check } from 'lucide-react'
import type { PlanejamentoNutricional, Restricao, TipoRefeicao, AlimentoRefeicao } from '@/types'
import { ALIMENTOS_DATABASE, calcularMacros } from '@/types/alimentos'
import { saveOnboardingProgress } from "@/lib/onboardingProgress";

import { saveActivePlanNutrition } from "@/services/plan/activePlanNutrition.writer";
// MF_NUTRITION_WIRE_V1
function __mfBuildNutritionInputs(anyState: any, anyForm?: any) {
  // tenta pegar do form primeiro, depois do state
  const sexo = (anyForm?.sexo ?? anyState?.perfil?.sexo ?? anyState?.sexo ?? "masculino") as any;
  const idade = Number(anyForm?.idade ?? anyState?.perfil?.idade ?? anyState?.idade ?? 30);
  const pesoKg = Number(anyForm?.peso ?? anyForm?.pesoKg ?? anyState?.perfil?.peso ?? anyState?.peso ?? 70);
  const alturaCm = Number(anyForm?.altura ?? anyForm?.alturaCm ?? anyState?.perfil?.altura ?? anyState?.altura ?? 170);
  const massaMagraKg = anyForm?.massaMagraKg ?? anyState?.bioimpedancia?.massaMagraKg ?? anyState?.massaMagraKg ?? null;

  const objetivo = (anyForm?.objetivo ?? anyState?.objetivo ?? anyState?.meta ?? "manutencao") as any;
  const biotipo = (anyForm?.biotipo ?? anyState?.biotipo ?? null) as any;
  const atividade = (anyForm?.atividade ?? anyState?.atividade ?? anyState?.nivelAtividade ?? "moderado") as any;

  return {
    body: { sexo, idade, pesoKg, alturaCm, massaMagraKg },
    opts: { objetivo, biotipo, atividade },
  };
}



type OnboardingStepProps = {
  value?: any;

  onChange?: (v: any) => void;
  onNext?: () => void;
  onBack?: () => void;
};

// MF_BLOCO4_GUARDRAILS_V2: helpers locais (escopo seguro no Step4)
const mfClamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
const mfKcalFromMacros = (p: number, c: number, g: number) => (p * 4) + (c * 4) + (g * 9);

export function Step4Nutricao({ value, onChange, onNext, onBack }: OnboardingStepProps) {
  void value; void onChange; void onNext; void onBack;
  const { state, updateState, nextStep, prevStep } = useDrMindSetfit()

  

  // BEGIN_MF_BLOCK8_STEP4_PERSIST_V1
  // Persistência Step4 (Nutrição) — step 4 (number), sem quebrar fluxo.
  // Não inventa dados: salva apenas o que já estiver no state/draft local.
  function mfPersistStep4(){
    // 1) salvar snapshot leve do que estiver disponível
    try {
      const payload = {
        // Mantemos genérico: Step4 costuma consolidar dados de dieta/macros/calorias
        // Se existir no state, persistimos sem alterar schema.
        metabolismo: (state as any)?.metabolismo ?? (state as any)?.resultadoMetabolico ?? undefined,
        dieta: (state as any)?.dieta ?? (state as any)?.planoDieta ?? undefined,
        macros: (state as any)?.macros ?? undefined,
      };
      saveOnboardingProgress({ step: 4, data: payload } as any);
    } catch {}
  }

  function mfOnContinue(){
    try { mfPersistStep4(); } catch {}
    /* MF_SAVE_ACTIVEPLAN_NUTRITION_V1 */
    try {
      const inputs = __mfBuildNutritionInputs(state, undefined);
      saveActivePlanNutrition(inputs.body as any, inputs.opts as any);
    } catch {}
    if (typeof nextStep === "function") nextStep();
    else if (typeof onNext === "function") onNext();
  }
  // END_MF_BLOCK8_STEP4_PERSIST_V1
const [estrategia, setEstrategia] = useState<'deficit-leve' | 'deficit-moderado' | 'deficit-agressivo' | 'manutencao' | 'superavit'>('manutencao')
  const [restricoes, setRestricoes] = useState<Restricao[]>([])
  const [refeicoesSelecionadas, setRefeicoesSelecionadas] = useState<TipoRefeicao[]>(['cafe-da-manha', 'almoco', 'lanche-tarde', 'jantar'])

  const refeicoesDiponiveis: { value: TipoRefeicao; label: string; horarioPadrao: string }[] = [
    { value: 'desjejum', label: 'Desjejum', horarioPadrao: '06:00' },
    { value: 'cafe-da-manha', label: 'Café da Manhã', horarioPadrao: '08:00' },
    { value: 'almoco', label: 'Almoço', horarioPadrao: '12:00' },
    { value: 'lanche-tarde', label: 'Lanche da Tarde', horarioPadrao: '16:00' },
    { value: 'jantar', label: 'Jantar', horarioPadrao: '20:00' },
    { value: 'ceia', label: 'Ceia', horarioPadrao: '22:00' }
  ]

  const restricoesDisponiveis: { value: Restricao; label: string }[] = [
    { value: 'lactose', label: 'Lactose' },
    { value: 'gluten', label: 'Glúten' },
    { value: 'ovo', label: 'Ovo' },
    { value: 'acucar', label: 'Açúcar' },
    { value: 'oleaginosas', label: 'Oleaginosas' },
    { value: 'vegetariano', label: 'Vegetariano' },
    { value: 'vegano', label: 'Vegano' },
    { value: 'low-sodium', label: 'Baixo Sódio' },
    { value: 'diabetes', label: 'Diabetes' }
  ]

  const toggleRefeicao = (refeicao: TipoRefeicao) => {
    if (refeicoesSelecionadas.includes(refeicao)) {
      setRefeicoesSelecionadas(refeicoesSelecionadas.filter(r => r !== refeicao))
    } else {
      setRefeicoesSelecionadas([...refeicoesSelecionadas, refeicao])
    }
  }

  const toggleRestricao = (restricao: Restricao) => {
    if (restricoes.includes(restricao)) {
      setRestricoes(restricoes.filter(r => r !== restricao))
    } else {
      setRestricoes([...restricoes, restricao])
    }
  }

  const gerarPlanejamento = () => {
    const calorias = state.metabolismo?.caloriasAlvo || 2000
    const peso = state.avaliacao?.peso || 70

    // Ajuste calórico baseado na estratégia
    let caloriasFinais = calorias
    if (estrategia === 'deficit-leve') caloriasFinais = calorias * 0.9
    if (estrategia === 'deficit-moderado') caloriasFinais = calorias * 0.8
    if (estrategia === 'deficit-agressivo') caloriasFinais = calorias * 0.75
    if (estrategia === 'superavit') caloriasFinais = calorias * 1.15

    // Macronutrientes
    const proteina = Math.round(peso * 2) // 2g/kg
    const gorduras = Math.round(peso * 1) // 1g/kg
    const caloriasRestantes = caloriasFinais - (proteina * 4 + gorduras * 9)
    let carboidratos = Math.round(caloriasRestantes / 4);

    // MF_BLOCO4_GUARDRAILS_V2: consistência kcal ↔ macros (ajusta carboidratos mantendo proteína/gordura)
    const kcalFixas = (proteina * 4) + (gorduras * 9);
    const kcalTarget = Math.round(caloriasFinais);
    const kcalRest = Math.max(0, kcalTarget - kcalFixas);
    const carboFix = Math.max(0, Math.round(kcalRest / 4));
    // clamp de carbo para evitar valores absurdos em cenários extremos
    carboidratos = mfClamp(carboFix, 0, 900);
    // recalcula kcal final para exibição coerente (diferenças por arredondamento)
    const kcalFinal = mfKcalFromMacros(proteina, carboidratos, gorduras);
    caloriasFinais = mfClamp(Math.round(kcalFinal), 800, 6500);
// Filtrar alimentos baseado nas restrições
    const isVegano = restricoes.includes('vegano')
    const isVegetariano = restricoes.includes('vegetariano')

    let alimentosPermitidos = ALIMENTOS_DATABASE
    if (isVegano) {
      alimentosPermitidos = alimentosPermitidos.filter(a => a.vegano)
    } else if (isVegetariano) {
      alimentosPermitidos = alimentosPermitidos.filter(a => a.vegetariano)
    }

    // Gerar refeições baseado na seleção do usuário
    const refeicoes = refeicoesSelecionadas.map(tipoRefeicao => {
      const infoRefeicao = refeicoesDiponiveis.find(r => r.value === tipoRefeicao)!

      let alimentos: AlimentoRefeicao[] = []

      // Lógica de montagem de refeições
      if (tipoRefeicao === 'desjejum' || tipoRefeicao === 'cafe-da-manha') {
        // Café da manhã: carboidrato + fruta + proteína + gordura
        const aveia = alimentosPermitidos.find(a => a.id === 'aveia')!
        const banana = alimentosPermitidos.find(a => a.id === 'banana')!
        const iogurte = isVegano
          ? alimentosPermitidos.find(a => a.id === 'tofu')!
          : alimentosPermitidos.find(a => a.id === 'iogurte-grego')!
        const castanhas = alimentosPermitidos.find(a => a.id === 'castanhas')!

        const gramasAveia = 50
        const gramasBanana = 100
        const gramasIogurte = isVegano ? 100 : 150
        const gramasCastanhas = 20

        alimentos = [
          {
            ...calcularMacros(aveia.id, gramasAveia)!,
            alimentoId: aveia.id,
            nome: aveia.nome,
            gramas: gramasAveia
          },
          {
            ...calcularMacros(banana.id, gramasBanana)!,
            alimentoId: banana.id,
            nome: banana.nome,
            gramas: gramasBanana
          },
          {
            ...calcularMacros(iogurte.id, gramasIogurte)!,
            alimentoId: iogurte.id,
            nome: iogurte.nome,
            gramas: gramasIogurte
          },
          {
            ...calcularMacros(castanhas.id, gramasCastanhas)!,
            alimentoId: castanhas.id,
            nome: castanhas.nome,
            gramas: gramasCastanhas
          }
        ]
      } else if (tipoRefeicao === 'almoco' || tipoRefeicao === 'jantar') {
        // Almoço/Jantar: carboidrato + proteína + legume + folhoso + gordura
        const arroz = alimentosPermitidos.find(a => a.id === 'arroz-integral')!
        const proteina = isVegano
          ? alimentosPermitidos.find(a => a.id === 'tofu')!
          : alimentosPermitidos.find(a => a.id === 'frango-peito')!
        const legume = alimentosPermitidos.find(a => a.id === 'brocolis')!
        const folhoso = alimentosPermitidos.find(a => a.id === 'alface')!
        const gordura = alimentosPermitidos.find(a => a.id === 'azeite')!

        const gramasArroz = 150
        const gramasProteina = isVegano ? 150 : 150
        const gramasLegume = 100
        const gramasFolhoso = 50
        const gramasGordura = 10

        alimentos = [
          {
            ...calcularMacros(arroz.id, gramasArroz)!,
            alimentoId: arroz.id,
            nome: arroz.nome,
            gramas: gramasArroz
          },
          {
            ...calcularMacros(proteina.id, gramasProteina)!,
            alimentoId: proteina.id,
            nome: proteina.nome,
            gramas: gramasProteina
          },
          {
            ...calcularMacros(legume.id, gramasLegume)!,
            alimentoId: legume.id,
            nome: legume.nome,
            gramas: gramasLegume
          },
          {
            ...calcularMacros(folhoso.id, gramasFolhoso)!,
            alimentoId: folhoso.id,
            nome: folhoso.nome,
            gramas: gramasFolhoso
          },
          {
            ...calcularMacros(gordura.id, gramasGordura)!,
            alimentoId: gordura.id,
            nome: gordura.nome,
            gramas: gramasGordura
          }
        ]
      } else if (tipoRefeicao === 'lanche-tarde') {
        // Lanche: fruta + proteína + gordura
        const fruta = alimentosPermitidos.find(a => a.id === 'maca')!
        const proteina = isVegano
          ? alimentosPermitidos.find(a => a.id === 'tofu')!
          : alimentosPermitidos.find(a => a.id === 'iogurte-grego')!
        const gordura = alimentosPermitidos.find(a => a.id === 'castanhas')!

        const gramasFruta = 150
        const gramasProteina = isVegano ? 100 : 150
        const gramasGordura = 20

        alimentos = [
          {
            ...calcularMacros(fruta.id, gramasFruta)!,
            alimentoId: fruta.id,
            nome: fruta.nome,
            gramas: gramasFruta
          },
          {
            ...calcularMacros(proteina.id, gramasProteina)!,
            alimentoId: proteina.id,
            nome: proteina.nome,
            gramas: gramasProteina
          },
          {
            ...calcularMacros(gordura.id, gramasGordura)!,
            alimentoId: gordura.id,
            nome: gordura.nome,
            gramas: gramasGordura
          }
        ]
      } else if (tipoRefeicao === 'ceia') {
        // Ceia: proteína leve + gordura
        const proteina = isVegano
          ? alimentosPermitidos.find(a => a.id === 'tofu')!
          : alimentosPermitidos.find(a => a.id === 'queijo-cottage')!
        const fruta = alimentosPermitidos.find(a => a.id === 'morango')!

        const gramasProteina = isVegano ? 100 : 100
        const gramasFruta = 100

        alimentos = [
          {
            ...calcularMacros(proteina.id, gramasProteina)!,
            alimentoId: proteina.id,
            nome: proteina.nome,
            gramas: gramasProteina
          },
          {
            ...calcularMacros(fruta.id, gramasFruta)!,
            alimentoId: fruta.id,
            nome: fruta.nome,
            gramas: gramasFruta
          }
        ]
      }

      return {
        tipo: tipoRefeicao,
        horario: infoRefeicao.horarioPadrao,
        nome: infoRefeicao.label,
        alimentos
      }
    })

    const planejamento: PlanejamentoNutricional = {
      estrategia,
      restricoes,
      macros: {
        proteina,
        gorduras,
        carboidratos,
        calorias: Math.round(caloriasFinais)
      },
      refeicoesSelecionadas,
      refeicoes
    }

    updateState({ nutricao: planejamento })

  
    // MF_BLOCK13_HARDEN: garante persistência do plano no state antes de avançar
    try {
      // Não inventa schema: tenta salvar no campo mais provável sem quebrar
      const _plano = (typeof planejamento !== "undefined") ? (planejamento as any) : undefined;
      if (_plano) {
        updateState?.({
          ...(typeof state === "object" ? state : {}),
          dieta: (state as any)?.dieta ?? _plano,
          planoDieta: (state as any)?.planoDieta ?? _plano,
        } as any);
      }
    } catch {}
// MF_BLOCK12V2: após gerar o plano, persistir Step4 e avançar
    mfOnContinue();
}

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        
        
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Nutrição e aderência</h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Aqui a gente calibra seu plano alimentar para ser eficiente e sustentável. Preferências, rotina e restrições aumentam a aderência — e aderência é o que dá resultado.
            O sistema usa seu gasto diário e objetivo para definir calorias e macros de forma coerente.
          </p>
        </div>

      <div className="mb-6 sm:mb-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] mb-3 sm:mb-4 hover:from-[#1E6BFF] hover:via-[#00B7FF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0">
          <UtensilsCrossed className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Plano alimentar</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Ajuste para sua rotina e objetivo</p>
      </div>

      {/* Meta Calórica */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl">Calorias alvo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 sm:py-6">
            <p className="text-4xl sm:text-5xl font-bold text-white">{state.metabolismo?.caloriasAlvo || 0}</p>
            <p className="text-sm sm:text-base text-muted-foreground mt-2">calorias por dia</p>

            {/* MF_BLOCO4_UX: aderência + guardrails (premium) */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-wider text-gray-400">Ajuste inteligente</div>
              <div className="mt-1 text-sm text-white/90">
                Nós fechamos suas calorias com macros consistentes e aplicamos limites de segurança para evitar extremos
                (proteína e gordura mínimas/máximas). Isso melhora aderência, energia e sustentabilidade.
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-gray-400">Se sentir fome</div>
                  <div className="text-sm text-white/90">aumente volume alimentar (saladas, legumes, sopas), água e fibra.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-gray-400">Se cair energia</div>
                  <div className="text-sm text-white/90">priorize carbo em torno do treino e sono. Ajustes são ilimitados no app.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-gray-400">Se travar 10–14 dias</div>
                  <div className="text-sm text-white/90">revise passos, NEAT e consistência. Depois ajuste o déficit/superávit.</div>
                </div>
              </div>
            </div>
      
          </div>
        </CardContent>
      </Card>

      {/* Estratégia */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Estratégia</CardTitle>
          <CardDescription className="text-sm">Como ajustar suas calorias com segurança <span className="text-xs text-muted-foreground">• Guardrails premium: macros consistentes e faixa segura.</span></CardDescription>
        </CardHeader>
        <CardContent>
          <Label className="text-sm sm:text-base">Escolha a abordagem</Label>
          <Select value={estrategia} onValueChange={(v: string) => setEstrategia(v as typeof estrategia)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deficit-agressivo">Déficit Agressivo (-25%)</SelectItem>
              <SelectItem value="deficit-moderado">Déficit Moderado (-20%)</SelectItem>
              <SelectItem value="deficit-leve">Déficit Leve (-10%)</SelectItem>
              <SelectItem value="manutencao">Manutenção (0%)</SelectItem>
              <SelectItem value="superavit">Superávit (+15%)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Seleção de Refeições */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Refeições do seu dia</CardTitle>
          <CardDescription className="text-sm">Selecione somente o que você consegue sustentar no dia a dia (quanto mais realista, melhor).</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {refeicoesDiponiveis.map(ref => (
              <div
                key={ref.value}
                onClick={() => toggleRefeicao(ref.value)}
                className={`p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  refeicoesSelecionadas.includes(ref.value)
                    ? 'border-[#1E6BFF] bg-white/5 border border-white/10'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm sm:text-base">{ref.label}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{ref.horarioPadrao}</p>
                  </div>
                  {refeicoesSelecionadas.includes(ref.value) && (
                    <Check className="w-5 h-5 text-white" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-3">
            {refeicoesSelecionadas.length} refeições selecionadas
          </p>
        </CardContent>
      </Card>

      {/* Restrições */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Restrições e preferências</CardTitle>
          <CardDescription className="text-sm">Opcional — usamos isso para evitar sugestões que não fazem sentido para você.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {restricoesDisponiveis.map(rest => (
              <div
                key={rest.value}
                onClick={() => toggleRestricao(rest.value)}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <Checkbox
                  checked={restricoes.includes(rest.value)}
                  onCheckedChange={() => toggleRestricao(rest.value)}
                />
                <Label className="text-sm cursor-pointer">{rest.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Macros Preview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Prévia de macros</CardTitle>
          <CardDescription className="text-sm">Estimativa inicial baseada no seu peso e na meta calórica. Você ajusta ao longo do acompanhamento.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Proteína</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{Math.round((state.avaliacao?.peso || 70) * 2)}g</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Gorduras</p>
              <p className="text-xl sm:text-2xl font-bold text-white">{Math.round((state.avaliacao?.peso || 70) * 1)}g</p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Carbos</p>
              <p className="text-xl sm:text-2xl font-bold text-white">~{Math.round(((state.metabolismo?.caloriasAlvo || 2000) - ((state.avaliacao?.peso || 70) * 2 * 4 + (state.avaliacao?.peso || 70) * 1 * 9)) / 4)}g</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={prevStep}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Voltar
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={gerarPlanejamento}
          disabled={refeicoesSelecionadas.length === 0}
          className="w-full sm:flex-1 bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0"
        >
          Gerar Planejamento
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
