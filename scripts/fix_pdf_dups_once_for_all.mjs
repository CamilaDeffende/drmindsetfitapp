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

// backup
const backup = path.join(ROOT, ".scan", "backup-mindsetfitPdf.ts");
fs.writeFileSync(backup, s, "utf8");
console.log("✅ Backup criado:", backup);

// garantir DEFAULT_LOGO_URL
if (!s.includes("const DEFAULT_LOGO_URL")) {
  s = `const DEFAULT_LOGO_URL = "${LOGO_PUBLIC}";\n` + s;
} else {
  s = s.replace(/const DEFAULT_LOGO_URL\s*=\s*["'][^"']+["'];/g, `const DEFAULT_LOGO_URL = "${LOGO_PUBLIC}";`);
}

// 1) Remover declarações duplicadas obrigatórias dentro dos tipos
// remove linhas do tipo: finalLogoUrl: string;  e fileName: string; (mantemos a versão opcional)
s = s.replace(/\n[ \t]*finalLogoUrl\s*:\s*string\s*;[^\n]*\n/g, "\n");
s = s.replace(/\n[ \t]*fileName\s*:\s*string\s*;[^\n]*\n/g, "\n");

// se por acaso duplicou opcional também, mantém só a primeira ocorrência de cada dentro do arquivo
function keepFirstOptional(prop) {
  const re = new RegExp(`\\n([ \\t]*${prop}\\s*\\?:\\s*string\\s*;[^\\n]*\\n)`, "g");
  let seen = false;
  s = s.replace(re, (m, line) => {
    if (!seen) { seen = true; return "\n" + line; }
    return "\n";
  });
}
keepFirstOptional("finalLogoUrl");
keepFirstOptional("fileName");

// 2) Consertar quaisquer acessos errados opts.fileNameUsed/opts.finalLogoUrlUsed
s = s.replace(/\bfileNameUsed\b/g, "fileNameUsed"); // noop, só para clareza
s = s.replace(/\bfinalLogoUrlUsed\b/g, "finalLogoUrlUsed"); // noop
s = s.replace(/\(opts\s+as\s+any\)\?\.\s*fileNameUsed/g, "(opts as any)?.fileName");
s = s.replace(/\(opts\s+as\s+any\)\?\.\s*finalLogoUrlUsed/g, "(opts as any)?.finalLogoUrl");

// 3) Colapsar múltiplos blocos duplicados de const fileNameUsed/finalLogoUrlUsed em um bloco único
const blockRe = /(?:\n[ \t]*\/\/\s*✅[^\n]*\n)?(?:\n[ \t]*const\s+fileNameUsed\s*=\s*[^\n]*\n[ \t]*const\s+finalLogoUrlUsed\s*=\s*[^\n]*\n)+/g;

const canonicalBlock =
`\n  // ✅ defaults internos (callers NÃO precisam fornecer)
  const fileNameUsed = (opts as any)?.fileName ?? "${DEFAULT_FILENAME}";
  const finalLogoUrlUsed = (opts as any)?.finalLogoUrl ?? (opts as any)?.logoUrl ?? DEFAULT_LOGO_URL;\n`;

let replacedOnce = false;
s = s.replace(blockRe, () => {
  if (replacedOnce) return "\n"; // remove os blocos extras
  replacedOnce = true;
  return canonicalBlock;
});

// 4) Se não encontrou bloco (por algum motivo), injeta no começo da função generateMindsetFitPremiumPdf
const fnStart = /export\s+async\s+function\s+generateMindsetFitPremiumPdf\s*\(\s*opts:\s*PremiumPdfOptions\s*\)\s*:\s*Promise<\s*void\s*>\s*\{\s*\n/;
if (!replacedOnce && fnStart.test(s)) {
  s = s.replace(fnStart, (m) => m + canonicalBlock);
  replacedOnce = true;
}

// 5) Garantir que toDataUrl use finalLogoUrlUsed
s = s.replace(/toDataUrl\(\s*finalLogoUrl\s*\)/g, "toDataUrl(finalLogoUrlUsed)");
s = s.replace(/toDataUrl\(\s*DEFAULT_LOGO_URL\s*\)/g, "toDataUrl(finalLogoUrlUsed)");
s = s.replace(/toDataUrl\(\s*["'][^"']*mindsetfit-logo\.(png|svg)["']\s*\)/g, "toDataUrl(finalLogoUrlUsed)");

// 6) Se existir alguma lógica tentando usar `fileName` direto como variável, manter apenas fileNameUsed no runtime
// Evita trocar dentro de tipos: só troca no corpo da função (após a assinatura)
const idx = s.search(fnStart);
if (idx >= 0) {
  const head = s.slice(0, idx);
  let body = s.slice(idx);

  // no corpo: substitui tokens "fileName" (variável) por "fileNameUsed" quando for identificador solto
  body = body.replace(/\bfileName\b/g, "fileNameUsed");
  // mas reverte em tipos/interface (não existem no body normalmente, mas por segurança)
  body = body.replace(/\bfileNameUsed\s*\?\s*:\s*string\b/g, "fileName?: string");
  body = body.replace(/\bfileNameUsed\s*:\s*string\b/g, "fileName: string");

  // finalLogoUrl idem
  body = body.replace(/\bfinalLogoUrl\b/g, "finalLogoUrlUsed");
  body = body.replace(/\bfinalLogoUrlUsed\s*\?\s*:\s*string\b/g, "finalLogoUrl?: string");
  body = body.replace(/\bfinalLogoUrlUsed\s*:\s*string\b/g, "finalLogoUrl: string");

  s = head + body;
}

fs.writeFileSync(abs, s, "utf8");
console.log("✅ FIX aplicado:", FILE);
