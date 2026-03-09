// MF_ONBOARDING_NEXTBACK_CONTRACT_V1
// MF_ONBOARDING_WATCHDOG_UNUSED_SILENCE_V1
// MF_APPREADY_GATE_DEV_BYPASS_V1
// MF_ONBOARDING_LOADER_WATCHDOG_V2
// REGRA_FIXA_NO_HEALTH_CONTEXT_STEP: nunca criar etapa de Segurança/Contexto de saúde/Sinais do corpo.

import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { buildActivePlanFromDraft, saveActivePlan } from "@/services/plan.service";
import { useApp } from "@/contexts/AppContext";
import { migrateLegacyToSSOT } from "@/services/activePlan.bridge";
import { loadOnboardingProgress, saveOnboardingProgress } from "@/lib/onboardingProgress";
import { guardOnboardingPath } from "@/lib/onboardingGuard";
import { BrandIcon } from "@/components/branding/BrandIcon";

import { Step1Perfil } from "@/components/steps/Step1Perfil";
import Step2Avaliacao from "@/components/steps/Step2Avaliacao";
import Step3Metabolismo from "@/components/steps/Step3Metabolismo";
import { Step4Nutricao } from "@/components/steps/Step4Nutricao";

import Step5Modalidades from "@/components/steps/Step5Modalidades";
import Step6DiasSemana from "@/components/steps/Step6DiasSemana";
import Step7Preferencias from "@/components/steps/Step7Preferencias";
import Step8Confirmacao from "@/components/steps/Step8Confirmacao";

// MF_ONBOARDING_SSOT_BRIDGE_V1
import {
  writeOnboardingDraftStorage,
  normalizeDraftKeys,
} from "@/services/ssot/onboardingDraft.bridge";

