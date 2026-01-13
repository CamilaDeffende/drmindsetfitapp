import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const LOGO_PUBLIC = "/brand/mindsetfit-logo.svg";
const DEFAULT_FILENAME = "Relatorio-MindsetFit-Premium.pdf";

function p(rel){ return path.join(ROOT, rel); }
function exists(rel){ return fs.existsSync(p(rel)); }
function read(rel){ return fs.readFileSync(p(rel), "utf8"); }
function write(rel, s){
  fs.mkdirSync(path.dirname(p(rel)), { recursive: true });
  fs.writeFileSync(p(rel), s, "utf8");
}
function patchFile(rel, fn){
  if(!exists(rel)) return {changed:false, reason:"missing"};
  const before = read(rel);
  const after = fn(before);
  if(after !== before){
    write(rel, after);
    return {changed:true};
  }
  return {changed:false};
}

let changes = 0;

/** (A) DashboardPro: remover qualquer `logoUrl,` / `logoUrl:` (não existe no tipo) */
const dash = "src/features/fitness-suite/modules/dashboard/DashboardPro.tsx";
{
  const r = patchFile(dash, (s) => {
    // remove shorthand `logoUrl,`
    s = s.replace(/\n[ \t]*logoUrl\s*,\s*/g, "\n");
    // remove `logoUrl: "..."` (com ou sem vírgula)
    s = s.replace(/\n[ \t]*logoUrl\s*:\s*["'][^"']*["']\s*,?/g, "");
    // remove import antigo se sobrar
    s = s.replace(/^\s*import\s+logoUrl\s+from\s+["'][^"']*mindsetfit-logo\.(png|svg)["'];\s*\n/m, "");
    return s;
  });
  if (r.changed) { console.log("✅ Patched:", dash); changes++; }
}

