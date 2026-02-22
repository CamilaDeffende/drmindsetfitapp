import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function sanitizeRoute(pathname: string) {
  if (!pathname || pathname === "/") return "dashboard";
  const p = pathname.replace(/^\/+/, "").replace(/\/+$/, "");
  return p.replace(/[^\w\-\/]/g, "").replace(/\//g, "-").toLowerCase();
}

/**
 * MFRouteSkin — escreve data-mf-route no <html> baseado na rota.
 * Permite CSS 1:1 por tela sem editar cada página.
 */
export function MFRouteSkin() {
  const loc = useLocation();
  useEffect(() => {
    document.documentElement.setAttribute("data-mf-route", sanitizeRoute(loc.pathname));
  }, [loc.pathname]);
  return null;
}
