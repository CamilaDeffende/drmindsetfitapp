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
    if (v === "1" || v === "true" || v === "ok" || v === "yes" || v === "done" || v === "completed") return true;

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
    
    const isDevPass = (() => { try { return new URLSearchParams(window.location.search).get("dev") === "1"; } catch { return false; } })();
const path = (loc.pathname || "/").toLowerCase();

    let subscribed = false;
    let onboardingDone = false;

    

    if (isDevPass) { subscribed = true; onboardingDone = true; }
try {
      const f = getFlags();
      subscribed = !!f.subscribed;
      onboardingDone = !!f.onboardingDone;
    } catch {}

    // 1) Se não tem assinatura: tudo (exceto /assinatura e /login e /signup e /pricing) volta pra /assinatura
    const publicOk = ["/assinatura", "/login", "/signup", "/pricing"];
    if (!subscribed && !publicOk.some(p => path.startsWith(p))) {
      nav("/assinatura", { replace: true });
      return;
    }

    // 2) Se tem assinatura e está em /assinatura: vai para login
    if (subscribed && path === "/assinatura") {
      nav("/login", { replace: true });
      return;
    }

    // 3) Se tem assinatura mas não completou onboarding: força /onboarding (exceto /login e /onboarding)
    if (subscribed && !onboardingDone && path !== "/onboarding" && path !== "/login") {
      nav("/onboarding", { replace: true });
      return;
    }

    // 4) Se completou onboarding e está em /onboarding: manda para dashboard
    if (subscribed && onboardingDone && path === "/onboarding") {
      nav("/dashboard", { replace: true });
      return;
    }

    // 5) Entrada padrão / (o App já redireciona pra /assinatura, mas garantimos aqui)
    if (path === "/" || path === "") {
      nav(subscribed ? (onboardingDone ? "/dashboard" : "/onboarding") : "/assinatura", { replace: true });
      return;
    }
  }, [loc.pathname, nav]);

  return null;
}
