#!/usr/bin/env bash
set -euo pipefail

echo "=============================="
echo "AUDIT | DASHBOARD + TREINO ATIVO"
echo "=============================="
echo

echo "==> (1) Rotas do /dashboard e guards"
rg -n --hidden --no-heading "path=\"/dashboard\"|/dashboard|DashboardPremium|ProtectedRoute" src/App.tsx src/components/ProtectedRoute.tsx || true
echo

echo "==> (2) Mostrar ProtectedRoute (topo)"
nl -ba src/components/ProtectedRoute.tsx | sed -n "1,220p" || true
echo

echo "==> (3) Mostrar DashboardPremium (topo)"
nl -ba src/pages/DashboardPremium.tsx | sed -n "1,260p" || true
echo

echo "==> (4) Onde está TreinoAtivo / PlanosAtivos e o que eles leem do state"
rg -n --hidden --no-heading "TreinoAtivo|PlanosAtivos|state\.treino|drmindsetfit_state|historicoCargas|treinos" src/pages/TreinoAtivo.tsx src/pages/PlanosAtivos.tsx src/contexts/DrMindSetfitContext.tsx || true
echo

echo "==> (5) Chaves de storage usadas (fonte da verdade do state)"
rg -n --hidden --no-heading "STORAGE_KEY|drmindsetfit_state|mindsetfit:onboardingProgress|onboardingCompleted|subscription" src | head -n 200 || true
echo

echo "==> (6) Mapa rápido de possíveis campos de treino no estado"
rg -n --hidden --no-heading "treino\?\.(treinos|plano|week|semana|protocolo|protocoloSemanal|treinoAtivo|treinosAtivos|agenda|planByDay|dias|historicoCargas)" src/contexts/DrMindSetfitContext.tsx src/pages/TreinoAtivo.tsx src/components/steps/Step5Treino.tsx || true
echo

echo "✅ AUDIT concluído."
