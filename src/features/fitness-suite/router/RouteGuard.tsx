import { Outlet } from "react-router-dom";

/**
 * MF_ROUTE_GUARD_V1
 * Guard "neutro": NÃO redireciona nada.
 * Ele existe apenas para manter consistência de arquitetura e permitir instrumentação futura,
 * sem jamais matar o render das rotas filhas.
 */
export default function RouteGuard() {
  return <Outlet />;
}
