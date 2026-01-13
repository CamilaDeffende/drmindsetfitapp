import Assinatura from "@/pages/Assinatura";
import HistoryReports from "./pages/HistoryReports";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DrMindSetfitProvider } from '@/contexts/DrMindSetfitContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { FitnessSuiteDemo } from "./features/fitness-suite";

// Páginas Públicas
import { Login } from '@/pages/Login'
import { SignUp } from '@/pages/SignUp'
import { Pricing } from '@/pages/Pricing'

// Páginas Protegidas
import { OnboardingFlow } from '@/pages/OnboardingFlow'
import { DashboardPremium } from '@/pages/DashboardPremium'
import { Running } from '@/pages/Running'
import { TreinoAtivo } from '@/pages/TreinoAtivo'
import { NutritionPlan } from '@/pages/NutritionPlan'
import { CardioPlan } from '@/pages/CardioPlan'
import { PlanosAtivos } from '@/pages/PlanosAtivos'
import Download from '@/pages/Download'
import { Report } from '@/pages/Report'
import { EditDiet } from '@/pages/EditDiet'
import HiitPlan from "@/pages/HiitPlan";
// RESET_STORAGE_QUERY_SYNC: limpa estado salvo via ?reset=1 ANTES do Provider montar (sem loop)
try {
  const qs = new URLSearchParams(window.location.search);
  if (qs.get('reset') === '1') {
    // evita loop/reexecução constante
    if (sessionStorage.getItem('drmindsetfit_reset_done') !== '1') {
      sessionStorage.setItem('drmindsetfit_reset_done', '1');
      localStorage.removeItem('drmindsetfit_state');
    }
    // remove query e garante entrada limpa no onboarding
    window.history.replaceState({}, '', '/');
  }
} catch { /* noop */ }


function App() {
  const __suite = new URLSearchParams(window.location.search).get("suite") === "1";

  return __suite ? <FitnessSuiteDemo /> : (
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <DrMindSetfitProvider>
          <BrowserRouter>
            <Routes>
              {/* Rotas Públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/pricing" element={<Pricing />} />

              {/* Rotas Protegidas - Requer Login */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <OnboardingFlow />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPremium />
                  </ProtectedRoute>
                }
              />

              {/* Rotas Premium - Requer Assinatura */}
              <Route
                path="/running"
                element={
                  <ProtectedRoute requiresPremium>
                    <Running />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/treino"
                element={
                  <ProtectedRoute requiresPremium>
                    <TreinoAtivo />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nutrition"
                element={
                  <ProtectedRoute requiresPremium>
                    <NutritionPlan />
            <Route path="/cardio" element={<CardioPlan />} />
<Route path="/hiit" element={<HiitPlan />} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/planos-ativos"
                element={
                  <ProtectedRoute requiresPremium>
                    <PlanosAtivos />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <ProtectedRoute requiresPremium>
                    <Report />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-diet"
                element={
                  <ProtectedRoute requiresPremium>
                    <EditDiet />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/download"
                element={
                  <ProtectedRoute>
                    <Download />
                  </ProtectedRoute>
                }
              />

              {/* Redirect padrão */}
              <Route path="*" element={<Navigate to="/login" replace />} />
              <Route path="/history" element={<HistoryReports />} />
  <Route path="/assinatura" element={<Assinatura />} />
</Routes>
          </BrowserRouter>
          <Toaster />
        </DrMindSetfitProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
