// Template de PDF — versão build-safe
// Encapsulado para evitar variáveis soltas no escopo global

export type PdfTemplateParams = {
  title: string;
  sub?: string;
  css: string;
  pwScore?: number;
  pwTier?: string;
  dateStr?: string;
  timeStr?: string;
  reportId?: string;
};

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export function getPdfTemplate(p: PdfTemplateParams) {
  const {
    title,
    sub = "",
    css,
    pwScore,
    pwTier = "",
    dateStr = "",
    timeStr = "",
    reportId = "",
  } = p;

  return (
    "<!doctype html><html><head><meta charset='utf-8'>" +
    "<title>" + esc(title) + "</title>" +
    "<style>" + css + "</style>" +
    "</head><body>" +

    "<header class='header'>" +
      "<div class='brand'>" + esc(title) + "</div>" +
      (sub ? "<div class='sub'>" + esc(sub) + "</div>" : "") +
      (pwScore != null
        ? "<div class='pill'><span>Score</span><strong>" +
          String(pwScore) +
          "/100</strong><span class='muted'>" +
          esc(pwTier) +
          "</span></div>"
        : "") +
      "<div class='meta'>" +
        "<div><strong>Data</strong>: " + esc(dateStr) + "</div>" +
        "<div><strong>Hora</strong>: " + esc(timeStr) + "</div>" +
        "<div><strong>ID</strong>: " + esc(reportId) + "</div>" +
      "</div>" +
    "</header>" +

    "<main id='content'></main>" +
    "</body></html>"
  );
}
