/* MF_NEON_DS_V1 */
import DevEngine from "@/pages/DevEngine";
import * as React from "react";
import { LiveLocationPill } from "@/components/global/LiveLocationPill";
import Assinatura from "@/pages/Assinatura";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { OfflineIndicator } from "@/components/offline/OfflineIndicator";
import { DrMindSetfitProvider } from "@/contexts/DrMindSetfitContext";
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { maybeResetFromUrl } from "@/lib/resetApp";
import { ErrorBoundary } from "@/components/system/ErrorBoundary";

// Páginas Públicas
import { Login } from '@/pages/Login'
import { SignUp } from '@/pages/SignUp'
import { Pricing } from '@/pages/Pricing'

// Páginas Protegidas
import { OnboardingFlow } from '@/pages/OnboardingFlow'
import { DashboardPremium } from '@/pages/DashboardPremium'
import RouteGuard from "./features/fitness-suite/router/RouteGuard";
const MFPageLoader = () => (
  <div className="min-h-[40vh] flex items-center justify-center p-6 text-sm opacity-70 mf-app-bg mf-bg-neon">
    Carregando…
  </div>
);

const MFSuspense = ({ children }: { children: React.ReactNode }) => (
  <React.Suspense fallback={<MFPageLoader />}>{children}</React.Suspense>
);

// Lazy routes (heavy pages)
const LazyAIDashboardPage = React.lazy(() => import("@/pages/ai-dashboard/AIDashboardPage"));
const LazyWearablesPage = React.lazy(() => import("@/pages/wearables/WearablesPage"));
const LazyAchievementsPage = React.lazy(() => import("@/pages/gamification/AchievementsPage").then((m) => ({ default: m.AchievementsPage })));
const LazyConflictsPage = React.lazy(() => import("@/pages/offline/ConflictsPage").then((m) => ({ default: m.ConflictsPage })));
const LazyProgressPage = React.lazy(() => import("@/pages/progress/ProgressPage"));
const LazyWorkoutDetailsPage = React.lazy(() => import("@/pages/workout-details/WorkoutDetailsPage"));
const LazyLiveWorkoutPage = React.lazy(() => import("@/pages/live/LiveWorkoutPage"));

// MF_ROUTE_CODE_SPLIT_CORE_V1
const LazyFitnessSuiteDemo = React.lazy(() => import("./features/fitness-suite").then((m) => ({ default: m.FitnessSuiteDemo })));
const LazyRunning = React.lazy(() => import("@/pages/Running").then((m) => ({ default: m.Running })));
const LazyTreinoAtivo = React.lazy(() => import("@/pages/TreinoAtivo").then((m) => ({ default: m.TreinoAtivo })));
const LazyNutritionPlan = React.lazy(() => import("@/pages/NutritionPlan").then((m) => ({ default: m.NutritionPlan })));
const LazyPlanosAtivos = React.lazy(() => import("@/pages/PlanosAtivos").then((m) => ({ default: m.PlanosAtivos })));
const LazyDownload = React.lazy(() => import("@/pages/Download").then((m) => ({ default: m.default })));
const LazyReport = React.lazy(() => import("@/pages/Report").then((m) => ({ default: m.Report })));
const LazyEditDiet = React.lazy(() => import("@/pages/EditDiet").then((m) => ({ default: m.EditDiet })));
const LazyHistoryReports = React.lazy(() => import("./pages/HistoryReports").then((m) => ({ default: m.default })));
const LazyCardioPlan = React.lazy(() => import("@/pages/CardioPlan").then((m) => ({ default: m.CardioPlan })));
const LazyHiitPlan = React.lazy(() => import("@/pages/HiitPlan").then((m) => ({ default: m.default })));
const LazyCorridaPro = React.lazy(() => import("@/pages/CorridaPro").then((m) => ({ default: m.default })));
function App() {
    // MF_LIVEPILL_GUARD: GPS UI só nas telas de corrida (não pode bloquear onboarding)

// reset premium via URL: /?reset=soft | /?reset=hard
  React.useEffect(() => { maybeResetFromUrl(); }, []);

  const __suite = new URLSearchParams(window.location.search).get("suite") === "1";

  return __suite ? (<MFSuspense><LazyFitnessSuiteDemo /></MFSuspense>) : (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <DrMindSetfitProvider>
          <BrowserRouter>
            <RouteGuard />
  <OfflineIndicator />
  <LiveLocationPill />

<Routes>
              
              
              <Route path="/ai" element={<MFSuspense><LazyAIDashboardPage /></MFSuspense>} /><Route path="/wearables" element={<MFSuspense><LazyWearablesPage /></MFSuspense>} /><Route path="/planos" element={<Navigate to="/planos-ativos" replace />} />
              <Route path="/perfil" element={<Navigate to="/onboarding/step-1" replace />} />
              <Route path="/profile" element={<Navigate to="/onboarding/step-1" replace />} />
        
<Route path="/corrida-pro" element={<ProtectedRoute requiresPremium><MFSuspense><LazyCorridaPro /></MFSuspense></ProtectedRoute>} />
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
                    <MFSuspense><LazyRunning /></MFSuspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/treino"
                element={
                  <ProtectedRoute requiresPremium>
                    <MFSuspense><LazyTreinoAtivo /></MFSuspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/nutrition"
                element={
                  <ProtectedRoute requiresPremium>
                    <MFSuspense><LazyNutritionPlan /></MFSuspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cardio"
                element={
                  <ProtectedRoute requiresPremium>
                    <MFSuspense><LazyCardioPlan /></MFSuspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/hiit"
                element={
                  <ProtectedRoute requiresPremium>
                    <MFSuspense><LazyHiitPlan /></MFSuspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/planos-ativos"
                element={
                  <ProtectedRoute requiresPremium>
                    <MFSuspense><LazyPlanosAtivos /></MFSuspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report"
                element={
                  <ProtectedRoute requiresPremium>
                    <MFSuspense><LazyReport /></MFSuspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-diet"
                element={
                  <ProtectedRoute requiresPremium>
                    <MFSuspense><LazyEditDiet /></MFSuspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/history"
                element={
                  <ProtectedRoute requiresPremium>
                    <MFSuspense><LazyHistoryReports /></MFSuspense>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/download"
                element={
                  <ProtectedRoute>
                    <MFSuspense><LazyDownload /></MFSuspense>
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}<Route path="*" element={<Navigate to="/onboarding/step-1" replace />} />

  <Route path="/dev/engine" element={<DevEngine />} />
              <Route path="/achievements" element={<MFSuspense><LazyAchievementsPage /></MFSuspense>} />
              <Route path="/conflicts" element={<MFSuspense><LazyConflictsPage /></MFSuspense>} />
              <Route path="/progress" element={<MFSuspense><LazyProgressPage /></MFSuspense>} />
              <Route path="/workout/:id" element={<MFSuspense><LazyWorkoutDetailsPage /></MFSuspense>} />

        <Route path="/live-workout" element={<MFSuspense><LazyLiveWorkoutPage /></MFSuspense>} />
</Routes>
</BrowserRouter>
          <Toaster />
</DrMindSetfitProvider>
    </ThemeProvider>
  );
}

export default App

