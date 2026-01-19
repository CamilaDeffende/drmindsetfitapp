import * as React from "react";
import Assinatura from "@/pages/Assinatura";
import HistoryReports from "./pages/HistoryReports";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { DrMindSetfitProvider } from '@/contexts/DrMindSetfitContext'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { FitnessSuiteDemo } from "./features/fitness-suite";
import { maybeResetFromUrl } from "@/lib/resetApp";

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

// RESET_STORAGE_QUERY_SYNC: limpa estado salvo via ?reset=1 ANTES do Provider montar (sem loop)
try {
  const qs = new URLSearchParams(window.location.search);
  if (qs.get('reset') === '1') {
    // evita loop/reexecução constante
    // Reset CONTROLADO (somente quando você pedir):
// Abra: http://localhost:8080/#/?reset=1
try {
  const href = String(window.location.href || "");
  const wantsReset = href.includes("reset=1");
  if (wantsReset) {
    localStorage.removeItem("drmindsetfit_state");
    // também limpa flags conhecidas (se existirem)
    localStorage.removeItem("mindsetfit:isSubscribed");
    localStorage.removeItem("mindsetfit:onboardingCompleted");
    // remove o reset=1 da URL (mantém o hash)
    const cleaned = href.replace(/([?&])reset=1(&?)/, (_m, a, b) => (a === "?" && b ? "?" : a === "?" ? "" : b ? "&" : ""));
    window.history.replaceState({}, "", cleaned);
  }
} catch {}
// remove query e garante entrada limpa no onboarding
    window.history.replaceState({}, '', '/');
  }
} catch { /* noop */ }

function App() {
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
              {/* INÍCIO OBRIGATÓRIO DO FUNIL */}
              <Route path="/" element={<Navigate to="/login" replace />} />

              {/* Públicas */}
              <Route path="/assinatura" element={<Assinatura />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/pricing" element={<Pricing />} />

              {/* Onboarding (Premium) — etapas 1..8 */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute requiresPremium>
                    <OnboardingFlow />
                  </ProtectedRoute>
                }
              />

              {/* Dashboard (após onboarding completo) */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPremium />
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

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </DrMindSetfitProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App

