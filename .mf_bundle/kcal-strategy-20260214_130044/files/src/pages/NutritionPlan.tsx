import * as React from "react";
import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, RefreshCw, Edit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { buscarSubstituicoes } from '@/types/alimentos'
import { sumMacrosFromRefeicoes, guessPesoKgFromStateLike, validateDietScience, buildDietExportTextPhase3E, copyTextFallbackPhase3E } from "@/engine/nutrition/NutritionEngine";
import { sumAlimentosTotals } from "@/engine/nutrition/NutritionEngine";
import { mindsetfitSignatureLines } from "@/assets/branding/signature";
import { buildDietExportPayload } from "@/engine/nutrition/NutritionEngine";
import { generateMindsetFitPremiumPdf } from "@/lib/pdf/mindsetfitPdf";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from "@/components/ui/textarea";
async function downloadPdfPremiumDietPhase3D(state: any) {
  const payload = buildDietExportPayload({
    stateLike: state,
    nutricao: state?.nutricao ?? {},
    tolerancePct: 10
  });
  const content = [
    payload.title,
    "",
    ...payload.summaryLines,
    "",
    "Refeições:",
    ...payload.mealsLines,
    "",
    ...payload.notesLines,
  ].join("\n");

  await generateMindsetFitPremiumPdf({
    title: payload.title,
    content: content,
    signatureLines: mindsetfitSignatureLines,
  } as any);
}

