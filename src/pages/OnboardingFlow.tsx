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
import { resetOnboardingProgress } from '@/lib/onboardingProgress';

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
  } catch { return true; }
}


type Draft = {
  activeIndex?: number;
  step5?: any;
  step6?: any;
  step7?: any;
};

const LS_KEY = "mf:onboarding:draft:v1";
const DONE_KEY = "mf:onboarding:done:v1";

function isDone(): boolean {
  try { return localStorage.getItem(DONE_KEY) === "1"; } catch { return false; }
}
function isOnboardingDone() {
  try { return localStorage.getItem(DONE_KEY) === "1"; } catch { return false; }
}

function clearOnboardingDraft() {
  try { localStorage.removeItem(LS_KEY); } catch {}
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
  } catch {}
}

// ✅ Export NAMED (App.tsx importa { OnboardingFlow })
export function OnboardingFlow() {

  // MF_ONBOARDING_LOADER_WATCHDOG_V2
  const [mfBootMs] = useState(() => Date.now());
  const [mfStuck, setMfStuck] = useState(false);
  const mfPath = useMemo(() => {
    try { return (typeof window !== "undefined" && window.location) ? String(window.location.pathname || "") : ""; }
    catch { return ""; }
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
          if (kl.includes("onboarding") || kl.includes("mf:onboard") || kl.includes("mf:progress") || kl.includes("mf:draft")) keys.push(k);
        }
        keys.forEach((k) => { try { localStorage.removeItem(k); } catch {} });
      }
    } catch {}
    try { window.location.href = "/onboarding/step-1"; }
    catch { try { window.location.reload(); } catch {} }
  };

  
  // MF_ONB_WATCHDOG_UNUSED_SILENCE_V1
  void mfBootMs; void mfStuck; void mfPath; void mfResetOnboarding;
// MF_ONBOARDING_WATCHDOG_UNUSED_SILENCE_V1
  // Se o watchdog não estiver sendo renderizado, evitamos TS6133.
  void mfBootMs;
  void mfStuck;
  void mfPath;
  void mfResetOnboarding;

  // MF_SAFE_NAV_GUARD_V1
  const navigate = useNavigate();
  // Guard anti-loop: só navega quando o destino muda e é diferente do pathname atual.
  const location = useLocation();
  const __mfLastNavRef = useRef<string | null>(null);
  const mfSafeNavigate = (to: string, opts?: any) => {
    try {
      if (!to) return;
      if (location?.pathname === to) return;
      if (__mfLastNavRef.current === to) return;
      __mfLastNavRef.current = to;
      if (mfNavGuard(to)) navigate(to, (opts ?? { replace: true }));
    } catch {}
  };
  // UNLOCK_FLOW_REDIRECT_EFFECT_V1: /onboarding deve respeitar progresso salvo (sem apagar dados)
  useEffect(() => {
    try {
      const p = loadOnboardingProgress();
      const step = (p && typeof p.step === "number" && p.step >= 1 && p.step <= 8) ? p.step : 1;
      const path = (location?.pathname || "").replace(/\/+$/g, "");
      const redirect = guardOnboardingPath(path, step, isDone());
      if (redirect && redirect !== path) {
        mfSafeNavigate(redirect, { replace: true });
      }
    } catch {}
  }, []);

  const SHOW_LEGACY_NAV: boolean = false;

  const { appReady } = useApp();


  // MF_APPREADY_GATE_DEV_BYPASS_V1
  // Em DEV, não travar a árvore inteira aguardando hydrate/async do AppContext.
  // PROD mantém comportamento original.
  const mfAppReady = Boolean(appReady) || Boolean(import.meta.env.DEV);

  // Hooks sempre no topo (rules-of-hooks)
  const [draft, setDraft] = useState<Draft>(() => loadDraft());
  const [active, setActive] = useState<number>(() => {
    const i = Number(loadDraft()?.activeIndex ?? 0);
return Number.isFinite(i) ? i : 0;
  });

  // UNLOCK_STEP_URL_SYNC_V1 — SSOT do step via URL + persistência (sem apagar dados)
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
        const req = path.match(/^\/onboarding\/step-(\\d+)\b/);
        const requested = req ? Number(req[1]) : null;
        if (requested != null && Number.isFinite(requested) && requested > active + 1) {
          mfSafeNavigate(desired, { replace: true });
        }
      }
      try { saveOnboardingProgress({ step: active + 1 }); } catch {}
    } catch {}
  }, [active]);

  useEffect(() => {
    saveDraft({ ...draft, activeIndex: active });
  }, [draft, active]);

  const goNext = () => setActive((x) => Math.min(x + 1, 7));
  const goBack = () => setActive((x) => Math.max(x - 1, 0));

  // Gate depois dos hooks
  // __MF_APPREADY_NO_BLANK_V1__
  if (!mfAppReady) {
    return (
      <div
data-testid="app-loading" className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">Carregando ambiente…</div>
          <div className="text-lg font-semibold">Preparando seu onboarding</div>
        </div>
      </div>
    );
  }

