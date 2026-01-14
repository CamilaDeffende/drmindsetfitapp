import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";


/** helper: lê estado persistido (se existir) */
const readState = () => {
  try {
    const raw =
      localStorage.getItem("drmindsetfit_state") ||
      localStorage.getItem("mindsetfit_state") ||
      localStorage.getItem("mindsetfit:state") ||
      localStorage.getItem("state") ||
      null;
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

function getFlags() {
  const keys = Object.keys(localStorage || {});
  const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };

  const subKey = keys.find(k => /sub|assin/i.test(k)) || "mindsetfit:isSubscribed";
const onbKey = keys.find(k => /onboard/i.test(k)) || "mindsetfit:onboardingCompleted";

  const subscribed = (() => {
  const v = String(get(subKey) || "").toLowerCase();
  if (v === "1" || v === "true" || v === "ok" || v === "yes" || v === "subscribed") return true;

  const st: any = readState();
  if (!st) return false;

  // heurísticas comuns de assinatura (aceita boolean/string)
  const candidates = [
    st?.isSubscribed, st?.subscribed, st?.subscriptionActive, st?.planActive,
    st?.assinaturaOk, st?.assinatura?.ok, st?.assinatura?.status, st?.subscription?.status,
    st?.subscription?.active, st?.checkout?.status
  ];

  for (const c of candidates) {
    const s = String(c ?? "").toLowerCase();
    if (c === true) return true;
    if (s === "true" || s === "1" || s === "ok" || s === "active" || s === "paid" || s === "subscribed") return true;
  }
  return false;
})();

const onboardingDone = (() => {
  const v = String(get(onbKey) || "").toLowerCase();
  if (v === "1" || v === "true" || v === "ok" || v === "yes" || v === "done") return true;

  const st: any = readState();
  if (!st) return false;

  const candidates = [
    st?.onboardingCompleted, st?.onboardingDone, st?.onboarding?.completed, st?.onboarding?.done,
    st?.perfilCompleto, st?.profileCompleted
  ];

  for (const c of candidates) {
    const s = String(c ?? "").toLowerCase();
    if (c === true) return true;
    if (s === "true" || s === "1" || s === "ok" || s === "yes" || s === "done" || s === "completed") return true;
  }
  return false;
})();

  return { subscribed, onboardingDone };
}

export default function RouteGuard() {
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => {
        const path = (loc.pathname || "/").toLowerCase();

    // Rotas públicas (nunca devem ser bloqueadas por assinatura)
    const publicRoutes = ["/login", "/signup", "/pricing", "/assinatura"];
    if (publicRoutes.some(p => path === p || path.startsWith(p + "/"))) return;
    let subscribed = false;
    let onboardingDone = false;

    try {
      const f = getFlags();
      subscribed = f.subscribed;
      onboardingDone = f.onboardingDone;
    } catch {}

        // Se já terminou o onboarding e está na entrada (/): vai pro dashboard
    if (path === "/" && onboardingDone && subscribed) {
      nav("/dashboard", { replace: true });
      return;
    }

    // Proteção de rotas internas sem assinatura
        const internal = [
      "/dashboard",
      "/running",
      "/treino",
      "/nutrition",
      "/cardio",
      "/hiit",
      "/planos-ativos",
      "/report",
      "/history",
      "/edit-diet",
      "/download"
    ];
    if (internal.some(p => path.startsWith(p)) && !subscribed) {
      nav("/assinatura", { replace: true });
      return;
    }

    // Entrada padrão do app
    if (path === "/" || path === "") {
      if (subscribed && !onboardingDone) { nav("/onboarding", { replace: true }); return; }
      if (subscribed && onboardingDone) { nav("/dashboard", { replace: true }); return; }
    }
  }, [loc.pathname, nav]);

  return null;
}
