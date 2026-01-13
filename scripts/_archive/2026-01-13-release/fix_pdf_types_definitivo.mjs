import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const FILE = "src/lib/pdf/mindsetfitPdf.ts";
const LOGO_PUBLIC = "/brand/mindsetfit-logo.svg";
const DEFAULT_FILENAME = "Relatorio-MindsetFit-Premium.pdf";

const abs = path.join(ROOT, FILE);
if (!fs.existsSync(abs)) {
  console.error("❌ Arquivo não encontrado:", FILE);
  process.exit(1);
}

let s = fs.readFileSync(abs, "utf8");

// 0) garantir DEFAULT_LOGO_URL correto (e mantê-lo útil)
if (!s.includes("const DEFAULT_LOGO_URL")) {
  s = `const DEFAULT_LOGO_URL = "${LOGO_PUBLIC}";\n` + s;
} else {
  s = s.replace(/const DEFAULT_LOGO_URL\s*=\s*["'][^"']+["'];/g, `const DEFAULT_LOGO_URL = "${LOGO_PUBLIC}";`);
}

// 1) remover os "Used" dos TIPOS (eles não podem existir em tipos)
s = s.replace(/\bfinalLogoUrlUsed\b/g, "finalLogoUrl");
s = s.replace(/\bfileNameUsed\b/g, "fileName");

// 2) garantir que MindsetFitPdfOptions tenha finalLogoUrl?/fileName? (opcionais)
function ensureFieldsInMindsetFitPdfOptions(txt) {
  const hasFinal = /\bfinalLogoUrl\s*\?:\s*string/.test(txt);
  const hasFile = /\bfileName\s*\?:\s*string/.test(txt);
  if (hasFinal && hasFile) return txt;

  return txt.replace(/\{\s*\n/, (m) => {
    let add = "";
    if (!hasFinal) add += "  finalLogoUrl?: string;\n";
    if (!hasFile) add += "  fileName?: string;\n";
    return m + add;
  });
}

// interface MindsetFitPdfOptions { ... }
s = s.replace(/(export\s+)?interface\s+MindsetFitPdfOptions\s*\{[\s\S]*?\n\}/g, (m) =>
  ensureFieldsInMindsetFitPdfOptions(m)
);

// type MindsetFitPdfOptions = { ... }
s = s.replace(/(export\s+)?type\s+MindsetFitPdfOptions\s*=\s*\{[\s\S]*?\n\}\s*;?/g, (m) =>
  ensureFieldsInMindsetFitPdfOptions(m)
);

// 3) garantir que PremiumPdfOptions NÃO exija nada novo — no máximo opcional
// (se existir definição) injeta também fileName?/finalLogoUrl?
s = s.replace(/type\s+PremiumPdfOptions\s*=\s*MindsetFitPdfOptions\s*&\s*\{\s*\n/g, (m) => {
  const tail = m;
  // injeta apenas se não houver no bloco inteiro (heurística simples)
  if (s.includes("type PremiumPdfOptions") && (s.includes("fileName?: string") && s.includes("finalLogoUrl?: string"))) return tail;
  return tail + "  finalLogoUrl?: string;\n  fileName?: string;\n";
});

// 4) dentro da função generateMindsetFitPremiumPdf, criar variáveis internas "Used"
// e trocar usos para elas, sem afetar tipos.
const fnStart = /export\s+async\s+function\s+generateMindsetFitPremiumPdf\s*\(\s*opts:\s*PremiumPdfOptions\s*\)\s*:\s*Promise<\s*void\s*>\s*\{\s*\n/;

if (fnStart.test(s)) {
  // se já existir bloco, remove versões antigas para evitar duplicar
  s = s.replace(/\n\s*const\s+fileNameUsed\s*=\s*[\s\S]*?;\s*\n/g, "\n");
  s = s.replace(/\n\s*const\s+finalLogoUrlUsed\s*=\s*[\s\S]*?;\s*\n/g, "\n");

  // injeta no começo da função
  s = s.replace(fnStart, (m) => m + 
`  // ✅ defaults internos (callers NÃO precisam fornecer)
  const fileNameUsed = (opts as any)?.fileName ?? "${DEFAULT_FILENAME}";
  const finalLogoUrlUsed = (opts as any)?.finalLogoUrl ?? DEFAULT_LOGO_URL;

`);
}

// 5) garantir que toDataUrl use finalLogoUrlUsed (e não finalLogoUrl)
s = s.replace(/toDataUrl\(\s*finalLogoUrl\s*\)/g, "toDataUrl(finalLogoUrlUsed)");
s = s.replace(/toDataUrl\(\s*DEFAULT_LOGO_URL\s*\)/g, "toDataUrl(finalLogoUrlUsed)");
s = s.replace(/toDataUrl\(\s*["'][^"']*mindsetfit-logo\.(png|svg)["']\s*\)/g, "toDataUrl(finalLogoUrlUsed)");

// 6) onde o código usa fileName como var de runtime, força fileNameUsed
// (apenas chamadas comuns de download/salvar)
s = s.replace(/\bfileName\b/g, (m, offset) => {
  // evita mexer em tipos já corrigidos acima: heurística — não trocar dentro de "type/interface" blocks?
  // simples: se estiver perto de "type " ou "interface " nas 200 chars anteriores, não troca
  const pre = s.slice(Math.max(0, offset - 200), offset);
  if (/type\s+\w+|interface\s+\w+/.test(pre)) return m;
  return "fileNameUsed";
});

// 7) como o passo 6 pode ter trocado o próprio "fileNameUsed" em algumas regiões,
// normaliza: se virar "fileNameUsedUsed", corrige
s = s.replace(/fileNameUsedUsed/g, "fileNameUsed");

// 8) e também pode ter trocado "fileNameUsed" em trechos de tipo por engano, normaliza novamente:
s = s.replace(/\bfileNameUsed\b/g, "fileName").replace(/\bfinalLogoUrlUsed\b/g, "finalLogoUrl");

// Reaplica: dentro da função, manter var interna
if (fnStart.test(s)) {
  // dentro do corpo, usar novamente as vars internas
  // (troca somente após a assinatura da função)
  const idx = s.search(fnStart);
  if (idx >= 0) {
    const head = s.slice(0, idx);
    let body = s.slice(idx);

    // garantir variáveis internas existam
    if (!body.includes("const fileNameUsed =")) {
      body = body.replace(fnStart, (m) => m + 
`  const fileNameUsed = (opts as any)?.fileName ?? "${DEFAULT_FILENAME}";
  const finalLogoUrlUsed = (opts as any)?.finalLogoUrl ?? DEFAULT_LOGO_URL;

`);
    }

    // no corpo: usar fileNameUsed e finalLogoUrlUsed
    body = body.replace(/\bfileName\b/g, "fileNameUsed");
    body = body.replace(/\bfinalLogoUrl\b/g, "finalLogoUrlUsed");
    body = body.replace(/fileNameUsedUsed/g, "fileNameUsed");
    body = body.replace(/finalLogoUrlUsedUsed/g, "finalLogoUrlUsed");

    s = head + body;
  }
}

fs.writeFileSync(abs, s, "utf8");
console.log("✅ FIX aplicado (tipos + defaults internos):", FILE);
