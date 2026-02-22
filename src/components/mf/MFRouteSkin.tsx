import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Converte pathname em slug seguro para data attribute.
 * "/" -> dashboard
 * "/onboarding/step-1" -> onboarding-step-1
 */
function sanitizeRoute(pathname: string): string {
  if (!pathname || pathname === "/") return "dashboard";

  // remove query e hash
  const clean = pathname.split("?")[0].split("#")[0];

  const segments = clean.split("/").filter(Boolean);

  const safe = segments
    .map((seg) =>
      seg
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "")
        .replace(/-+/g, "-")
    )
    .filter(Boolean)
    .join("-");

  return safe || "dashboard";
}

/**
 * MFRouteSkin
 * Injeta data-mf-route no <html>
 * Permite CSS 1:1 por rota sem alterar páginas.
 */
export function MFRouteSkin() {
  const location = useLocation();

  useEffect(() => {
    const slug = sanitizeRoute(location.pathname);
    document.documentElement.setAttribute("data-mf-route", slug);
  }, [location.pathname]);

  return null;
}
