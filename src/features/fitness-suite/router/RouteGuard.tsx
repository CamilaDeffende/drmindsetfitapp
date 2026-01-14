import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function getFlags() {
  const keys = Object.keys(localStorage || {});
  const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };

  const subKey = keys.find(k => /sub|assin/i.test(k)) || "mindsetfit:isSubscribed";
  const onbKey = keys.find(k => /onboard/i.test(k)) || "mindsetfit:onboardingCompleted";

  const subscribed = (() => {
    const v = get(subKey);
    if (!v) return false;
    return v === "1" || v === "true" || v === "ok" || v === "yes" || v === "subscribed";
  })();

  const onboardingDone = (() => {
    const v = get(onbKey);
    if (!v) return false;
    return v === "1" || v === "true" || v === "ok" || v === "done" || v === "completed";
  })();

  return { subscribed, onboardingDone };
}

export default function RouteGuard() {
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    const path = (loc.pathname || "/").toLowerCase();
    let subscribed = false;
    let onboardingDone = false;

    try {
      const f = getFlags();
      subscribed = f.subscribed;
      onboardingDone = f.onboardingDone;
    } catch {}

    // Se já terminou e está no onboarding: sai
    if (path.startsWith("/onboarding") && onboardingDone) {
      nav("/dashboard", { replace: true });
      return;
    }

    // Proteção de rotas internas sem assinatura
    const internal = ["/dashboard","/workout","/nutrition","/cardio","/hiit","/history","/report"];
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
