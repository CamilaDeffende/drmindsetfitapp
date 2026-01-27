// REGRA_FIXA_NO_HEALTH_CONTEXT_STEP: nunca criar etapa de Segurança/Contexto de saúde/Sinais do corpo.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";

// Steps 1–4 (legado do app): export NAMED (sem props no BLOCO C para não quebrar)
import { Step1Perfil } from "@/components/steps/Step1Perfil";
import { Step2Avaliacao } from "@/components/steps/Step2Avaliacao";
import { Step3Metabolismo } from "@/components/steps/Step3Metabolismo";
import { Step4Nutricao } from "@/components/steps/Step4Nutricao";

// Steps 5–8 (novos): default export com props (draft real)
import Step5Modalidades from "@/components/steps/Step5Modalidades";
import Step6DiasSemana from "@/components/steps/Step6DiasSemana";
import Step7Preferencias from "@/components/steps/Step7Preferencias";
import Step8Confirmacao from "@/components/steps/Step8Confirmacao";

type Draft = {
  activeIndex?: number;
  step5?: any;
  step6?: any;
  step7?: any;
};

const LS_KEY = "mf:onboarding:draft:v1";

function loadDraft(): Draft {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Draft) : {};
  } catch {
    return {};
  }
}

function saveDraft(d: Draft) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(d));
  } catch {}
}

// ✅ Export NAMED (App.tsx importa { OnboardingFlow })
export function OnboardingFlow() {
  const nav = useNavigate();
  const { appReady } = useApp();

  // Hooks sempre no topo (rules-of-hooks)
  const [draft, setDraft] = useState<Draft>(() => loadDraft());
  const [active, setActive] = useState<number>(() => {
    const i = Number(loadDraft()?.activeIndex ?? 0);
    return Number.isFinite(i) ? i : 0;
  });

  useEffect(() => {
    saveDraft({ ...draft, activeIndex: active });
  }, [draft, active]);

  const goNext = () => setActive((x) => Math.min(x + 1, 7));
  const goBack = () => setActive((x) => Math.max(x - 1, 0));

  // Gate depois dos hooks
  if (!appReady) return null;

  const steps = [
      {
        key: "step1",
        title: "Objetivo e Perfil",
        render: () => <Step1Perfil />,
      },
      {
        key: "step2",
        title: "Dados corporais",
        render: () => <Step2Avaliacao />,
      },
      {
        key: "step3",
        title: "Nível de atividade",
        render: () => <Step3Metabolismo />,
      },
      {
        key: "step4",
        title: "Nutrição",
        render: () => <Step4Nutricao />,
      },
      {
        key: "step5",
        title: "Modalidades",
        render: () => (
          <Step5Modalidades
            value={draft.step5 || { primary: null, secondary: null }}
            onChange={(v: any) => setDraft((d) => ({ ...d, step5: v }))}
            onNext={goNext}
            onBack={goBack}
          />
        ),
      },
      {
        key: "step6",
        title: "Dias da semana",
        render: () => (
          <Step6DiasSemana
            value={draft.step6 || { days: [] }}
            onChange={(v: any) => setDraft((d) => ({ ...d, step6: v }))}
            onNext={goNext}
            onBack={goBack}
          />
        ),
      },
      {
        key: "step7",
        title: "Preferências",
        render: () => (
          <Step7Preferencias
            value={draft.step7 || { dieta: "flexivel" }}
            onChange={(v: any) => setDraft((d) => ({ ...d, step7: v }))}
            onNext={goNext}
            onBack={goBack}
          />
        ),
      },
      {
        key: "step8",
        title: "Confirmação",
        render: () => (
          <Step8Confirmacao
            summary={draft}
            onBack={goBack}
            onConfirm={() => {
              try { localStorage.setItem("mf:onboarding:done:v1", "1"); } catch {}
              try { localStorage.removeItem(LS_KEY); } catch {}
              nav("/dashboard");
            }}
          />
        ),
      },
    ] as const;


  const current = steps[active];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs opacity-70">Onboarding</div>
          <h1 className="text-xl font-semibold">{current?.title || "Onboarding"}</h1>
        </div>
        <div className="text-sm opacity-70">
          {active + 1}/8
        </div>
      </div>

      <div className="mt-3 h-2 w-full rounded-full bg-white/5 border border-white/10 overflow-hidden">
        <div
          className="h-full bg-white/20"
          style={{ width: `${((active + 1) / 8) * 100}%` }}
        />
      </div>

      <div className="mt-6">
        {current?.render()}
      </div>

      {/* Navegação mínima para Steps 1–4 (legado) se eles não tiverem botões próprios */}
      {active <= 3 ? (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={goBack}
            className="px-4 py-2 rounded-xl border border-white/10 text-sm opacity-90 hover:opacity-100"
          >
            Voltar
          </button>
          <button
            type="button"
            onClick={goNext}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15"
          >
            Continuar
          </button>
        </div>
      ) : null}
    </div>
  );
}

// ✅ manter default export também (conveniência)
export default OnboardingFlow;
