import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Home, Calendar, Download } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { DietaAtivaView } from '@/components/planos/DietaAtivaView'
import { TreinoAtivoView } from '@/components/planos/TreinoAtivoView'
import { useEffect } from 'react'
import type { DietaAtiva, TreinoAtivo } from '@/types'

export function PlanosAtivos() {
  const { state, updateState } = useDrMindSetfit()
  const navigate = useNavigate()

  const exportarPDF = async () => {
    try {
      const { exportarPDFCompleto } = await import('@/lib/exportar-pdf')
      await exportarPDFCompleto(state, 0, 0, 0)
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      alert('Erro ao gerar PDF. Tente novamente.')
    }
  }

  // Inicializar planos ativos na primeira renderização (se ainda não existirem)
  useEffect(() => {
    // Criar dieta ativa se ainda não existir
    if (state.nutricao && !state.dietaAtiva) {
      const hoje = new Date()
      const dataInicio = hoje.toISOString().split('T')[0]
      const dataFim = new Date(hoje.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +4 semanas

      const dietaAtiva: DietaAtiva = {
        dataInicio,
        dataFim,
        duracaoSemanas: 4,
        estrategia: 'Dieta 4 semanas',
        nutricao: state.nutricao
      }

      updateState({ dietaAtiva })
    }

    // Criar treino ativo se ainda não existir
    if (state.treino && !state.treinoAtivo) {
      const hoje = new Date()
      const dataInicio = hoje.toISOString().split('T')[0]
      const dataFim = new Date(hoje.getTime() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // +4 semanas

      const treinoAtivo: TreinoAtivo = {
        dataInicio,
        dataFim,
        duracaoSemanas: 4,
        estrategia: 'Treino 4 semanas',
        treino: state.treino,
        cargasPorSerie: []
      }

      updateState({ treinoAtivo })
    }
  }, [state.nutricao, state.treino, state.dietaAtiva, state.treinoAtivo, updateState])

  if (!state.concluido) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="w-full max-w-md mx-4 glass-effect neon-border">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-neon mb-4">Complete seu Perfil</h2>
            <p className="text-gray-400 mb-6">Inicie o questionário para desbloquear seus planos</p>
            <Button onClick={() => navigate('/')} className="w-full glow-blue">
              Iniciar Agora
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const temDieta = !!state.dietaAtiva
  const temTreino = !!state.treinoAtivo

  if (!temDieta && !temTreino) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Card className="w-full max-w-md mx-4 glass-effect neon-border">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-neon mb-4">Nenhum Plano Ativo</h2>
            <p className="text-gray-400 mb-6">Configure seus planos de dieta e treino primeiro</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full glow-blue">
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-green-950/20 to-black text-white">
      {/* Header Premium com Verde Neon */}
      <header className="sticky top-0 z-50 glass-effect border-b border-green-500/30 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                Planos Ativos
              </h1>
              <p className="text-xs text-gray-400 flex items-center gap-2 mt-1">
                <Calendar className="w-3 h-3" />
                Acompanhe sua dieta e treino
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={exportarPDF}
                className="hover:bg-green-500/20"
                title="Exportar PDF completo"
              >
                <Download className="w-5 h-5 text-green-400" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="hover:bg-green-500/20"
              >
                <Home className="w-5 h-5 text-green-400" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Container com efeito verde neon */}
        <div className="relative">
          {/* Glow verde de fundo */}
          <div className="absolute inset-0 bg-green-500/5 rounded-3xl blur-3xl" />

          {/* Card principal */}
          <Card className="relative glass-effect border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.15)]">
            <CardContent className="p-6">
              <Tabs defaultValue={temDieta ? 'dieta' : 'treino'} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-black/40 border border-green-500/20">
                  {temDieta && (
                    <TabsTrigger
                      value="dieta"
                      className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 data-[state=active]:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    >
                      Dieta Ativa
                    </TabsTrigger>
                  )}
                  {temTreino && (
                    <TabsTrigger
                      value="treino"
                      className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 data-[state=active]:shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                    >
                      Treino Ativo
                    </TabsTrigger>
                  )}
                </TabsList>

                {temDieta && (
                  <TabsContent value="dieta" className="mt-0">
                    <DietaAtivaView dietaAtiva={state.dietaAtiva!} />
                  </TabsContent>
                )}

                {temTreino && (
                  <TabsContent value="treino" className="mt-0">
                    <TreinoAtivoView treinoAtivo={state.treinoAtivo!} />
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