// MF_REDIRECT_LOOP_GUARD_V1
function mfNavGuard(to: string) {
  try {
    const k = "mf:navguard:v1";
    const now = Date.now();
    const raw = sessionStorage.getItem(k);
    const obj = raw ? JSON.parse(raw) : { t: now, n: 0 };
    const dt = now - Number(obj.t || now);
    const n = dt < 1500 ? Number(obj.n || 0) + 1 : 1;
    sessionStorage.setItem(k, JSON.stringify({ t: dt < 1500 ? obj.t : now, n }));
    if (n >= 20) {
      console.error("MF_NAV_LOOP_GUARD: blocked navigation loop to", to);
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

type Draft = {
  activeIndex?: number;
  step1?: any;
  step2?: any;
  step3?: any;
  step4?: any;
  step5?: any;
  step6?: any;
  step7?: any;
};

const LS_KEY = "mf:onboarding:draft:v1";
const DONE_KEY = "mf:onboarding:done:v1";

function isDone(): boolean {
  try {
    return localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return false;
  }
}

function isOnboardingDone() {
  try {
    return localStorage.getItem(DONE_KEY) === "1";
  } catch {
    return false;
  }
}

function clearOnboardingDraft() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

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
    // MF_ONBOARDING_SSOT_BRIDGE_V1 (canonical key p/ Report + compat)
    try {
      writeOnboardingDraftStorage(normalizeDraftKeys(d || {}));
    } catch {}
  } catch {}
}

export function OnboardingFlow() {
  const [mfBootMs] = useState(() => Date.now());
  const [mfStuck, setMfStuck] = useState(false);
  const mfPath = useMemo(() => {
    try {
      return typeof window !== "undefined" && window.location
        ? String(window.location.pathname || "")
        : "";
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMfStuck(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const mfResetOnboarding = () => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k) continue;
          const kl = k.toLowerCase();
          if (
            kl.includes("onboarding") ||
            kl.includes("mf:onboard") ||
            kl.includes("mf:progress") ||
            kl.includes("mf:draft")
          ) {
            keys.push(k);
          }
        }
        keys.forEach((k) => {
          try {
            localStorage.removeItem(k);
          } catch {}
        });
      }
    } catch {}

    try {
      window.location.href = "/onboarding/step-1";
    } catch {
      try {
        window.location.reload();
      } catch {}
    }
  };

  void mfBootMs;
  void mfStuck;
  void mfPath;
  void mfResetOnboarding;
  void clearOnboardingDraft;

  const navigate = useNavigate();

  const mfClampStep = (n: number) => Math.max(1, Math.min(8, n));
  const mfGotoStep = (n: number) => {
    const step = mfClampStep(n);
    const to = `/onboarding/step-${step}`;
    try {
      const guard = mfNavGuard as unknown;
      if (typeof guard === "function") {
        try {
          const ok = Boolean((guard as (x: string) => unknown)(to));
          if (ok) navigate(to, { replace: true });
          else navigate(to, { replace: true });
        } catch {
          navigate(to, { replace: true });
        }
      } else {
        navigate(to, { replace: true });
      }
    } catch {
      try {
        window.history.replaceState({}, "", to);
      } catch {}
    }
  };

  const location = useLocation();
  const __mfLastNavRef = useRef<string | null>(null);

  const mfSafeNavigate = (to: string, opts?: any) => {
    try {
      if (!to) return;
      if (location?.pathname === to) return;
      if (__mfLastNavRef.current === to) return;
      __mfLastNavRef.current = to;
      if (mfNavGuard(to)) navigate(to, opts ?? { replace: true });
    } catch {}
  };

  useEffect(() => {
    try {
      const p = loadOnboardingProgress();
      const step =
        p && typeof p.step === "number" && p.step >= 1 && p.step <= 8 ? p.step : 1;
      const path = (location?.pathname || "").replace(/\/+$/g, "");
      const redirect = guardOnboardingPath(path, step, isDone());
      if (redirect && redirect !== path) {
        mfSafeNavigate(redirect, { replace: true });
      }
    } catch {}
  }, []);

  const { appReady } = useApp();

  const isNative = typeof window !== "undefined" && !!(window as any).Capacitor;
  const [mfForceReady, setMfForceReady] = useState(false);

  useEffect(() => {
    if (!isNative) return;
    const t = window.setTimeout(() => {
      console.warn("MF_APPREADY_TIMEOUT: liberando onboarding no nativo");
      setMfForceReady(true);
    }, 4000);
    return () => window.clearTimeout(t);
  }, [isNative]);

  const mfAppReady =
    Boolean(appReady) ||
    Boolean(import.meta.env.DEV) ||
    (isNative && mfForceReady);

  const [draft, setDraft] = useState<Draft>(() => loadDraft());
  const [active, setActive] = useState<number>(() => {
    const i = Number(loadDraft()?.activeIndex ?? 0);
    return Number.isFinite(i) ? i : 0;
  });

  const params = useParams();
  const __clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
  const __stepFromUrl = (() => {
    const raw = String((params as any)?.step || "").replace(/[^0-9]/g, "");
    const n = Number(raw || 0);
    return __clamp(Number.isFinite(n) && n >= 1 ? n : 1, 1, 8);
  })();

  useEffect(() => {
    const target = __stepFromUrl - 1;
    setActive((cur) => (cur === target ? cur : target));
  }, [__stepFromUrl]);

  useEffect(() => {
    try {
      const desired = `/onboarding/step-${active + 1}`;
      const path = (location?.pathname || "").replace(/\/+$/g, "");
      if (path.startsWith("/onboarding")) {
        const req = path.match(/^\/onboarding\/step-(\d+)\b/);
        const requested = req ? Number(req[1]) : null;
        if (requested != null && Number.isFinite(requested) && requested > active + 1) {
          mfSafeNavigate(desired, { replace: true });
        }
      }
      try {
        saveOnboardingProgress({ step: active + 1 });
      } catch {}
    } catch {}
  }, [active]);

  useEffect(() => {
    saveDraft({ ...draft, activeIndex: active });
  }, [draft, active]);

  const goNext = () => {
    setActive((x) => {
      const nx = Math.min(x + 1, 7);
      mfGotoStep(nx + 1);
      return nx;
    });
  };

  const goBack = () => {
    setActive((x) => {
      const nx = Math.max(x - 1, 0);
      mfGotoStep(nx + 1);
      return nx;
    });
  };

  if (!mfAppReady) {
    return (
      <div className="min-h-screen mf-app-bg mf-bg-neon text-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 text-center shadow-[0_0_40px_rgba(0,149,255,0.08)]">
          <div className="mb-4 flex items-center justify-center">
            <BrandIcon size={46} className="drop-shadow-[0_0_18px_rgba(0,190,255,0.4)]" />
          </div>
          <div className="text-sm text-white/55">Carregando ambiente…</div>
          <div className="mt-2 text-lg font-semibold text-white">
            Preparando seu onboarding
          </div>
        </div>
      </div>
    );
  }

  if (isOnboardingDone()) {
    return null;
  }

  const steps = [
    {
      key: "step1",
      title: "Dados para calibração",
      subtitle: "Base científica para personalizar metabolismo, treino e nutrição.",
      render: () => (
        <Step1Perfil
          value={(draft as any).step1 || {}}
          onChange={(v: any) => setDraft((d: any) => ({ ...d, step1: v }))}
          onNext={goNext}
        />
      ),
    },
    {
      key: "step2",
      title: "Atividade física semanal",
      subtitle: "Esse dado ajuda a calibrar seu gasto energético total diário.",
      render: () => (
        <Step2Avaliacao
          value={(draft as any).step2 || {}}
          onChange={(v: any) => setDraft((d: any) => ({ ...d, step2: v }))}
          onNext={goNext}
          onBack={goBack}
        />
      ),
    },
    {
      key: "step3",
      title: "Metabolismo calibrado",
      subtitle: "Base científica para definir calorias e macros com segurança.",
      render: () => (
        <Step3Metabolismo
          value={(draft as any).step3 || {}}
          onChange={(v: any) => setDraft((d: any) => ({ ...d, step3: v }))}
          onNext={goNext}
          onBack={goBack}
        />
      ),
    },
    {
      key: "step4",
      title: "Faixa calórica segura",
      subtitle: "Base científica para definir calorias e macros com segurança.",
      render: () => (
        <Step4Nutricao
          value={(draft as any).step4 || {}}
          onChange={(v: any) => setDraft((d: any) => ({ ...d, step4: v }))}
          onNext={goNext}
          onBack={goBack}
        />
      ),
    },
    {
      key: "step5",
      title: "Modalidades",
      subtitle: "Vamos definir os pilares do seu protocolo semanal.",
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
      subtitle: "Distribuição inteligente para rotina sustentável.",
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
      subtitle: "Ajustes finais para aumentar aderência.",
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
      subtitle: "Tudo pronto para gerar seu plano premium.",
      render: () => (
        <Step8Confirmacao
          summary={draft}
          onBack={goBack}
          onConfirm={() => {
            const plan = buildActivePlanFromDraft(draft as any);
            saveActivePlan(plan);

            try {
              localStorage.setItem(DONE_KEY, "1");
            } catch {}

            try {
              migrateLegacyToSSOT();
            } catch {}

            try {
              navigate("/assinatura", { replace: true });
            } catch {
              window.location.replace("/assinatura");
            }

            navigate("/assinatura", { replace: true });
          }}
        />
      ),
    },
  ] as const;

  const current = steps[active];

  return (
    <div className="min-h-screen mf-app-bg mf-bg-neon text-white">
      <div className="mx-auto w-full max-w-[440px] px-4 pb-10 pt-6">
        <div className="mb-5 flex items-center gap-3">
          <BrandIcon
            size={24}
            className="drop-shadow-[0_0_16px_rgba(0,190,255,0.35)]"
          />
          <div className="text-[13px] font-medium tracking-tight text-white/90">
            MindsetFit
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-[rgba(10,12,20,0.72)] backdrop-blur-2xl shadow-[0_0_50px_rgba(0,149,255,0.08)] p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.22em] text-white/38">
                Step {active + 1}
              </div>
              <h1 className="mt-2 text-[28px] leading-[1.08] font-semibold tracking-tight text-white">
                {current?.title || "Onboarding"}
              </h1>
              {current?.subtitle ? (
                <p className="mt-2 text-[13px] leading-5 text-white/55">
                  {current.subtitle}
                </p>
              ) : null}
            </div>

            <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/65">
              {active + 1}/8
            </div>
          </div>

          <div className="mb-6 h-[6px] w-full overflow-hidden rounded-full bg-white/6">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#7EF7E7] shadow-[0_0_20px_rgba(0,180,255,0.35)] transition-all duration-500"
              style={{ width: `${((active + 1) / 8) * 100}%` }}
            />
          </div>

          <div>{current?.render()}</div>

          <span data-testid="mf-onboarding-flow" style={{ display: "none" }}>
            ok
          </span>
        </div>
      </div>
    </div>
  );
}

export default OnboardingFlow;