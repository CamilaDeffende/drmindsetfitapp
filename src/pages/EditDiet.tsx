import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  ArrowLeft,
  UtensilsCrossed,
  RefreshCw,
  Info,
  Search,
  Download,
  Save
} from 'lucide-react'
import { sumKcalFromRefeicoes } from "@/engine/nutrition/NutritionEngine";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { AlimentoRefeicao, Refeicao } from '@/types'
import { useToast } from '@/hooks/use-toast'
import { generateMindsetFitPremiumPdf } from "@/lib/pdf/mindsetfitPdf";
import { mindsetfitSignatureLines } from "@/assets/branding/signature";
import { BrandIcon } from "@/components/branding/BrandIcon";

function buildDietExportText() {
  const lines = [
    "DRMINDSETFIT — DIETA (RELATÓRIO)",
    "",
    "Template: MindSetFit Premium (PDF)",
    "",
    "Conteúdo recomendado:",
    "- Calorias e macros",
    "- Refeições (horários, alimentos, quantidades)",
    "- Substituições",
    "- Hidratação e suplementação",
    ""
  ];
  return lines.join("\n");
}

async function downloadPdfPremiumDiet() {
  await generateMindsetFitPremiumPdf({
    signatureLines: mindsetfitSignatureLines,
    wordmarkText: "MindSetFit",
    reportLabel: "RELATÓRIO DIETA",
    metaLines: [
      "Módulo: Dieta",
      "Template: MindSetFit Premium (PDF)",
    ],
    bodyText: buildDietExportText(),
    layout: {
      logoW: 220,
      logoH: 150,
      logoY: 78,
      wordmarkSize: 38,
      wordmarkGap: 92,
      headerGap: 32,
      margin: 60,
      lineHeight: 13,
      drawFrame: true,
    },
  });
}

function mfNum(x: unknown, fallback = 0): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}

function safeFixed(value: unknown, digits = 0): string {
  return mfNum(value, 0).toFixed(digits);
}

