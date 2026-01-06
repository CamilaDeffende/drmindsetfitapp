import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DrMindSetfitProvider } from '@/contexts/DrMindSetfitContext'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { OnboardingFlow } from '@/pages/OnboardingFlow'
import { DashboardPremium } from '@/pages/DashboardPremium'
import { Running } from '@/pages/Running'
import { TreinoAtivo } from '@/pages/TreinoAtivo'
import { NutritionPlan } from '@/pages/NutritionPlan'

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <DrMindSetfitProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<OnboardingFlow />} />
            <Route path="/dashboard" element={<DashboardPremium />} />
            <Route path="/running" element={<Running />} />
            <Route path="/treino" element={<TreinoAtivo />} />
            <Route path="/nutrition" element={<NutritionPlan />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </DrMindSetfitProvider>
    </ThemeProvider>
  )
}

export default App
