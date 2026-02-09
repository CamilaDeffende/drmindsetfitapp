import DevEngine from "@/pages/DevEngine";
import * as React from "react";
import { LiveLocationPill } from "@/components/global/LiveLocationPill";
import Assinatura from "@/pages/Assinatura";
import HistoryReports from "./pages/HistoryReports";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AIDashboardPage from "@/pages/ai-dashboard/AIDashboardPage";
import { AchievementsPage } from "@/pages/gamification/AchievementsPage";
import { ConflictsPage } from "@/pages/offline/ConflictsPage";
import { WearablesPage } from "@/pages/wearables/WearablesPage";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import { DrMindSetfitProvider } from "@/contexts/DrMindSetfitContext";
;
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { FitnessSuiteDemo } from "./features/fitness-suite";
import { maybeResetFromUrl } from "@/lib/resetApp";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";

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
import RouteGuard from "./features/fitness-suite/router/RouteGuard";
import { CardioPlan } from '@/pages/CardioPlan'
import HiitPlan from "@/pages/HiitPlan";
import CorridaPro from "@/pages/CorridaPro";
import ProgressPage from "@/pages/progress/ProgressPage";
function App() {
    // MF_LIVEPILL_GUARD: GPS UI só nas telas de corrida (não pode bloquear onboarding)

// reset premium via URL: /?reset=soft | /?reset=hard
  React.useEffect(() => { maybeResetFromUrl(); }, []);

  const __suite = new URLSearchParams(window.location.search).get("suite") === "1";

  return __suite ? (
    <FitnessSuiteDemo />
  ) : (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <DrMindSetfitProvider>
          <BrowserRouter>
            <RouteGuard />
            <Routes>
              
              
              <Route path="/ai" element={<AIDashboardPage />} /><Route path="/wearables" element={<WearablesPage />} /><Route path="/planos" element={<Navigate to="/planos-ativos" replace />} />
              <Route path="/perfil" element={<Navigate to="/onboarding/step-1" replace />} />
              <Route path="/profile" element={<Navigate to="/onboarding/step-1" replace />} />
        
<Route path="/corrida-pro" element={<ProtectedRoute requiresPremium><CorridaPro /></ProtectedRoute>} />
              {/* INÍCIO OBRIGATÓRIO DO FUNIL */}
              <Route path="/" element={<Navigate to="/onboarding/step-1" replace />} />

              {/* Públicas */}
              <Route path="/assinatura" element={<Assinatura />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/pricing" element={<Pricing />} />

              {/* Onboarding (Premium) — etapas 1..8 */}
              <Route
                path="/onboarding/*"
                element={
                  <OnboardingFlow />
                  }
              />

              {/* Onboarding — rota por step (necessário p/ URL avançar e useParams.step existir) */}
              <Route
                path="/onboarding/step-:step"
                element={
                  <OnboardingFlow />
                  }
              />

              {/* Onboarding — rota por step */}
              {/* Dashboard (após onboarding completo) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <ErrorBoundary name="DashboardPremium"><DashboardPremium /></ErrorBoundary>
                  </ProtectedRoute>
                }
              />

              {/* Premium */}
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
                path="/cardio"
                element={
                  <ProtectedRoute requiresPremium>
                    <CardioPlan />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hiit"
                element={
                  <ProtectedRoute requiresPremium>
                    <HiitPlan />
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
                path="/history"
                element={
                  <ProtectedRoute requiresPremium>
                    <HistoryReports />
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

              {/* Fallback */}<Route path="*" element={<Navigate to="/onboarding/step-1" replace />} />

  <Route path="/dev/engine" element={<DevEngine />} />
              <Route path="/achievements" element={<AchievementsPage />} />
              <Route path="/conflicts" element={<ConflictsPage />} />
              <Route path="/progress" element={<ProgressPage />} />

            <OfflineIndicator />
            <LiveLocationPill />
          
  </Routes>
</BrowserRouter>
          <Toaster />
</DrMindSetfitProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App