const SUBSTITUTOS_DATABASE: Record<string, { nome: string; calorias: number; proteinas: number; carboidratos: number; gorduras: number }[]> = {
  'proteina-animal': [
    { nome: 'Peito de Frango Grelhado', calorias: 165, proteinas: 31, carboidratos: 0, gorduras: 3.6 },
    { nome: 'Filé de Tilápia', calorias: 129, proteinas: 26, carboidratos: 0, gorduras: 2.7 },
    { nome: 'Atum em Água', calorias: 132, proteinas: 29, carboidratos: 0, gorduras: 1.3 },
    { nome: 'Salmão Grelhado', calorias: 206, proteinas: 22, carboidratos: 0, gorduras: 13 },
    { nome: 'Peito de Peru Fatiado', calorias: 111, proteinas: 24, carboidratos: 0.6, gorduras: 1 },
    { nome: 'Ovo Inteiro Cozido', calorias: 155, proteinas: 13, carboidratos: 1.1, gorduras: 11 },
    { nome: 'Clara de Ovo', calorias: 52, proteinas: 11, carboidratos: 0.7, gorduras: 0.2 },
    { nome: 'Patinho Moído Magro', calorias: 176, proteinas: 26, carboidratos: 0, gorduras: 7.5 },
    { nome: 'Sardinha em Conserva', calorias: 208, proteinas: 25, carboidratos: 0, gorduras: 11 },
    { nome: 'Camarão Cozido', calorias: 99, proteinas: 24, carboidratos: 0.2, gorduras: 0.3 },
    { nome: 'Bacalhau Dessalgado', calorias: 82, proteinas: 18, carboidratos: 0, gorduras: 0.7 },
    { nome: 'Alcatra Grelhada', calorias: 168, proteinas: 28, carboidratos: 0, gorduras: 5.8 }
  ],
  'proteina-vegetal': [
    { nome: 'Tofu Firme', calorias: 144, proteinas: 17, carboidratos: 3.5, gorduras: 9 },
    { nome: 'Tempeh', calorias: 193, proteinas: 19, carboidratos: 9, gorduras: 11 },
    { nome: 'Edamame Cozido', calorias: 122, proteinas: 11, carboidratos: 10, gorduras: 5 },
    { nome: 'Lentilha Cozida', calorias: 116, proteinas: 9, carboidratos: 20, gorduras: 0.4 },
    { nome: 'Grão de Bico Cozido', calorias: 164, proteinas: 9, carboidratos: 27, gorduras: 2.6 },
    { nome: 'Feijão Preto Cozido', calorias: 132, proteinas: 9, carboidratos: 24, gorduras: 0.5 },
    { nome: 'Quinoa Cozida', calorias: 120, proteinas: 4, carboidratos: 21, gorduras: 1.9 },
    { nome: 'Proteína de Soja Texturizada', calorias: 170, proteinas: 52, carboidratos: 30, gorduras: 1 },
    { nome: 'Ervilha Verde Cozida', calorias: 81, proteinas: 5, carboidratos: 14, gorduras: 0.4 },
    { nome: 'Seitan (Glúten de Trigo)', calorias: 120, proteinas: 25, carboidratos: 4, gorduras: 0.5 },
    { nome: 'Amendoim Cru', calorias: 567, proteinas: 26, carboidratos: 16, gorduras: 49 },
    { nome: 'Amêndoas', calorias: 579, proteinas: 21, carboidratos: 22, gorduras: 50 }
  ],
  'carboidrato': [
    { nome: 'Arroz Integral Cozido', calorias: 112, proteinas: 2.6, carboidratos: 24, gorduras: 0.9 },
    { nome: 'Arroz Branco Cozido', calorias: 130, proteinas: 2.7, carboidratos: 28, gorduras: 0.3 },
    { nome: 'Batata Doce Cozida', calorias: 86, proteinas: 1.6, carboidratos: 20, gorduras: 0.1 },
    { nome: 'Batata Inglesa Cozida', calorias: 87, proteinas: 2, carboidratos: 20, gorduras: 0.1 },
    { nome: 'Macarrão Integral Cozido', calorias: 124, proteinas: 5, carboidratos: 26, gorduras: 0.5 },
    { nome: 'Pão Integral', calorias: 247, proteinas: 13, carboidratos: 41, gorduras: 3.4 },
    { nome: 'Aveia em Flocos', calorias: 389, proteinas: 17, carboidratos: 66, gorduras: 7 },
    { nome: 'Tapioca', calorias: 358, proteinas: 0.2, carboidratos: 88, gorduras: 0.3 },
    { nome: 'Mandioca Cozida', calorias: 125, proteinas: 0.6, carboidratos: 30, gorduras: 0.3 },
    { nome: 'Cuscuz Marroquino', calorias: 112, proteinas: 3.8, carboidratos: 23, gorduras: 0.2 },
    { nome: 'Inhame Cozido', calorias: 118, proteinas: 1.5, carboidratos: 28, gorduras: 0.2 },
    { nome: 'Banana', calorias: 89, proteinas: 1.1, carboidratos: 23, gorduras: 0.3 }
  ],
  'gordura-saudavel': [
    { nome: 'Azeite de Oliva Extra Virgem', calorias: 884, proteinas: 0, carboidratos: 0, gorduras: 100 },
    { nome: 'Abacate', calorias: 160, proteinas: 2, carboidratos: 9, gorduras: 15 },
    { nome: 'Castanha do Pará', calorias: 656, proteinas: 14, carboidratos: 12, gorduras: 66 },
    { nome: 'Castanha de Caju', calorias: 553, proteinas: 18, carboidratos: 30, gorduras: 44 },
    { nome: 'Nozes', calorias: 654, proteinas: 15, carboidratos: 14, gorduras: 65 },
    { nome: 'Amêndoas', calorias: 579, proteinas: 21, carboidratos: 22, gorduras: 50 },
    { nome: 'Óleo de Coco', calorias: 862, proteinas: 0, carboidratos: 0, gorduras: 100 },
    { nome: 'Pasta de Amendoim Integral', calorias: 588, proteinas: 25, carboidratos: 20, gorduras: 50 },
    { nome: 'Semente de Chia', calorias: 486, proteinas: 17, carboidratos: 42, gorduras: 31 },
    { nome: 'Semente de Linhaça', calorias: 534, proteinas: 18, carboidratos: 29, gorduras: 42 },
    { nome: 'Gema de Ovo', calorias: 322, proteinas: 16, carboidratos: 3.6, gorduras: 27 },
    { nome: 'Salmão (gordura natural)', calorias: 206, proteinas: 22, carboidratos: 0, gorduras: 13 }
  ],
  'laticinios': [
    { nome: 'Leite Desnatado', calorias: 34, proteinas: 3.4, carboidratos: 5, gorduras: 0.1 },
    { nome: 'Leite Integral', calorias: 61, proteinas: 3.2, carboidratos: 4.8, gorduras: 3.3 },
    { nome: 'Iogurte Grego Natural 0%', calorias: 59, proteinas: 10, carboidratos: 3.6, gorduras: 0.4 },
    { nome: 'Iogurte Natural Integral', calorias: 61, proteinas: 3.5, carboidratos: 4.7, gorduras: 3.3 },
    { nome: 'Queijo Cottage', calorias: 98, proteinas: 11, carboidratos: 3.4, gorduras: 4.3 },
    { nome: 'Queijo Minas Frescal', calorias: 264, proteinas: 17, carboidratos: 3.2, gorduras: 21 },
    { nome: 'Ricota Fresca', calorias: 174, proteinas: 11, carboidratos: 3.4, gorduras: 13 },
    { nome: 'Requeijão Light', calorias: 180, proteinas: 8, carboidratos: 3, gorduras: 15 },
    { nome: 'Whey Protein Isolado', calorias: 110, proteinas: 25, carboidratos: 2, gorduras: 0.5 },
    { nome: 'Kefir Natural', calorias: 41, proteinas: 3.3, carboidratos: 4.5, gorduras: 1 },
    { nome: 'Leite de Búfala', calorias: 97, proteinas: 3.8, carboidratos: 5.2, gorduras: 6.9 },
    { nome: 'Coalhada Natural', calorias: 45, proteinas: 3.4, carboidratos: 5, gorduras: 1.1 }
  ],
  'vegetais': [
    { nome: 'Brócolis Cozido', calorias: 35, proteinas: 2.4, carboidratos: 7, gorduras: 0.4 },
    { nome: 'Couve-Flor', calorias: 25, proteinas: 1.9, carboidratos: 5, gorduras: 0.3 },
    { nome: 'Espinafre', calorias: 23, proteinas: 2.9, carboidratos: 3.6, gorduras: 0.4 },
    { nome: 'Abobrinha', calorias: 17, proteinas: 1.2, carboidratos: 3.1, gorduras: 0.3 },
    { nome: 'Tomate', calorias: 18, proteinas: 0.9, carboidratos: 3.9, gorduras: 0.2 },
    { nome: 'Alface Americana', calorias: 14, proteinas: 0.9, carboidratos: 2.9, gorduras: 0.1 },
    { nome: 'Cenoura', calorias: 41, proteinas: 0.9, carboidratos: 10, gorduras: 0.2 },
    { nome: 'Pepino', calorias: 15, proteinas: 0.7, carboidratos: 3.6, gorduras: 0.1 },
    { nome: 'Berinjela', calorias: 25, proteinas: 1, carboidratos: 6, gorduras: 0.2 },
    { nome: 'Rúcula', calorias: 25, proteinas: 2.6, carboidratos: 3.7, gorduras: 0.7 },
    { nome: 'Aspargos', calorias: 20, proteinas: 2.2, carboidratos: 3.9, gorduras: 0.1 },
    { nome: 'Vagem', calorias: 31, proteinas: 1.8, carboidratos: 7, gorduras: 0.2 }
  ]
}

