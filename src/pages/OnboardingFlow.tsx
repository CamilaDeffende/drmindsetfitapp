import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { Step1Perfil } from "@/components/steps/Step1Perfil";
import { Step2Avaliacao } from "@/components/steps/Step2Avaliacao";
import { Step3Metabolismo } from "@/components/steps/Step3Metabolismo";
import { Step4Nutricao } from "@/components/steps/Step4Nutricao";
import { Step5Treino } from "@/components/steps/Step5Treino";
import { Step7Acompanhamento } from "@/components/steps/Step7Acompanhamento";
import { Step8Relatorio } from "@/components/steps/Step8Relatorio";
import { OnboardingCarouselShell } from "@/components/onboarding/OnboardingCarouselShell";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo } from "react";

// ONBOARDING_FLOW_STABLE_V1
export function OnboardingFlow() {
  const { state, updateState, nextStep, prevStep } = useDrMindSetfit();
  const navigate = useNavigate();

  // reset rápido: ?reset=1
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("reset") === "1") {
        localStorage.removeItem("drmindsetfit_state");
        q.delete("reset");
        const next = window.location.pathname + (q.toString() ? `?${q.toString()}` : "") + window.location.hash;
        window.history.replaceState({}, "", next);
        window.location.reload();
      }
    } catch {}
  }, []);

  const steps = useMemo(() => (
    [
      { key: "perfil", title: "Perfil", allowSkip: false, content: <Step1Perfil /> },
      { key: "avaliacao", title: "Avaliação", allowSkip: true, content: <Step2Avaliacao /> },
      { key: "metabolismo", title: "Metabolismo", allowSkip: true, content: <Step3Metabolismo /> },
      { key: "treino", title: "Treino", allowSkip: true, content: <Step5Treino /> },
      { key: "nutricao", title: "Nutrição", allowSkip: true, content: <Step4Nutricao /> },
{ key: "acomp", title: "Acompanhamento", allowSkip: true, content: <Step7Acompanhamento /> },
      { key: "revisao", title: "Revisão", allowSkip: false, content: <Step8Relatorio /> }
]
  ), []);

  const currentIndex = Math.max(0, Math.min(steps.length - 1, (state.etapaAtual ?? 1) - 1));

  const handleNext = () => {
    // O avanço real é via contexto (evita duplicar lógica e evita travar).
    const step = state.etapaAtual ?? 1;
    if (step >= 8) {
      updateState({ concluido: true, etapaAtual: 8 });
      navigate("/report");
      return;
    }
    nextStep();
  };

  return (
    <OnboardingCarouselShell
      steps={steps}
      currentIndex={currentIndex}
      onIndexChange={(idx) => updateState({ etapaAtual: idx + 1 })}
      onNext={handleNext}
      onBack={() => {
        if ((state.etapaAtual ?? 1) > 1) prevStep();
        else navigate(-1);
      }}
      onSkip={() => nextStep()}
      microcopy="Leva ~2 minutos. Preencha o essencial para gerar seu treino, dieta e relatório final."
    />
  );
}
