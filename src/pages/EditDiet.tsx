import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  ArrowLeft,
  UtensilsCrossed,
  Save,
  RefreshCw,
  Info,
  Search
} from 'lucide-react'
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
import logoUrl from "@/assets/branding/mindsetfit-logo.png";
import { generateMindsetFitPremiumPdf } from "@/lib/pdf/mindsetfitPdf";

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
    signatureLines: [
      "Luiz Henrique Alexandre",
      "Nutricionista • CRN XXXXX",
      "MindSetFit — acompanhamento premium",
    ],

    logoUrl,
    fileName: "mindsetfit-dieta.pdf",
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

// Banco de dados de substitutos por categoria
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

// Função para identificar categoria de alimento
function identificarCategoria(nomeAlimento: string): string {
  const nome = nomeAlimento.toLowerCase()

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

// Função para ajustar gramas para igualar calorias
function ajustarGramas(alimentoOriginal: AlimentoRefeicao, substituto: typeof SUBSTITUTOS_DATABASE.proteina_animal[0]): number {
  const proporacao = alimentoOriginal.calorias / substituto.calorias
  return Math.round(100 * proporacao)
}

export function EditDiet() {
  const { state, updateState } = useDrMindSetfit()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>(state.dietaAtiva?.nutricao.refeicoes || [])

  if (!state.dietaAtiva) {
    
  
  
return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="w-full max-w-md mx-4 glass-effect neon-border">
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

  const handleSubstituir = (refeicaoIdx: number, alimentoIdx: number, substituto: typeof SUBSTITUTOS_DATABASE.proteina_animal[0]) => {
    const novasRefeicoes = [...refeicoes]
    const alimentoOriginal = novasRefeicoes[refeicaoIdx].alimentos[alimentoIdx]
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
    if (state.dietaAtiva) {
      updateState({
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
  }

  const handleResetar = () => {
    if (state.nutricao) {
      setRefeicoes(state.nutricao.refeicoes)
      toast({
        title: "Dieta resetada",
        description: "Voltou para o plano original.",
      })
    }
  }

  const totalCalorias = refeicoes.reduce((acc, ref) =>
    acc + ref.alimentos.reduce((a, alim) => a + alim.calorias, 0), 0
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigate('/nutrition')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h1 className="text-xl font-bold text-neon">Editar Minha Dieta</h1>

          <div className="mt-4 flex gap-2 flex-wrap">
            <button type="button" onClick={downloadPdfPremiumDiet} className="rounded-xl border border-white/10 bg-black/40 px-4 py-2 text-xs hover:bg-black/60">Baixar PDF Premium</button>
          </div>

              <p className="text-xs text-gray-400">{totalCalorias.toFixed(0)} kcal totais</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleResetar}>
              <RefreshCw className="w-5 h-5 text-yellow-400" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <Card className="glass-effect border-blue-500/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-400 mb-1">Personalize sua dieta</p>
                <p className="text-xs text-gray-400">
                  Cada alimento possui pelo menos 10 substitutos respeitando a mesma categoria e calorias equivalentes.
                  As gramas são ajustadas automaticamente para manter o valor calórico.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refeições Editáveis */}
        <div className="space-y-6">
          {refeicoes.map((refeicao, refIdx) => (
            <Card key={refIdx} className="glass-effect border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-green-400" />
                  {refeicao.nome}
                </CardTitle>
                <p className="text-xs text-gray-400">{refeicao.horario}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {refeicao.alimentos.map((alimento, alimIdx) => (
                  <div key={alimIdx} className="p-3 rounded-lg bg-black/30 border border-white/10">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alimento.nome}</p>
                        <p className="text-xs text-gray-500">{alimento.gramas}g • {alimento.calorias.toFixed(0)} kcal</p>
                      </div>

                      {/* Dialog de Substitutos */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" className="text-xs h-7">
                            <Search className="w-3 h-3 mr-1" />
                            Substituir
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl bg-gray-900 text-white border-white/10">
                          <DialogHeader>
                            <DialogTitle>Substituir: {alimento.nome}</DialogTitle>
                          </DialogHeader>
                          <ScrollArea className="h-96 pr-4">
                            <div className="space-y-2">
                              {SUBSTITUTOS_DATABASE[identificarCategoria(alimento.nome)].map((substituto, subIdx) => {
                                const gramasAjustadas = ajustarGramas(alimento, substituto)
                                const fator = gramasAjustadas / 100

                                return (
                                  <button
                                    key={subIdx}
                                    onClick={() => handleSubstituir(refIdx, alimIdx, substituto)}
                                    className="w-full p-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium text-sm">{substituto.nome}</p>
                                        <p className="text-xs text-gray-400">
                                          {gramasAjustadas}g • {(substituto.calorias * fator).toFixed(0)} kcal
                                        </p>
                                      </div>
                                      <div className="flex gap-2 text-xs">
                                        <span className="text-red-400">{(substituto.proteinas * fator).toFixed(1)}g P</span>
                                        <span className="text-yellow-400">{(substituto.carboidratos * fator).toFixed(1)}g C</span>
                                        <span className="text-purple-400">{(substituto.gorduras * fator).toFixed(1)}g G</span>
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

                    <div className="flex gap-3 text-xs mt-2 pt-2 border-t border-white/5">
                      <span className="text-red-400">Proteínas: {alimento.proteinas.toFixed(1)}g</span>
                      <span className="text-yellow-400">Carbo: {alimento.carboidratos.toFixed(1)}g</span>
                      <span className="text-purple-400">Gordura: {alimento.gorduras.toFixed(1)}g</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botão Salvar */}
        <div className="sticky bottom-0 pb-6 pt-4 bg-gradient-to-t from-black via-black to-transparent">
          <Button onClick={handleSalvar} className="w-full glow-green h-12 text-lg">
            <Save className="w-5 h-5 mr-2" />
            Salvar Alterações
          </Button>
        </div>
      </main>
    </div>
  )
}
