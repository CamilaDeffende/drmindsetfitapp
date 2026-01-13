import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const LOGO_URL = "/brand/mindsetfit-logo.svg";

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
function walk(dir){
  const out = [];
  const abs = p(dir);
  if(!fs.existsSync(abs)) return out;
  for(const ent of fs.readdirSync(abs, {withFileTypes:true})){
    if(ent.name.startsWith(".") || ent.name === "node_modules" || ent.name === "dist") continue;
    const rel = path.join(dir, ent.name);
    const full = p(rel);
    if(ent.isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

let changes = 0;

//
// (A) BrandIcon: corrigir export/import sem quebrar nada
// - remover import React (TS6133)
// - manter default export
// - adicionar named export: export { default as BrandIcon }
//   (assim os imports { BrandIcon } continuam funcionando)
//
const brandIconPath = "src/components/branding/BrandIcon.tsx";
const rA = patchFile(brandIconPath, (s) => {
  // remove import React se existir
  s = s.replace(/^\s*import\s+React\s+from\s+["']react["'];\s*\n/m, "");

  // se já tiver named export, ok
  const hasNamed = /export\s*\{\s*default\s+as\s+BrandIcon\s*\}\s*;?/m.test(s);

  if (!hasNamed) {
    // adiciona named export no fim, mantendo default export intacto
    s = s.replace(/\n*$/, "\n\nexport { default as BrandIcon };\n");
  }

  return s;
});
if (rA.changed) { console.log("✅ Patched:", brandIconPath); changes++; }
else console.log("ℹ️ Sem mudança:", brandIconPath);

//
// (B) PremiumPdfOptions: permitir fileName (e logoUrl opcional) no tipo
// Objetivo: manter a feature de nome do PDF sem brigar com TS.
//
const pdfLibPath = "src/lib/pdf/mindsetfitPdf.ts";
const rB = patchFile(pdfLibPath, (s) => {
  // 1) garantir que PremiumPdfOptions tenha fileName?: string e logoUrl?: string
  // Vamos procurar "export type PremiumPdfOptions" ou "export interface PremiumPdfOptions"
  // e inserir campos caso não existam.
  if (/PremiumPdfOptions/.test(s)) {
    // interface
    if (/export\s+interface\s+PremiumPdfOptions\s*\{/.test(s)) {
      const hasFileName = /fileName\s*\?:\s*string/.test(s);
      const hasLogoUrl  = /logoUrl\s*\?:\s*string/.test(s);

      if (!hasFileName || !hasLogoUrl) {
        s = s.replace(/export\s+interface\s+PremiumPdfOptions\s*\{\s*\n/, (m) => {
          let add = "";
          if (!hasLogoUrl) add += "  logoUrl?: string;\n";
          if (!hasFileName) add += "  fileName?: string;\n";
          return m + add;
        });
      }
    }

    // type
    if (/export\s+type\s+PremiumPdfOptions\s*=\s*\{/.test(s)) {
      const hasFileName = /fileName\s*\?:\s*string/.test(s);
      const hasLogoUrl  = /logoUrl\s*\?:\s*string/.test(s);

      if (!hasFileName || !hasLogoUrl) {
        s = s.replace(/export\s+type\s+PremiumPdfOptions\s*=\s*\{\s*\n/, (m) => {
          let add = "";
          if (!hasLogoUrl) add += "  logoUrl?: string;\n";
          if (!hasFileName) add += "  fileName?: string;\n";
          return m + add;
        });
      }
    }
  }

  // 2) em caso de destructuring interno de options, garantir default do logoUrl
  // ex: const { logoUrl, ... } = options
  // e depois usa logoUrl -> se undefined, fallback para LOGO_URL
  if (!s.includes("const DEFAULT_LOGO_URL")) {
    s = s.replace(
      /(^|\n)(export\s+)?(async\s+)?function\s+/,
      (m) => `\nconst DEFAULT_LOGO_URL = "${LOGO_URL}";\n\n` + m
    );
  }

  // Se houver "logoUrl" usado sem fallback, adiciona: const finalLogoUrl = logoUrl ?? DEFAULT_LOGO_URL;
  if (!s.includes("finalLogoUrl")) {
    s = s.replace(
      /(const\s*\{\s*[^}]*logoUrl[^}]*\}\s*=\s*options\s*;)/m,
      (m) => m + `\n  const finalLogoUrl = (logoUrl ?? DEFAULT_LOGO_URL);\n`
    );
    // também cobre destructuring com "options || {}"
    s = s.replace(
      /(const\s*\{\s*[^}]*logoUrl[^}]*\}\s*=\s*options\s*\|\|\s*\{\}\s*;)/m,
      (m) => m + `\n  const finalLogoUrl = (logoUrl ?? DEFAULT_LOGO_URL);\n`
    );
  }

  // troca usos diretos de logoUrl por finalLogoUrl quando apropriado (somente onde já existir)
  if (s.includes("finalLogoUrl")) {
    s = s.replace(/\blogoUrl\b/g, "finalLogoUrl");
    // mas isso pode afetar destructuring; reverte o destructuring para logoUrl local:
    s = s.replace(/\{\s*finalLogoUrl\s*,/g, "{ logoUrl,");
    s = s.replace(/,\s*finalLogoUrl\s*\}/g, ", logoUrl }");
  }

  return s;
});
if (rB.changed) { console.log("✅ Patched:", pdfLibPath); changes++; }
else console.log("ℹ️ Sem mudança:", pdfLibPath);

//
// (C) Corrigir "logoUrl," shorthand sem variável em páginas/arquivos
// - substituir "logoUrl," por "logoUrl: '/brand/mindsetfit-logo.svg',"
// - garantir que onde existe "fileName" continue funcionando (tipo já foi ajustado)
//
const targets = [
  "src/features/fitness-suite/modules/dashboard/DashboardPro.tsx",
  "src/pages/CardioPlan.tsx",
  "src/pages/EditDiet.tsx",
  "src/pages/HiitPlan.tsx",
  "src/pages/TreinoAtivo.tsx",
];

for (const f of targets) {
  const r = patchFile(f, (s) => {
    // substitui shorthand comum em objetos
    s = s.replace(/(\n\s*)logoUrl\s*,/g, `$1logoUrl: "${LOGO_URL}",`);
    return s;
  });
  if (r.changed) { console.log("✅ Patched:", f); changes++; }
  else console.log("ℹ️ Sem mudança:", f);
}

//
// (D) OnboardingFlow: finalizeOnboarding não usado
// - plugar finalizeOnboarding no componente de shell/carrossel
// - não quebra layout: só adiciona prop se não existir
//
const onboardingPath = "src/pages/OnboardingFlow.tsx";
const rD = patchFile(onboardingPath, (s) => {
  if (!s.includes("finalizeOnboarding")) return s;

  // tenta achar o JSX do shell/carrossel e garantir onFinish
  // 1) se já existe onFinish/onComplete, aponta para finalizeOnboarding
  if (s.match(/onFinish=\{/)) {
    s = s.replace(/onFinish=\{[^}]*\}/g, "onFinish={finalizeOnboarding}");
    return s;
  }
  if (s.match(/onComplete=\{/)) {
    s = s.replace(/onComplete=\{[^}]*\}/g, "onComplete={finalizeOnboarding}");
    return s;
  }

  // 2) se não existe, injeta na primeira ocorrência de <OnboardingCarouselShell ...>
  s = s.replace(
    /<OnboardingCarouselShell(\s[^>]*)?>/m,
    (m) => {
      if (m.includes("onFinish=") || m.includes("onComplete=")) return m;
      // injeta antes do fechamento >
      if (m.endsWith("/>")) {
        return m.replace("/>", ` onFinish={finalizeOnboarding} />`);
      }
      return m.replace(">", ` onFinish={finalizeOnboarding}>`);
    }
  );

  return s;
});
if (rD.changed) { console.log("✅ Patched:", onboardingPath); changes++; }
else console.log("ℹ️ Sem mudança:", onboardingPath);

//
// (E) Opcional: garantir que o SVG exista (só pra segurança)
//
const svgPath = "public/brand/mindsetfit-logo.svg";
if (!exists(svgPath)) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MindsetFit">
  <defs>
    <linearGradient id="mf" x1="40" y1="40" x2="216" y2="216" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#00A3FF"/>
      <stop offset="1" stop-color="#0077FF"/>
    </linearGradient>
  </defs>
  <path d="M64 192V64h28l20 44 20-44h28v128h-24V108l-18 40h-12l-18-40v84H64z" fill="url(#mf)"/>
  <path d="M176 192V64h72v22h-48v30h42v22h-42v54h-24z" fill="url(#mf)" opacity="0.92"/>
</svg>
`;
  write(svgPath, svg);
  console.log("✅ Criado (fallback):", svgPath);
  changes++;
}

console.log(`\n==> FIX DONE ✅ | alterações: ${changes}\n`);
