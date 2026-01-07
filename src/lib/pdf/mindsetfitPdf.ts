import { jsPDF } from "jspdf";

export type MindsetFitPdfOptions = {
  logoUrl: string;              // ex: import logoUrl from "@/assets/branding/mindsetfit-logo.png"
  fileName: string;             // ex: mindsetfit-hiit-....pdf
  wordmarkText?: string;         // default: "MindSetFit"
  reportLabel?: string;          // default: "RELATÓRIO"
  metaLines: string[];           // linhas curtas (objetivo, modalidade, protocolo...)
  bodyText: string;              // texto grande (exportPayload)
  layout?: {
    logoW?: number;
    logoH?: number;
    logoY?: number;
    wordmarkSize?: number;
    wordmarkGap?: number;        // distância entre logo e wordmark
    headerGap?: number;          // distância entre wordmark e header
    margin?: number;
    lineHeight?: number;
    drawFrame?: boolean;         // moldura azul sutil (premium)
  };
};

// Converte asset (url) em dataUrl para jsPDF
async function toDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  const reader = new FileReader();
  return await new Promise((resolve, reject) => {
    reader.onerror = () => reject(new Error("FileReader error"));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}

function slug(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();
}

export function buildMindsetFitPdfFileName(base: string, parts: string[]) {
  const clean = parts.map(slug).filter(Boolean).join("-");
  return `${slug(base)}-${clean}.pdf`;
}

export async function generateMindsetFitPremiumPdf(opts: MindsetFitPdfOptions): Promise<void> {
  const {
    logoUrl,
    fileName,
    metaLines,
    bodyText,
    wordmarkText = "MindSetFit",
    reportLabel = "RELATÓRIO",
    layout = {},
  } = opts;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const margin = layout.margin ?? 60;
  const lineHeight = layout.lineHeight ?? 13;

  const logoW = layout.logoW ?? 220;
  const logoH = layout.logoH ?? 150;
  const logoY = layout.logoY ?? 78;
  const logoX = (pageW - logoW) / 2;

  const wordmarkSize = layout.wordmarkSize ?? 38;
  const wordmarkGap = layout.wordmarkGap ?? 92;
  const wordmarkY = logoY + logoH + wordmarkGap;

  const headerGap = layout.headerGap ?? 32;
  const headerTop = wordmarkY + headerGap;

  const drawFrame = layout.drawFrame ?? true;

  // Fundo preto
  doc.setFillColor(8, 8, 10);
  doc.rect(0, 0, pageW, pageH, "F");

  // Logo
  const dataUrl = await toDataUrl(logoUrl);

  // Moldura/realce sutil
  if (drawFrame) {
    doc.setDrawColor(40, 120, 255);
    doc.setLineWidth(0.9);
    doc.roundedRect(logoX - 22, logoY - 22, logoW + 44, logoH + 44, 16, 16, "S");
  }

  doc.addImage(dataUrl, "PNG", logoX, logoY, logoW, logoH);

  // Wordmark
  doc.setTextColor(240, 240, 240);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(wordmarkSize);
  doc.text(wordmarkText, pageW / 2, wordmarkY, { align: "center" });

  // Linha header
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.line(margin, headerTop, pageW - margin, headerTop);

  // Label
  doc.setFontSize(12);
  doc.setTextColor(210, 210, 210);
  doc.text(reportLabel, margin, headerTop + 26);

  // Metas (linhas curtas)
  doc.setTextColor(235, 235, 235);
  doc.setFontSize(10);

  let metaY = headerTop + 46;
  for (const line of metaLines.slice(0, 8)) {
    doc.text(line, margin, metaY);
    metaY += 16;
  }

  // Corpo (texto grande)
  const bodyY = metaY + 14;
  doc.setTextColor(220, 220, 220);
  doc.setFont("courier", "normal");
  doc.setFontSize(9);

  const maxW = pageW - margin * 2;
  const lines = doc.splitTextToSize(bodyText, maxW);

  let y = bodyY;

  for (const line of lines) {
    if (y > pageH - 80) {
      doc.addPage();
      doc.setFillColor(8, 8, 10);
      doc.rect(0, 0, pageW, pageH, "F");

      doc.setTextColor(220, 220, 220);
      doc.setFont("courier", "normal");
      doc.setFontSize(9);

      y = 70;
    }
    doc.text(String(line), margin, y);
    y += lineHeight;
  }

  // Footer
  const footerY = pageH - 38;
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.line(margin, footerY - 14, pageW - margin, footerY - 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(180, 180, 180);
  doc.text("MindSetFit • Relatório gerado automaticamente", pageW / 2, footerY, { align: "center" });

  doc.save(fileName);
}
