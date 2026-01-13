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
  if(!exists(rel)) return {changed:false};
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

/* (A) BrandIcon blindado: default + named export real */
const brandIconPath = "src/components/branding/BrandIcon.tsx";
const brandIconNext = `type Props = {
  size?: number;
  className?: string;
  alt?: string;
};

export function BrandIcon({ size = 28, className = "", alt = "MindsetFit" }: Props) {
  return (
    <img
      src="${LOGO_URL}"
      width={size}
      height={size}
      alt={alt}
      className={className}
      style={{ display: "block" }}
      loading="eager"
      decoding="async"
    />
  );
}

export default BrandIcon;
`;
if (!exists(brandIconPath) || read(brandIconPath).trim() !== brandIconNext.trim()) {
  write(brandIconPath, brandIconNext);
  console.log("✅ Rewritten:", brandIconPath);
  changes++;
}

/* (B) PremiumPdfOptions: localizar definição real e adicionar campos */
const srcFiles = walk("src").filter(f => /\.(ts|tsx)$/.test(f));
let pdfTypePatched = 0;

function ensureFields(block){
  const hasLogo = /logoUrl\s*\?:\s*string/.test(block);
  const hasFile = /fileName\s*\?:\s*string/.test(block);
  if (hasLogo && hasFile) return { block, changed:false };
  const injected = block.replace(/\{\s*\n/, m => {
    let add = "";
    if (!hasLogo) add += "  logoUrl?: string;\n";
    if (!hasFile) add += "  fileName?: string;\n";
    return m + add;
  });
  return { block: injected, changed:true };
}

for (const f of srcFiles) {
  const r = patchFile(f, (s) => {
    let changed = false;
    s = s.replace(/export\s+interface\s+PremiumPdfOptions\s*\{[\s\S]*?\n\}/g, m => {
      const o = ensureFields(m); if (o.changed) changed = true; return o.block;
    });
    s = s.replace(/export\s+type\s+PremiumPdfOptions\s*=\s*\{[\s\S]*?\n\}\s*;?/g, m => {
      const o = ensureFields(m); if (o.changed) changed = true; return o.block;
    });
    if (changed) pdfTypePatched++;
    return changed ? s : s;
  });
  if (r.changed) { console.log("✅ PremiumPdfOptions patched in:", f); changes++; }
}

/* (C) mindsetfitPdf.ts: usar logo padrão e evitar variáveis não usadas */
const pdfLibPath = "src/lib/pdf/mindsetfitPdf.ts";
const rC = patchFile(pdfLibPath, (s) => {
  if (!s.includes("const DEFAULT_LOGO_URL")) {
    s = `const DEFAULT_LOGO_URL = "${LOGO_URL}";\n` + s;
  }
  if (!s.includes("finalLogoUrl")) {
    s = s.replace(
      /(const\s*\{\s*[^}]*\}\s*=\s*options[^\n]*;)/m,
      m => m + `\n  const finalLogoUrl = (options as any)?.logoUrl ?? DEFAULT_LOGO_URL;\n`
    );
  }
  s = s.replace(/\blogoUrl\b/g, "finalLogoUrl");
  s = s.replace(/\{\s*finalLogoUrl\s*,/g, "{ logoUrl,");
  s = s.replace(/,\s*finalLogoUrl\s*\}/g, ", logoUrl }");
  return s;
});
if (rC.changed) { console.log("✅ Patched:", pdfLibPath); changes++; }

/* (D) Fallback: remover fileName se tipo não existir */
if (pdfTypePatched === 0) {
  const callsites = [
    "src/features/fitness-suite/modules/dashboard/DashboardPro.tsx",
    "src/pages/CardioPlan.tsx",
    "src/pages/EditDiet.tsx",
    "src/pages/HiitPlan.tsx",
    "src/pages/TreinoAtivo.tsx",
    "src/lib/pdf/mindsetfitPdf.ts",
  ];
  for (const f of callsites) {
    const r = patchFile(f, s =>
      s.replace(/\n\s*fileName\s*:\s*["'][^"']*["']\s*,?/g, "")
       .replace(/\n\s*fileName\s*,/g, "")
       .replace(/\bfileName\s*,\s*/g, "")
       .replace(/,\s*fileName\b/g, "")
    );
    if (r.changed) { console.log("✅ Removed fileName fallback in:", f); changes++; }
  }
}

/* (E) Corrigir logoUrl shorthand */
const logoTargets = [
  "src/features/fitness-suite/modules/dashboard/DashboardPro.tsx",
  "src/pages/CardioPlan.tsx",
  "src/pages/EditDiet.tsx",
  "src/pages/HiitPlan.tsx",
  "src/pages/TreinoAtivo.tsx",
];
for (const f of logoTargets) {
  const r = patchFile(f, s => s.replace(/(\n\s*)logoUrl\s*,/g, `$1logoUrl: "${LOGO_URL}",`));
  if (r.changed) { console.log("✅ logoUrl fixed in:", f); changes++; }
}

/* (F) Onboarding JSX corrompido -> corrigir */
const onboardingPath = "src/pages/OnboardingFlow.tsx";
const rF = patchFile(onboardingPath, (s) =>
  s.replace(
    /onIndexChange=\{\(idx\)\s*=\s*onFinish=\{finalizeOnboarding\}\>\s*updateState\(\{\s*etapaAtual:\s*idx\s*\+\s*1\s*\}\)\s*\}/g,
    'onIndexChange={(idx) => updateState({ etapaAtual: idx + 1 })} onFinish={finalizeOnboarding}'
  )
);
if (rF.changed) { console.log("✅ Fixed JSX:", onboardingPath); changes++; }

console.log(`\n==> FIX v2 DONE ✅ | alterações: ${changes}\n`);