export function NutritionPlan() {
  const { state } = useDrMindSetfit()

  // ===== Phase 3F — Plano em texto (Dialog premium) =====
  const [planTextOpen, setPlanTextOpen] = React.useState(false)
  const [planTextDraft, setPlanTextDraft] = React.useState<string>("")

  
  const getPlanText = React.useCallback((): string => {
    try {
      const text = buildDietExportTextPhase3E({
        stateLike: state,
        nutricao: state?.nutricao ?? {},
        tolerancePct: 10,
      }) || ""
      return String(text || "")
    } catch {
      return ""
    }
  }, [state])

  const openPlanText = () => {
    setPlanTextDraft(getPlanText())
    setPlanTextOpen(true)
  }
  const copyPlanText = async () => {
    const t = (planTextDraft || "").trim()
    if (!t) return
    await navigator.clipboard.writeText(t)
  }

  const downloadPlanTxt = () => {
    const t = planTextDraft || ""
    const blob = new Blob([t], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "plano.txt"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
  const nutricaoSafe = state.nutricao ?? {
    refeicoes: [],
    macros: { calorias: 0, proteina: 0, carboidratos: 0, gorduras: 0 },
    restricoes: [],
  };

  // ===== Phase 3C — Resumo do dia + Check científico =====
  const dayTotals = sumMacrosFromRefeicoes(nutricaoSafe.refeicoes ?? []);
  const pesoKg = guessPesoKgFromStateLike(state);
  const kcalTarget = nutricaoSafe?.macros?.calorias;
  const science = validateDietScience({ kcalTarget, refeicoes: nutricaoSafe.refeicoes ?? [], tolerancePct: 10 });
  const navigate = useNavigate()

  if (!state.nutricao) {
return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Nenhum Planejamento Configurado</CardTitle>
            <CardDescription>Configure seu plano nutricional primeiro</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/')} className="w-full">
              Configurar Agora
            </Button>
          </CardContent>
        </Card>
      {/* PHASE_3F_PLAN_TEXT_DIALOG_UI */}
      <Dialog open={planTextOpen} onOpenChange={setPlanTextOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Plano em texto</DialogTitle>
            <DialogDescription className="text-sm text-gray-400">
              Edite o texto livremente. Você pode copiar ou baixar em .txt.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Textarea
              value={planTextDraft}
              onChange={(e) => setPlanTextDraft(e.target.value)}
              className="min-h-[260px] text-sm leading-relaxed"
              placeholder="Seu plano em texto aparecerá aqui..."
            />

            <div className="flex gap-2 justify-end">
              <Button type="button" onClick={() => void copyPlanText()} className="h-10 px-4 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10">
                Copiar
              </Button>
              <Button type="button" onClick={downloadPlanTxt} className="h-10 px-4 text-sm font-semibold glow-blue">
                Baixar .txt
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Header Premium */}
      <header className="sticky top-0 z-50 glass-effect border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neon">
              Nutrição
            </h1>
            <p className="text-xs text-gray-400">
              {nutricaoSafe.refeicoes.length} refeições • {nutricaoSafe.macros.calorias} kcal/dia
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openPlanText} className="h-10 px-4 text-sm font-semibold bg-white/5 hover:bg-white/10 border border-white/10">
              Plano em texto
            </Button>

            <Button
              onClick={() => downloadPdfPremiumDietPhase3D(state)}
              className="h-10 px-4 text-sm font-semibold glow-blue"
            >
              Exportar Nutrição (PDF)
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const text = buildDietExportTextPhase3E({ stateLike: state, nutricao: nutricaoSafe, tolerancePct: 10 });
                const ok = await copyTextFallbackPhase3E(text);
                if (!ok) alert("Não foi possível copiar. Tente novamente.");
              }}
              className="h-10 border-white/15 text-white hover:bg-white/10"
            >
              Copiar plano (texto)
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/edit-diet')} className="">
              <Edit className="w-4 h-4 mr-2" />
              Editar Dieta
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="glow-blue">
              <Home className="w-5 h-5 text-[#1E6BFF]" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Resumo dos Macros Premium */}
        <Card className="mb-6 glass-effect neon-border">
          <CardHeader>
            <CardTitle className="text-xl text-neon">Seus Macronutrientes Diários</CardTitle>
            <CardDescription className="text-gray-400">Meta diária de nutrientes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-xl border border-green-500/30">
                <p className="text-xs text-gray-400 mb-1">Calorias</p>
                <p className="text-3xl font-bold text-green-400">{nutricaoSafe.macros.calorias}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-[#1E6BFF]/20 to-[#00B7FF]/10 rounded-xl border border-[#1E6BFF]/30">
                <p className="text-xs text-gray-400 mb-1">Proteína</p>
                <p className="text-3xl font-bold text-[#1E6BFF]">{nutricaoSafe.macros.proteina}</p>
                <p className="text-xs text-gray-500">gramas</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl border border-yellow-500/30">
                <p className="text-xs text-gray-400 mb-1">Gorduras</p>
                <p className="text-3xl font-bold text-yellow-400">{nutricaoSafe.macros.gorduras}</p>
                <p className="text-xs text-gray-500">gramas</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-[#1E6BFF]/20 to-[#00B7FF]/10 rounded-xl border border-[#1E6BFF]/30">
                <p className="text-xs text-gray-400 mb-1">Carboidratos</p>
                <p className="text-3xl font-bold text-[#1E6BFF]">{nutricaoSafe.macros.carboidratos}</p>
                <p className="text-xs text-gray-500">gramas</p>
              </div>
            </div>

            {nutricaoSafe.restricoes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-2">Restrições ativas:</p>
                <div className="flex flex-wrap gap-2">
                  {nutricaoSafe.restricoes.map((rest: any) => (
                    <Badge key={rest} variant="outline" className="text-xs border-red-500/50 text-red-400">
                      {rest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        
        {/* Resumo do dia (Phase 3C) */}
        <Card className="glass-effect border-white/10">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg text-gray-100">Resumo do dia</CardTitle>
                <CardDescription className="text-sm text-gray-400">
                  Totais consolidados das refeições + consistência do plano
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className={science.ok
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                  : "bg-red-500/15 border-red-500/30 text-red-300"}
              >
                {science.ok ? "Coerente" : "Atenção"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs">Calorias</p>
                <p className="text-gray-100 font-semibold">{dayTotals.calorias} kcal</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs">Proteínas</p>
                <p className="text-gray-100 font-semibold">{dayTotals.proteinas.toFixed(1)} g</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs">Carboidratos</p>
                <p className="text-gray-100 font-semibold">{dayTotals.carboidratos.toFixed(1)} g</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-gray-400 text-xs">Gorduras</p>
                <p className="text-gray-100 font-semibold">{dayTotals.gorduras.toFixed(1)} g</p>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-gray-400">Check científico</p>
              <p className="text-sm text-gray-200 font-medium">{science.message}</p>
              {pesoKg ? (
                <p className="text-xs text-gray-400 mt-2">Peso inferido: {pesoKg.toFixed(1)} kg (para contexto metabólico)</p>
              ) : (
                <p className="text-xs text-gray-500 mt-2">Peso não disponível para contexto metabólico.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Refeições */}
        <div className="space-y-4">
          {nutricaoSafe.refeicoes.map((refeicao: any, index: number) => {

              const totals = sumAlimentosTotals(refeicao.alimentos);

            return (
              <Card key={index} className="glass-effect border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl text-gray-100">{refeicao.nome}</CardTitle>
                      <CardDescription className="text-sm text-gray-400">
                        {refeicao.horario} • {totals.calorias} kcal
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline" className="bg-[#1E6BFF]/20 border-[#1E6BFF]/30 text-[#1E6BFF]">
                        P: {totals.proteinas.toFixed(1)}g
                      </Badge>
                      <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-400">
                        C: {totals.carboidratos.toFixed(1)}g
                      </Badge>
                      <Badge variant="outline" className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400">
                        G: {totals.gorduras.toFixed(1)}g
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {refeicao.alimentos.map((alimento: any, idx: number) => {
                      const substituicoes = buscarSubstituicoes(alimento.alimentoId)

                      return (
                        <div
                          key={idx}
                          className="p-4 border border-white/10 rounded-xl bg-black/20 hover:bg-black/40 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold text-base text-gray-100">{alimento.nome}</h4>
                                  <p className="text-sm text-[#1E6BFF] font-medium">
                                    {alimento.gramas}g
                                  </p>
                                </div>
                                <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                  {alimento.calorias} kcal
                                </Badge>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-[#1E6BFF]"></span>
                                  <span className="text-muted-foreground">P:</span>
                                  <span className="font-medium">{alimento.proteinas.toFixed(1)}g</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                  <span className="text-muted-foreground">C:</span>
                                  <span className="font-medium">{alimento.carboidratos.toFixed(1)}g</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                  <span className="text-muted-foreground">G:</span>
                                  <span className="font-medium">{alimento.gorduras.toFixed(1)}g</span>
                                </div>
                              </div>
                            </div>

                            {substituicoes.length > 0 && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs bg-[#1E6BFF]/20 border-[#1E6BFF]/30 text-[#1E6BFF] hover:bg-[#1E6BFF]/30">
                                    <RefreshCw className="w-3 h-3 mr-1" />
                                    Ver Substituições ({substituicoes.length})
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto glass-effect border-white/20">
                                  <DialogHeader>
                                    <DialogTitle className="text-lg text-neon">Substituições para {alimento.nome}</DialogTitle>
                                    <DialogDescription className="text-sm text-gray-400">
                                      Você pode substituir por qualquer um destes alimentos
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-3 mt-4">
                                    {substituicoes.map((sub: any) => {
                                      const macrosSub = {
                                        calorias: Math.round((sub.macrosPor100g.calorias * alimento.gramas) / 100),
                                        proteinas: ((sub.macrosPor100g.proteinas * alimento.gramas) / 100).toFixed(1),
                                        carboidratos: ((sub.macrosPor100g.carboidratos * alimento.gramas) / 100).toFixed(1),
                                        gorduras: ((sub.macrosPor100g.gorduras * alimento.gramas) / 100).toFixed(1)
                                      }

                                      return (
                                        <div
                                          key={sub.id}
                                          className="p-3 border border-white/10 rounded-lg bg-black/30 hover:bg-black/50 transition-colors"
                                        >
                                          <div className="flex items-start justify-between mb-2">
                                            <div>
                                              <p className="font-semibold text-sm text-gray-100">{sub.nome}</p>
                                              <p className="text-xs text-[#1E6BFF]">
                                                {alimento.gramas}g
                                              </p>
                                            </div>
                                            <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                                              {macrosSub.calorias} kcal
                                            </Badge>
                                          </div>
                                          <div className="grid grid-cols-3 gap-2 text-xs">
                                            <div>
                                              <span className="text-gray-400">P:</span>
                                              <span className="ml-1 font-medium text-[#1E6BFF]">{macrosSub.proteinas}g</span>
                                            </div>
                                            <div>
                                              <span className="text-gray-400">C:</span>
                                              <span className="ml-1 font-medium text-green-400">{macrosSub.carboidratos}g</span>
                                            </div>
                                            <div>
                                              <span className="text-gray-400">G:</span>
                                              <span className="ml-1 font-medium text-yellow-400">{macrosSub.gorduras}g</span>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </main>
</div>
  )
}
