/* MF_DEV_FATAL_OVERLAY_V1 */
function ensureOverlay() {
  let el = document.getElementById("mf-dev-fatal") as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "mf-dev-fatal";
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
    el.style.whiteSpace = "pre-wrap";
    el.style.display = "none";
    document.body.appendChild(el);
  }
  return el;
}

function show(kind: string, msg: string, stack?: string) {
  const el = ensureOverlay();
  el.style.display = "block";
  const now = new Date().toISOString();
  el.textContent =
    `MF DEV FATAL OVERLAY\n` +
    `time: ${now}\n` +
    `kind: ${kind}\n\n` +
    `${msg}\n\n` +
    (stack ? `stack:\n${stack}\n` : "");
}

export function installDevFatalOverlay() {
  try {
    if (typeof window === "undefined") return;
    window.addEventListener("error", (ev: any) => {
      const err = ev?.error;
      show("window.error", String(ev?.message || err?.message || "unknown error"), String(err?.stack || ""));
    });
    window.addEventListener("unhandledrejection", (ev: any) => {
      const r = ev?.reason;
      show("unhandledrejection", String(r?.message || r || "unknown rejection"), String(r?.stack || ""));
    });
  } catch {}
}
