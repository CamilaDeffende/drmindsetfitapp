import { jsPDF } from "jspdf";

import QRCode from "qrcode";
export type MindsetFitPdfOptions = {
  logoUrl: string;              // ex: import logoUrl from "@/assets/branding/mindsetfit-logo.png"
  fileName: string;             // ex: mindsetfit-hiit-....pdf
  wordmarkText?: string;         // default: "MindSetFit"
  reportLabel?: string;          // default: "RELATÓRIO"
  metaLines: string[];           // linhas curtas (objetivo, modalidade, protocolo...)
  bodyText: string;
  bodyHtml?: string;              // texto grande (exportPayload)
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
}

type PremiumPdfOptions = MindsetFitPdfOptions & {
signatureLines?: readonly string[];
  qrUrl?: string;
  qrLabel?: string;
  docId?: string;
  docVersion?: string;
};

async function buildQrDataUrl(qrUrl?: string): Promise<string | null> {
  if (!qrUrl) return null;
  try {
    // QR branco em fundo preto (combina com o PDF dark)
    const dataUrl = await (QRCode as any).toDataURL(qrUrl, {
      width: 256,
      margin: 0,
      color: { dark: "#FFFFFF", light: "#000000" },
    });
    return String(dataUrl);
  } catch {
    return null;
  }
}

;

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

export async function generateMindsetFitPremiumPdf(opts: PremiumPdfOptions): Promise<void> {
  const {
    logoUrl,
    fileName,
    metaLines,
    bodyText,
    signatureLines = [],
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

  
  // Assinatura clínica (opcional)
  if (signatureLines.length) {
    const sigTop = pageH - 125;
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.35);
    doc.line(margin, sigTop, pageW - margin, sigTop);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(210, 210, 210);

    let sy = sigTop + 18;
    for (const line of signatureLines.slice(0, 3)) {
      doc.text(line, margin, sy);
      sy += 14;
    }
  }

function drawPremiumFooter(doc: any, pageW: number, pageH: number, margin: number, slogan: string, pageNumber: number, totalPages: number, qrDataUrl?: string | null, qrLabel?: string, docId?: string, docVersion?: string) {
  // Faixa sutil no rodapé
  const footerH = 52;
  const yTop = pageH - footerH;

  // micro preenchimento (quase imperceptível)
  doc.setFillColor(8, 10, 14);
  doc.rect(0, yTop, pageW, footerH, "F");

  // linha divisória suave
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.35);
  doc.line(margin, yTop + 10, pageW - margin, yTop + 10);

  // tipografia
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(185, 190, 200);

  // esquerda: timestamp discreto
  const now = new Date();
  const stamp = now.toLocaleString("pt-BR", { hour12: false });
  doc.text(stamp, margin, yTop + 32);

  /* DOC_META_BLOCK */
  const metaParts: string[] = [];
  if (docId) metaParts.push("ID: " + docId);
  if (docVersion) metaParts.push("v" + docVersion);
  if (metaParts.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 155, 165);
    doc.text(metaParts.join(" • "), margin, yTop + 45);
  }
  // centro: slogan
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(225, 230, 240);
  doc.text(slogan, pageW / 2, yTop + 32, { align: "center" });

  // direita: paginação
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(185, 190, 200);
  doc.text(`Página ${pageNumber}/${totalPages}`, pageW - margin, yTop + 32, { align: "right" });

  /* QR_CODE_BLOCK */
  if (pageNumber === 1 && qrDataUrl) {
    const size = 28;
    const x = pageW - margin - size;
    const y = yTop + 14;
    try {
      doc.addImage(qrDataUrl, "PNG", x, y, size, size);
      if (qrLabel) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(160, 165, 175);
        doc.text(qrLabel, x + size / 2, y + size + 10, { align: "center" });
      }
    } catch {}
  }
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

    // Rodapé premium v2 — paginação real (aplicar em TODAS as páginas)

    const slogan = (signatureLines && signatureLines.length ? String(signatureLines[0]) : "MindsetFit — Sistema inteligente de Saúde e Performance.");

const qrDataUrl = await buildQrDataUrl((opts as any).qrUrl);
const qrLabel = (opts as any).qrLabel ? String((opts as any).qrLabel) : undefined;
const docId = (opts as any).docId ? String((opts as any).docId) : undefined;
const docVersion = (opts as any).docVersion ? String((opts as any).docVersion) : undefined;
    const totalPages = (typeof (doc as any).getNumberOfPages === "function") ? (doc as any).getNumberOfPages() : 1;

    for (let p = 1; p <= totalPages; p++) {

      (doc as any).setPage(p);

      drawPremiumFooter(doc, pageW, pageH, margin, slogan, p, totalPages, qrDataUrl, qrLabel, docId, docVersion);

    }

    doc.save(fileName)}
