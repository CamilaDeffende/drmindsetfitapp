/** === Sprint 5E | assinatura clínica (coach vs patient) === */
function getClinicalFooterHtml(variant: "coach" | "patient" | undefined) {
  if (variant === "patient") return "";
  const name = "Luiz Henrique Alexandre";
  const reg  = "CRN: XXXX"; // <- troque aqui
  const contact = "drmindsetfitapp.vercel.app";
  return `
    <div style="margin-top:16px;padding-top:12px;border-top:1px solid rgba(0,0,0,.08);font-size:11px;line-height:1.35;color:rgba(0,0,0,.72)">
      <div style="font-weight:700">${name}</div>
      <div>${reg}</div>
      <div style="opacity:.85">Relatório gerado via <b>MindsetFit</b> • ${contact}</div>
    </div>
  `;
}
void getClinicalFooterHtml;
/** === /Sprint 5E === */

import { jsPDF } from "jspdf";

/**
 * HOTFIX — contrato público do app (não quebrar imports existentes)
 * Uso comum:
 *   await generateMindsetFitPremiumPdf({ content: "texto..." , filename: "relatorio.pdf" })
 * Também aceita variações:
 *   { title, subtitle, lines: string[], brandLines: string[], content }
 */
type PremiumPdfLayout = {
  /** margem (mm) */
  margin?: number | { top?: number; right?: number; bottom?: number; left?: number };
  /** largura máxima do conteúdo (mm) */
  maxWidth?: number;
  /** fonte base */
  fontSize?: number;
  /** altura de linha */
  lineHeight?: number;
  /** quebra automática */
  autoWrap?: boolean;
  /** qualquer outro parâmetro futuro */
  [key: string]: any;
};

export type PremiumPdfOptions = {
  title?: string;
  subtitle?: string;
  content?: string;
  lines?: string[];
  brandLines?: readonly string[];
  signatureLines?: readonly string[];
  wordmarkText?: string;
  wordmarkSubtext?: string;
  reportLabel?: string;
  reportDateLabel?: string;
  metaLines?: readonly string[];
  bodyText?: string;
  layout?: PremiumPdfLayout;
  filename?: string;
};

export async function generateMindsetFitPremiumPdf(options: PremiumPdfOptions): Promise<void> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  const title = options?.title ?? "DRMINDSETFIT — RELATÓRIO";
  const subtitle = options?.subtitle ?? "MindsetFit Premium PDF";
  const filename = options?.filename ?? "mindsetfit-relatorio.pdf";

  const contentFromLines =
    Array.isArray(options?.lines) && options.lines.length ? options.lines.join("\n") : "";
  const contentFromBrand =
    Array.isArray(options?.brandLines) && options.brandLines.length ? options.brandLines.join("\n") :
    Array.isArray(options?.signatureLines) && options.signatureLines.length ? options.signatureLines.join("\n") : "";
  const content = (options?.content ?? contentFromLines ?? "").trim();

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(title, 40, 56);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(subtitle, 40, 74);

  // Divider
  doc.setDrawColor(220);
  doc.line(40, 88, W - 40, 88);

  // Body
  const body = [
    content || "Conteúdo não informado.",
    "",
    contentFromBrand ? "—" : "",
    contentFromBrand
  ].filter(Boolean).join("\n").trim();

  doc.setFontSize(10);
  const wrapped = doc.splitTextToSize(body, W - 80);
  doc.text(wrapped, 40, 110);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text("Gerado por DrMindsetFitApp • MindsetFit Premium", 40, H - 28);
  doc.setTextColor(0);

  doc.save(filename);
}

