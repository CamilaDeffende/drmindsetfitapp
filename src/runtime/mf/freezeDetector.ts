type FreezeEntry = { t: number; kind: "freeze"; lagMs: number; route: string; lastRoute: string };
declare global { interface Window { __mf_freeze?: FreezeEntry[] } }

function nowMs(): number {
  return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now();
}
function getRoute(): string {
  try { return String(window.location.pathname + window.location.search + window.location.hash); }
  catch { return "(unknown)"; }
}
function ensureOverlay(): HTMLDivElement {
  const id = "mf-freeze-overlay";
  const ex = document.getElementById(id);
  if (ex && ex instanceof HTMLDivElement) return ex;
  const el = document.createElement("div");
  el.id = id;
  el.style.position = "fixed";
  el.style.inset = "0";
  el.style.zIndex = "2147483647";
  el.style.background = "rgba(0,0,0,0.92)";
  el.style.color = "#fff";
  el.style.fontFamily =
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace";
  el.style.fontSize = "12px";
  el.style.padding = "16px";
  el.style.overflow = "auto";
  el.style.display = "none";
  document.body.appendChild(el);
  return el;
}
function pushFreeze(lagMs: number, route: string, lastRoute: string): void {
  const w = window;
  w.__mf_freeze = w.__mf_freeze ?? [];
  w.__mf_freeze.push({ t: Date.now(), kind: "freeze", lagMs, route, lastRoute });
  if (w.__mf_freeze.length > 40) w.__mf_freeze = w.__mf_freeze.slice(-40);
}
function renderOverlay(lagMs: number, route: string, lastRoute: string): void {
  const el = ensureOverlay();
  el.textContent = [
    "MF FREEZE DETECTOR (DEV)",
    "",
    `Event loop lag detectado: ~${Math.round(lagMs)}ms`,
    `Rota atual: ${route}`,
    `Rota anterior: ${lastRoute}`,
    "",
    "AÇÕES:",
    "1) F12 -> Console: copie as linhas vermelhas (errors) e cole no chat.",
    "2) No Console rode: window.__mf_freeze e cole no chat.",
    "3) Rode também: window.__mf_bootlog (se existir) e cole no chat.",
  ].join("\\n");
  el.style.display = "block";
}

export function installFreezeDetector(opts?: { thresholdMs?: number; pollMs?: number }): void {
  const thresholdMs = Math.max(500, opts?.thresholdMs ?? 1500);
  const pollMs = Math.max(100, opts?.pollMs ?? 250);

  let lastRoute = getRoute();
  let suspended = typeof document !== "undefined" ? document.visibilityState === "hidden" : false;

  try {
    const origPush = history.pushState.bind(history);
    history.pushState = ((...args: Parameters<History["pushState"]>) => {
      lastRoute = getRoute();
      return origPush(...args);
    }) as History["pushState"];

    const origReplace = history.replaceState.bind(history);
    history.replaceState = ((...args: Parameters<History["replaceState"]>) => {
      lastRoute = getRoute();
      return origReplace(...args);
    }) as History["replaceState"];

    window.addEventListener("popstate", () => { lastRoute = getRoute(); });
  } catch {}

  try {
    document.addEventListener("visibilitychange", () => {
      suspended = document.visibilityState === "hidden";
    });
    window.addEventListener("focus", () => {
      suspended = false;
    });
    window.addEventListener("blur", () => {
      suspended = true;
    });
  } catch {}

  let prev = nowMs();
  let fired = false;

  window.setInterval(() => {
    const t = nowMs();
    const lag = t - prev - pollMs;
    prev = t;

    if (suspended) {
      fired = false;
      return;
    }

    if (!fired && lag > thresholdMs) {
      fired = true;
      const route = getRoute();
      pushFreeze(lag, route, lastRoute);
      try { renderOverlay(lag, route, lastRoute); }
      catch { setTimeout(() => { try { renderOverlay(lag, route, lastRoute); } catch {} }, 50); }
    } else if (lag <= thresholdMs) {
      fired = false;
    }
  }, pollMs);
}