if (isOnboardingDone()) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const steps = [
      {
        key: "step1",
        title: "Objetivo e Perfil",
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
        title: "Dados corporais",
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
        title: "Nível de atividade",
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
        title: "Nutrição",
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
              const plan = buildActivePlanFromDraft(draft as any);
              saveActivePlan(plan);

              try { localStorage.setItem(DONE_KEY, "1"); } catch {}
              
              // ✅ BLOCO 3: garante SSOT do plano (se existir legado) e segue para Dashboard
              try { migrateLegacyToSSOT(); } catch {}
              try { navigate("/dashboard", { replace: true }); } catch { window.location.replace("/dashboard"); }
try { clearOnboardingDraft(); } catch {}
              navigate("/dashboard", { replace: true });
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

      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate("/dashboard", { replace: true })}
          className="px-4 py-2 rounded-xl border border-white/10 text-sm opacity-90 hover:opacity-100"
        >
          Salvar e sair
        </button>
        <button
          type="button"
          onClick={() => { clearOnboardingDraft(); try { localStorage.removeItem(DONE_KEY); } catch {} ; try { resetOnboardingProgress(); } catch {} ; window.location.reload(); }}
          className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15"
        >
          Reiniciar onboarding
        </button>
      </div>

      {/* Navegação mínima para Steps 1–4 (legado) se eles não tiverem botões próprios */}
      
      {/* MF_STEP1_NEXT_FALLBACK: garante avanço estável no Step-1 (E2E-safe) */}
      {(<div className="mt-6 flex items-center justify-end">
          <button
            data-testid="onboarding-next"
            type="button"
            onClick={() => { try { goNext(); } catch {}
            try {
              // MF_FORCE_NEXT_URL_V9: após goNext(), a URL DEVE refletir o step atual.
              // Regra: se step atual >= 8 => /dashboard, senão => /onboarding/step-(n+1)
              const __path = window.location.pathname || "";
              if (__path.startsWith("/onboarding")) {
                const m = __path.match(/\/onboarding\/step-(\d+)\b/);
                const __cur = (m && m[1]) ? (Number(m[1]) || 1) : 1;
                const __dest = __cur >= 8 ? "/dashboard" : `/onboarding/step-${__cur + 1}`;
                mfSafeNavigate(__dest, { replace: true });
              }
            } catch {}
}}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/15"
          >
            Continuar
          </button>
        </div>
      )}

      {/* MF_ONBOARDING_FLOW_RENDERED */}
      <span data-testid="mf-onboarding-flow" style={{display:"none"}}>ok</span>

{SHOW_LEGACY_NAV && (
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
      )}
    </div>
  );
}

// ✅ manter default export também (conveniência)
export default OnboardingFlow;