type SubstitutoItem = (typeof SUBSTITUTOS_DATABASE)['proteina-animal'][number];

function identificarCategoria(nomeAlimento: string): string {
  const nome = (nomeAlimento || '').toLowerCase()

  if (nome.includes('frango') || nome.includes('peixe') || nome.includes('atum') || nome.includes('salmão') ||
      nome.includes('ovo') || nome.includes('carne') || nome.includes('peru')) {
    return 'proteina-animal'
  }
  if (nome.includes('tofu') || nome.includes('lentilha') || nome.includes('grão') || nome.includes('feijão')) {
    return 'proteina-vegetal'
  }
  if (nome.includes('arroz') || nome.includes('batata') || nome.includes('macarrão') || nome.includes('pão') ||
      nome.includes('aveia') || nome.includes('tapioca')) {
    return 'carboidrato'
  }
  if (nome.includes('azeite') || nome.includes('abacate') || nome.includes('castanha') || nome.includes('óleo')) {
    return 'gordura-saudavel'
  }
  if (nome.includes('leite') || nome.includes('iogurte') || nome.includes('queijo') || nome.includes('whey')) {
    return 'laticinios'
  }
  return 'vegetais'
}

function ajustarGramas(alimentoOriginal: AlimentoRefeicao, substituto: SubstitutoItem): number {
  const caloriasOriginais = mfNum(alimentoOriginal?.calorias, 0)
  const caloriasSubstituto = mfNum(substituto?.calorias, 0)

  if (caloriasOriginais <= 0 || caloriasSubstituto <= 0) return 100

  const proporacao = caloriasOriginais / caloriasSubstituto
  return Math.round(100 * proporacao)
}

