import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DrMindSetfitProvider } from '@/contexts/DrMindSetfitContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { ProtectedRoute } from '@/components/ProtectedRoute'

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
import { PlanosAtivos } from '@/pages/PlanosAtivos'
import Download from '@/pages/Download'
import { Report } from '@/pages/Report'
import { EditDiet } from '@/pages/EditDiet'

function App() {
  return (
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
            </Routes>
          </BrowserRouter>
          <Toaster />
        </DrMindSetfitProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
