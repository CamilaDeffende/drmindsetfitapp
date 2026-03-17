/* MF_FATAL_OVERLAY_V1 */
type AnyErr = unknown;

function fmt(e: AnyErr) {
  try {
    if (e instanceof Error) return e.stack || e.message || String(e);
    return JSON.stringify(e, null, 2);
  } catch {
    return String(e);
  }
}

function show(title: string, err: AnyErr) {
  const msg = fmt(err);
  const el = document.createElement("div");
  el.setAttribute("data-mf-fatal", "1");
  el.style.position = "fixed";
  el.style.inset = "0";
  el.style.zIndex = "999999";
  el.style.background = "#05060a";
  el.style.color = "#e7e7e7";
  el.style.padding = "16px";
  el.style.fontFamily =
    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace";
  el.style.overflow = "auto";
  el.innerHTML =
    "<div style=\"max-width:1100px;margin:0 auto;\">" +
    "<div style=\"font-size:12px;opacity:.8;margin-bottom:8px;\">MindsetFit • Fatal Runtime Error</div>" +
    "<div style=\"font-size:18px;margin-bottom:12px;\">" + title + "</div>" +
    "<pre style=\"white-space:pre-wrap;line-height:1.35;font-size:12px;background:rgba(255,255,255,.06);padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);\">" +
    msg.replace(/</g, "&lt;").replace(/>/g, "&gt;") +
    "</pre>" +
    "<div style=\"margin-top:12px;font-size:12px;opacity:.8;\">Copie este erro e cole no chat para eu corrigir a causa-raiz.</div>" +
    "</div>";

  document.querySelectorAll("[data-mf-fatal=\"1\"]").forEach((n) => n.remove());
  document.body.appendChild(el);
}

window.addEventListener("error", (ev) => show("window.error", (ev as any)?.error ?? ev));
window.addEventListener("unhandledrejection", (ev) => show("unhandledrejection", (ev as any)?.reason ?? ev));