/** (B) mindestfitPdf.ts: corrigir TIPOS e defaults internos (finalLogoUrl + fileName opcionais) */
const pdf = "src/lib/pdf/mindsetfitPdf.ts";
{
  const r = patchFile(pdf, (s) => {
    // garante DEFAULT_LOGO_URL e usa de verdade
    if (!s.includes("const DEFAULT_LOGO_URL")) {
      s = `const DEFAULT_LOGO_URL = "${LOGO_PUBLIC}";\n` + s;
    } else {
      s = s.replace(/const DEFAULT_LOGO_URL\s*=\s*["'][^"']*["'];/g, `const DEFAULT_LOGO_URL = "${LOGO_PUBLIC}";`);
    }

    // 1) Tornar MindsetFitPdfOptions aceitar fileName/finalLogoUrl opcionais (e logoUrl opcional p/ compat)
    // pega o bloco do type/interface MindsetFitPdfOptions e injeta chaves se não existirem
    const injectFields = (block) => {
      const hasFileName = /\bfileName\s*\??:\s*string/.test(block);
      const hasFinalLogo = /\bfinalLogoUrl\s*\??:\s*string/.test(block);
      const hasLogoUrl = /\blogoUrl\s*\??:\s*string/.test(block);
      if (hasFileName && hasFinalLogo && hasLogoUrl) return { block, changed:false };

      const out = block.replace(/\{\s*\n/, (m) => {
        let add = "";
        if (!hasFinalLogo) add += "  finalLogoUrl?: string;\n";
        if (!hasLogoUrl) add += "  logoUrl?: string;\n";
        if (!hasFileName) add += "  fileName?: string;\n";
        return m + add;
      });
      return { block: out, changed:true };
    };

    // interface
    s = s.replace(/(export\s+)?interface\s+MindsetFitPdfOptions\s*\{[\s\S]*?\n\}/g, (m) => injectFields(m).block);
    // type
    s = s.replace(/(export\s+)?type\s+MindsetFitPdfOptions\s*=\s*\{[\s\S]*?\n\}\s*;?/g, (m) => injectFields(m).block);

    // 2) Remover destructuring problemático de logoUrl/finalLogoUrl/fileName que gera unused/undefined
    // Ex: const { logoUrl, ... } = opts;
    s = s.replace(/const\s*\{\s*logoUrl\s*,/g, "const { ");
    s = s.replace(/,\s*logoUrl\s*\}/g, " }");
    s = s.replace(/const\s*\{\s*finalLogoUrl\s*,/g, "const { ");
    s = s.replace(/,\s*finalLogoUrl\s*\}/g, " }");
    s = s.replace(/const\s*\{\s*fileName\s*,/g, "const { ");
    s = s.replace(/,\s*fileName\s*\}/g, " }");

    // 3) Garantir dentro de generateMindsetFitPremiumPdf: definir fileNameUsed + finalLogoUrlUsed
    // Inserir logo após a abertura da função (primeira ocorrência)
    const fnRe = /export\s+async\s+function\s+generateMindsetFitPremiumPdf\s*\(\s*opts:\s*PremiumPdfOptions\s*\)\s*:\s*Promise<\s*void\s*>\s*\{\s*\n/;
    if (fnRe.test(s) && !s.includes("const fileNameUsed =")) {
      s = s.replace(fnRe, (m) =>
        m +
        `  // ✅ defaults internos (callers não precisam fornecer)
  const fileNameUsed = (opts as any)?.fileName ?? "${DEFAULT_FILENAME}";
  const finalLogoUrlUsed = (opts as any)?.finalLogoUrl ?? (opts as any)?.logoUrl ?? DEFAULT_LOGO_URL;

`
      );
    }

    // 4) Trocar qualquer uso de finalLogoUrl (variável inexistente) por finalLogoUrlUsed
    s = s.replace(/\bfinalLogoUrl\b/g, "finalLogoUrlUsed");

    // 5) Se existir `toDataUrl(...)` com algo não confiável, força finalLogoUrlUsed
    s = s.replace(/toDataUrl\(\s*finalLogoUrlUsed\s*\)/g, "toDataUrl(finalLogoUrlUsed)");
    s = s.replace(/toDataUrl\(\s*DEFAULT_LOGO_URL\s*\)/g, "toDataUrl(finalLogoUrlUsed)");
    s = s.replace(/toDataUrl\(\s*["'][^"']*mindsetfit-logo\.(png|svg)["']\s*\)/g, "toDataUrl(finalLogoUrlUsed)");

    // 6) Se tiver alguma lógica antiga usando `fileName` diretamente, substitui por fileNameUsed
    s = s.replace(/\bfileName\b/g, "fileNameUsed");

    // 7) Se DEFAULT_LOGO_URL ainda estiver “unused”, garante uso mínimo (mas já usamos em finalLogoUrlUsed)
    return s;
  });

  if (r.changed) { console.log("✅ Patched:", pdf); changes++; }
}

/** (C) Páginas: remover quaisquer referências a fileName local (evita TS6133) */
const pages = [
  "src/pages/CardioPlan.tsx",
  "src/pages/EditDiet.tsx",
  "src/pages/HiitPlan.tsx",
  "src/pages/TreinoAtivo.tsx",
];
for (const f of pages) {
  const r = patchFile(f, (s) => {
    // remove "const fileName = ..."
    s = s.replace(/\n[ \t]*const\s+fileName\s*=\s*[^;]+;\s*/g, "\n");
    // remove propriedades fileName: "..."
    s = s.replace(/\n[ \t]*fileName\s*:\s*["'][^"']*["']\s*,?/g, "");
    // remove shorthand fileName,
    s = s.replace(/\n[ \t]*fileName\s*,\s*/g, "\n");
    return s;
  });
  if (r.changed) { console.log("✅ Cleaned fileName in:", f); changes++; }
}

/** (D) HiitPlan: remover function slug não usada (TS6133) */
{
  const f = "src/pages/HiitPlan.tsx";
  const r = patchFile(f, (s) => {
    // remove exatamente o bloco function slug(...) { ... }
    s = s.replace(/\nfunction\s+slug\s*\([^)]*\)\s*\{[\s\S]*?\n\}\n/g, "\n");
    return s;
  });
  if (r.changed) { console.log("✅ Removed unused slug() in:", f); changes++; }
}

console.log(`\n==> FIX PDF/DASH/HIIT DONE ✅ | alterações: ${changes}\n`);