export function EditDiet() {
  const { state, updateState } = useDrMindSetfit()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>(
    Array.isArray(state.dietaAtiva?.nutricao?.refeicoes) ? state.dietaAtiva!.nutricao.refeicoes : []
  )

  if (!state.dietaAtiva) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black text-white">
        <Card className="w-full max-w-md mx-4 glass-effect neon-border border-white/10 bg-black/40">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-neon mb-4">Nenhuma Dieta Ativa</h2>
            <p className="text-gray-400 mb-6">Configure seu planejamento primeiro</p>
            <Button onClick={() => navigate('/planos-ativos')} className="w-full glow-blue">
              Configurar Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubstituir = (refeicaoIdx: number, alimentoIdx: number, substituto: SubstitutoItem) => {
    const novasRefeicoes = [...refeicoes]
    const alimentoOriginal = novasRefeicoes?.[refeicaoIdx]?.alimentos?.[alimentoIdx]

    if (!alimentoOriginal) return

    const gramasAjustadas = ajustarGramas(alimentoOriginal, substituto)
    const fatorAjuste = gramasAjustadas / 100

    novasRefeicoes[refeicaoIdx].alimentos[alimentoIdx] = {
      alimentoId: `sub-${Date.now()}`,
      nome: substituto.nome,
      gramas: gramasAjustadas,
      calorias: substituto.calorias * fatorAjuste,
      proteinas: substituto.proteinas * fatorAjuste,
      carboidratos: substituto.carboidratos * fatorAjuste,
      gorduras: substituto.gorduras * fatorAjuste
    }

    setRefeicoes(novasRefeicoes)

    toast({
      title: "Alimento substituído!",
      description: `${alimentoOriginal.nome} → ${substituto.nome}`,
    })
  }

  const handleSalvar = () => {
    if (!state.dietaAtiva) return

    updateState({
      nutricao: {
        ...state.nutricao,
        ...state.dietaAtiva.nutricao,
        refeicoes
      },
      dietaAtiva: {
        ...state.dietaAtiva,
        nutricao: {
          ...state.dietaAtiva.nutricao,
          refeicoes
        }
      }
    })

    toast({
      title: "Dieta salva com sucesso!",
      description: "Suas alterações foram aplicadas.",
    })

    navigate('/nutrition')
  }

  const handleResetar = () => {
    if (state.nutricao?.refeicoes) {
      setRefeicoes(state.nutricao.refeicoes)
      toast({
        title: "Dieta resetada",
        description: "Voltou para o plano original.",
      })
    }
  }

  const totalCalorias = mfNum(sumKcalFromRefeicoes(refeicoes), 0)

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      <header className="sticky top-0 z-50 glass-effect border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          
          {/* ESQUERDA — BACK + LOGO + TEXTO */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/nutrition')}
              className="hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <div className="flex items-center gap-3">
              <BrandIcon className="h-12 w-12" />

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-neon">
                  Editar Minha Dieta
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-1">
                  {refeicoes.length} refeições • {safeFixed(totalCalorias, 0)} kcal totais
                </p>
              </div>
            </div>
          </div>

          {/* DIREITA — AÇÕES */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={downloadPdfPremiumDiet}
              className="h-10 px-4 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>

            <Button
              variant="outline"
              onClick={handleResetar}
              className="h-10 border-white/15 text-white hover:bg-white/10"
            >
              <RefreshCw className="w-4 h-4 mr-2 text-yellow-400" />
              Resetar
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <Card className="glass-effect border-white/10 bg-black/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#1E6BFF] mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-[#1E6BFF] mb-1">Personalize sua dieta</p>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                  Cada alimento possui substitutos respeitando a mesma categoria e calorias equivalentes.
                  As gramas são ajustadas automaticamente para manter o valor calórico do plano.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {refeicoes.map((refeicao, refIdx) => (
            <Card key={refIdx} className="glass-effect border-white/10 bg-black/30">
              <CardHeader className="pb-3">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl text-gray-100">
                      <UtensilsCrossed className="w-4 h-4 text-green-400" />
                      {refeicao?.nome || `Refeição ${refIdx + 1}`}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-400 mt-1">
                      {refeicao?.horario || '--:--'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {(Array.isArray(refeicao?.alimentos) ? refeicao.alimentos : []).map((alimento, alimIdx) => {
                  const categoria = identificarCategoria(alimento?.nome || '')
                  const substitutos = SUBSTITUTOS_DATABASE[categoria] || []

                  return (
                    <div
                      key={alimIdx}
                      className="p-4 rounded-2xl bg-black/20 border border-white/10 hover:bg-black/35 transition-all"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div>
                              <p className="font-semibold text-base text-gray-100">
                                {alimento?.nome || `Alimento ${alimIdx + 1}`}
                              </p>
                              <p className="text-sm text-[#1E6BFF] font-medium mt-1">
                                {mfNum(alimento?.gramas, 0)}g
                              </p>
                            </div>

                            <div className="rounded-full border border-green-500/30 bg-green-500/15 px-3 py-1 text-xs font-medium text-green-400">
                              {safeFixed(alimento?.calorias, 0)} kcal
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs sm:text-sm">
                            <div className="rounded-xl bg-white/5 border border-white/10 p-2">
                              <span className="text-red-400 font-medium">P:</span>{" "}
                              <span className="text-gray-200">{safeFixed(alimento?.proteinas, 1)}g</span>
                            </div>
                            <div className="rounded-xl bg-white/5 border border-white/10 p-2">
                              <span className="text-yellow-400 font-medium">C:</span>{" "}
                              <span className="text-gray-200">{safeFixed(alimento?.carboidratos, 1)}g</span>
                            </div>
                            <div className="rounded-xl bg-white/5 border border-white/10 p-2">
                              <span className="text-[#1E6BFF] font-medium">G:</span>{" "}
                              <span className="text-gray-200">{safeFixed(alimento?.gorduras, 1)}g</span>
                            </div>
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full lg:w-auto text-xs bg-[#1E6BFF]/20 border-[#1E6BFF]/30 text-[#1E6BFF] hover:bg-[#1E6BFF]/30"
                            >
                              <Search className="w-3 h-3 mr-1" />
                              Substituir
                            </Button>
                          </DialogTrigger>

                          <DialogContent className="max-w-2xl bg-[#0b1118] text-white border-white/10">
                            <DialogHeader>
                              <DialogTitle className="text-lg text-neon">
                                Substituir: {alimento?.nome || 'Alimento'}
                              </DialogTitle>
                            </DialogHeader>

                            <ScrollArea className="h-96 pr-4">
                              <div className="space-y-2">
                                {substitutos.map((substituto, subIdx) => {
                                  const gramasAjustadas = ajustarGramas(alimento, substituto)
                                  const fator = gramasAjustadas / 100

                                  return (
                                    <button
                                      key={subIdx}
                                      onClick={() => handleSubstituir(refIdx, alimIdx, substituto)}
                                      className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
                                    >
                                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex-1">
                                          <p className="font-medium text-sm text-gray-100">{substituto.nome}</p>
                                          <p className="text-xs text-gray-400 mt-1">
                                            {gramasAjustadas}g • {safeFixed(substituto.calorias * fator, 0)} kcal
                                          </p>
                                        </div>

                                        <div className="flex gap-2 text-xs flex-wrap">
                                          <span className="rounded-full bg-red-500/10 border border-red-500/20 px-2 py-1 text-red-400">
                                            {safeFixed(substituto.proteinas * fator, 1)}g P
                                          </span>
                                          <span className="rounded-full bg-yellow-500/10 border border-yellow-500/20 px-2 py-1 text-yellow-400">
                                            {safeFixed(substituto.carboidratos * fator, 1)}g C
                                          </span>
                                          <span className="rounded-full bg-[#1E6BFF]/10 border border-[#1E6BFF]/20 px-2 py-1 text-[#1E6BFF]">
                                            {safeFixed(substituto.gorduras * fator, 1)}g G
                                          </span>
                                        </div>
                                      </div>
                                    </button>
                                  )
                                })}
                              </div>
                            </ScrollArea>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="sticky bottom-0 pb-6 pt-4 bg-gradient-to-t from-black via-black to-transparent">
          <Button onClick={handleSalvar} className="w-full h-12 glow-blue font-semibold text-base">
            <Save className="w-4 h-4 mr-2" />
            Salvar alterações
          </Button>
        </div>
      </main>
    </div>
  )
}