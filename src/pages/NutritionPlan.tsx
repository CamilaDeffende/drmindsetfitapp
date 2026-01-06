import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Home, RefreshCw, Edit } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { buscarSubstituicoes } from '@/types/alimentos'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function NutritionPlan() {
  const { state } = useDrMindSetfit()
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
      </div>
    )
  }

  const { nutricao } = state

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
              {nutricao.refeicoes.length} refeições • {nutricao.macros.calorias} kcal/dia
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/edit-diet')} className="glow-green">
              <Edit className="w-4 h-4 mr-2" />
              Editar Dieta
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')} className="glow-blue">
              <Home className="w-5 h-5 text-blue-400" />
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
                <p className="text-3xl font-bold text-green-400">{nutricao.macros.calorias}</p>
                <p className="text-xs text-gray-500">kcal</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-xl border border-blue-500/30">
                <p className="text-xs text-gray-400 mb-1">Proteína</p>
                <p className="text-3xl font-bold text-blue-400">{nutricao.macros.proteina}</p>
                <p className="text-xs text-gray-500">gramas</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 rounded-xl border border-yellow-500/30">
                <p className="text-xs text-gray-400 mb-1">Gorduras</p>
                <p className="text-3xl font-bold text-yellow-400">{nutricao.macros.gorduras}</p>
                <p className="text-xs text-gray-500">gramas</p>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-xl border border-purple-500/30">
                <p className="text-xs text-gray-400 mb-1">Carboidratos</p>
                <p className="text-3xl font-bold text-purple-400">{nutricao.macros.carboidratos}</p>
                <p className="text-xs text-gray-500">gramas</p>
              </div>
            </div>

            {nutricao.restricoes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-gray-400 mb-2">Restrições ativas:</p>
                <div className="flex flex-wrap gap-2">
                  {nutricao.restricoes.map(rest => (
                    <Badge key={rest} variant="outline" className="text-xs border-red-500/50 text-red-400">
                      {rest}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refeições */}
        <div className="space-y-4">
          {nutricao.refeicoes.map((refeicao, index) => {
            const totalCalorias = refeicao.alimentos.reduce((acc, a) => acc + a.calorias, 0)
            const totalProteinas = refeicao.alimentos.reduce((acc, a) => acc + a.proteinas, 0)
            const totalCarbs = refeicao.alimentos.reduce((acc, a) => acc + a.carboidratos, 0)
            const totalGorduras = refeicao.alimentos.reduce((acc, a) => acc + a.gorduras, 0)

            return (
              <Card key={index} className="glass-effect border-white/10">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <CardTitle className="text-xl text-gray-100">{refeicao.nome}</CardTitle>
                      <CardDescription className="text-sm text-gray-400">
                        {refeicao.horario} • {totalCalorias} kcal
                      </CardDescription>
                    </div>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="outline" className="bg-blue-500/20 border-blue-500/30 text-blue-400">
                        P: {totalProteinas.toFixed(1)}g
                      </Badge>
                      <Badge variant="outline" className="bg-green-500/20 border-green-500/30 text-green-400">
                        C: {totalCarbs.toFixed(1)}g
                      </Badge>
                      <Badge variant="outline" className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400">
                        G: {totalGorduras.toFixed(1)}g
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {refeicao.alimentos.map((alimento, idx) => {
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
                                  <p className="text-sm text-blue-400 font-medium">
                                    {alimento.gramas}g
                                  </p>
                                </div>
                                <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                  {alimento.calorias} kcal
                                </Badge>
                              </div>

                              <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
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
                                  <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs bg-blue-500/20 border-blue-500/30 text-blue-400 hover:bg-blue-500/30">
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
                                    {substituicoes.map(sub => {
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
                                              <p className="text-xs text-blue-400">
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
                                              <span className="ml-1 font-medium text-blue-400">{macrosSub.proteinas}g</span>
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
