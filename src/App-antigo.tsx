import { DrMindSetfitProvider, useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { StepIndicator } from '@/components/StepIndicator'
import { Step1Perfil } from '@/components/steps/Step1Perfil'
import { Step2Avaliacao } from '@/components/steps/Step2Avaliacao'
import { Step3Metabolismo } from '@/components/steps/Step3Metabolismo'
import { Step4Nutricao } from '@/components/steps/Step4Nutricao'
import { Step5Treino } from '@/components/steps/Step5Treino'
import { Step6Saude } from '@/components/steps/Step6Saude'
import { Step7Acompanhamento } from '@/components/steps/Step7Acompanhamento'
import { Step8Relatorio } from '@/components/steps/Step8Relatorio'
import { Button } from '@/components/ui/button'
import { Moon, Sun, Save } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Badge } from '@/components/ui/badge'

function AppContent() {
  const { state } = useDrMindSetfit()
  const { theme, setTheme } = useTheme()

  const renderStep = () => {
    switch (state.etapaAtual) {
      case 1:
        return <Step1Perfil />
      case 2:
        return <Step2Avaliacao />
      case 3:
        return <Step3Metabolismo />
      case 4:
        return <Step4Nutricao />
      case 5:
        return <Step5Treino />
      case 6:
        return <Step6Saude />
      case 7:
        return <Step7Acompanhamento />
      case 8:
        return <Step8Relatorio />
      default:
        return <Step1Perfil />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] bg-clip-text text-transparent hover:from-[#1E6BFF] hover:via-[#00B7FF] hover:to-[#00B7FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B7FF] focus-visible:ring-offset-2 focus-visible:ring-offset-black/0">
              DrMindSetfit
            </h1>
            <p className="text-xs text-muted-foreground">
              Sistema Inteligente de Saúde, Performance e Longevidade
            </p>
          </div>

          <div className="flex items-center gap-3">
            {state.etapaAtual > 1 && (
              <Badge variant="outline" className="gap-1.5">
                <Save className="w-3 h-3" />
                Progresso salvo
              </Badge>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <StepIndicator currentStep={state.etapaAtual} totalSteps={8} />

      {/* Main Content */}
      <main className="pb-12">
        {renderStep()}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>DrMindSetfit - O maior app de saúde e performance do mundo</p>
          <p className="mt-1">
            Decisões baseadas em ciência • Personalização inteligente • Sem login, sem cadastro
          </p>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <DrMindSetfitProvider>
      <AppContent />
    </DrMindSetfitProvider>
  )
}

export default App
