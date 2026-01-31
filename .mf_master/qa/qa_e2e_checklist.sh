#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

LOG=".mf_master/qa/e2e_$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "$LOG") 2>&1

echo "============================================================"
echo "🧪 QA E2E CHECKLIST — DrMindSetFitApp"
echo "Log: $LOG"
echo "============================================================"
echo
echo "REGRAS:"
echo "- Não faça correções durante o QA."
echo "- Se algo falhar: anote o passo e pare."
echo "- Depois do QA: voltamos com patch cirúrgico + mf_doctor."
echo

step () { echo; echo "------------------------------"; echo "✅ PASSO $1"; echo "------------------------------"; }
pause () { echo; read -r -p "Aperte ENTER quando concluir este passo... " _; }

step "0 | Preparar ambiente"
echo "1) Garanta que o app está rodando em http://localhost:8080"
echo "   (se não estiver) rode em outro terminal: ./.mf_master/bin/mfdev"
echo "2) Abra o DevTools (Console + Network)"
pause 0

step "1 | Login"
echo "Ações:"
echo "- Abra /login"
echo "- Faça login"
echo "Critérios:"
echo "- Sem erro no Console"
echo "- Navega para /dashboard"
pause 1

step "2 | Dashboard (EmptyState / Plano)"
echo "Ações:"
echo "- Em /dashboard, valide:"
echo "  • EmptyState premium quando não há plano"
echo "  • Botões: iniciar onboarding / planos ativos / treino ativo (se aplicável)"
echo "Critérios:"
echo "- Sem crash"
echo "- Layout premium ok"
pause 2

step "3 | Reset de onboarding (importante)"
echo "Ações (escolha uma):"
echo "A) Se existir botão no app: reset onboarding"
echo "B) Senão: Application > Local Storage > limpar keys do app (somente do domínio localhost)"
echo "Critérios:"
echo "- Usuário volta para Step1 quando iniciar onboarding"
pause 3

step "4 | Onboarding Step1 → Step2"
echo "Ações:"
echo "- Inicie onboarding"
echo "- Preencha Step1 e avance para Step2"
echo "Critérios:"
echo "- Avança sem warnings de TS/React"
echo "- Recarregar (F5) mantém dados preenchidos"
pause 4

step "5 | Step2 → Step3 (Metabolismo)"
echo "Ações:"
echo "- Preencha Step2"
echo "- Avance para Step3"
echo "Critérios:"
echo "- Step3 carrega PAL/biotipo canônico do Step2"
echo "- Warning premium aparece somente em incoerência (ex: alta frequência x pal sedentário)"
pause 5

step "6 | Step3 → Step4 (Nutrição) — CRÍTICO"
echo "Ações:"
echo "- Em Step3, avance para Step4"
echo "- Em Step4, acione gerarPlanejamento()"
echo "Critérios:"
echo "- NUNCA navegar para Step5 sem gerarPlanejamento()"
echo "- Persistência antes do avanço (se recarregar, plano continua lá)"
pause 6

step "7 | Step4 → Step5 (CRÍTICO)"
echo "Ações:"
echo "- Avance Step4 → Step5"
echo "Critérios:"
echo "- Sem pulo indevido"
echo "- Sem estado vazio"
pause 7

step "8 | Step5 → Step8 (comportamento geral)"
echo "Ações:"
echo "- Complete Step5/6/7/8"
echo "Critérios:"
echo "- Back/forward funciona"
echo "- Refresh não quebra"
pause 8

step "9 | Fim do onboarding → Dashboard"
echo "Ações:"
echo "- Finalize Step8"
echo "- Verifique redirecionamento para /dashboard"
echo "Critérios:"
echo "- Plano ativo visível (se aplicável)"
echo "- Botões funcionam"
pause 9

echo
echo "============================================================"
echo "✅ QA E2E FINALIZADO"
echo "Log salvo em: $LOG"
echo "============================================================"
