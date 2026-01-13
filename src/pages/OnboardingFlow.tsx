import { useDrMindSetfit } from '@/contexts/DrMindSetfitContext'
import { Step1Perfil } from '@/components/steps/Step1Perfil'
import { Step2Avaliacao } from '@/components/steps/Step2Avaliacao'
import { Step3Metabolismo } from '@/components/steps/Step3Metabolismo'
import { Step4Nutricao } from '@/components/steps/Step4Nutricao'
import { Step5Treino } from '@/components/steps/Step5Treino'
import { Step6Saude } from '@/components/steps/Step6Saude'
import { Step7Acompanhamento } from '@/components/steps/Step7Acompanhamento'
import { Step8Relatorio } from '@/components/steps/Step8Relatorio'
import { OnboardingCarouselShell } from '@/components/onboarding/OnboardingCarouselShell'
import { useNavigate } from 'react-router-dom'
import { useEffect, useMemo } from 'react'

export function OnboardingFlow() {
  // reset rápido: adicione ?reset=1 na URL para limpar o onboarding

  const { state, updateState, nextStep, prevStep } = useDrMindSetfit()
  const navigate = useNavigate()

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get('reset') === '1') {
        localStorage.removeItem('drmindsetfit_state');
        q.delete('reset');
        const next = window.location.pathname + (q.toString() ? `?${q.toString()}` : '') + window.location.hash;
        window.history.replaceState({}, '', next);
        window.location.reload();
      }
    } catch {}
  }, [])


  // Redirecionar para dashboard se já completou
  useEffect(() => {
    if (
      state.concluido &&
      (state.treino?.treinos?.length ?? 0) > 0 &&
      (state.nutricao?.refeicoes?.length ?? 0) > 0
    ) {
      /* navigate('/dashboard') */
    }
  }, [state.concluido, state.treino?.treinos?.length, state.nutricao?.refeicoes?.length, navigate])

  const steps = useMemo(() => {
    return [
      { key: 'perfil', title: 'Perfil', allowSkip: false, content: <Step1Perfil /> },
      { key: 'avaliacao', title: 'Avaliação', allowSkip: true, content: <Step2Avaliacao /> },
      { key: 'metabolismo', title: 'Metabolismo', allowSkip: true, content: <Step3Metabolismo /> },
      { key: 'nutricao', title: 'Nutrição', allowSkip: true, content: <Step4Nutricao /> },
      { key: 'treino', title: 'Treino', allowSkip: true, content: <Step5Treino /> },
      { key: 'saude', title: 'Saúde', allowSkip: true, content: <Step6Saude /> },
      { key: 'acomp', title: 'Acompanhamento', allowSkip: true, content: <Step7Acompanhamento /> },
      { key: 'revisao', title: 'Revisão', allowSkip: false, content: <Step8Relatorio /> },
    ]
  }, [])

  const currentIndex = Math.max(0, Math.min(steps.length - 1, (state.etapaAtual ?? 1) - 1))

  return (
    <OnboardingCarouselShell
      steps={steps}
      currentIndex={currentIndex}
      onIndexChange={(idx) => updateState({ etapaAtual: idx + 1 })}
      onBack={() => {
        if ((state.etapaAtual ?? 1) > 1) prevStep()
        else navigate(-1)
      }}
      onNext={() => nextStep()}
      onSkip={() => nextStep()}
      microcopy="Isso alimenta seu plano e relatório."
    />
  )
}
