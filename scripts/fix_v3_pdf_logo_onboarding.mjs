import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const LOGO_PUBLIC_URL = "/brand/mindsetfit-logo.svg";

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

const targetsRemoveLogoUrl = [
  "src/features/fitness-suite/modules/dashboard/DashboardPro.tsx",
  "src/pages/CardioPlan.tsx",
  "src/pages/EditDiet.tsx",
  "src/pages/HiitPlan.tsx",
  "src/pages/TreinoAtivo.tsx",
];

// (A) Remover props `logoUrl: "...",` (tipo não suporta). O PDF vai usar logo fixo internamente.
for (const f of targetsRemoveLogoUrl) {
  const r = patchFile(f, (s) => {
    // remove linhas logoUrl: "..." (com ou sem vírgula)
    s = s.replace(/\n[ \t]*logoUrl\s*:\s*["'][^"']*["']\s*,?/g, "");
    // remove shorthand logoUrl,
    s = s.replace(/\n[ \t]*logoUrl\s*,\s*/g, "\n");
    // troca referência antiga png -> svg só por garantia
    s = s.replace(/mindsetfit-logo\.png/g, "mindsetfit-logo.svg");
    return s;
  });
  if (r.changed) { console.log("✅ Removed logoUrl in:", f); changes++; }
}

// (B) DashboardPro: remover import logoUrl (não usado)
{
  const f = "src/features/fitness-suite/modules/dashboard/DashboardPro.tsx";
  const r = patchFile(f, (s) => {
    s = s.replace(/^\s*import\s+logoUrl\s+from\s+["'][^"']*mindsetfit-logo\.svg["'];\s*\n/m, "");
    s = s.replace(/^\s*import\s+logoUrl\s+from\s+["'][^"']*mindsetfit-logo\.png["'];\s*\n/m, "");
    return s;
  });
  if (r.changed) { console.log("✅ Removed unused logoUrl import:", f); changes++; }
}

// (C) Remover variáveis fileName não usadas (Cardio/Hiit) e qualquer passagem residual `fileName`
const targetsRemoveFileName = [
  "src/pages/CardioPlan.tsx",
  "src/pages/HiitPlan.tsx",
  "src/pages/TreinoAtivo.tsx",
  "src/pages/EditDiet.tsx",
  "src/features/fitness-suite/modules/dashboard/DashboardPro.tsx",
  "src/lib/pdf/mindsetfitPdf.ts",
];

for (const f of targetsRemoveFileName) {
  const r = patchFile(f, (s) => {
    // remove linha: const fileName = "....";
    s = s.replace(/\n[ \t]*const\s+fileName\s*=\s*[^;]+;\s*/g, "\n");
    // remove propriedades de objeto fileName: "..."
    s = s.replace(/\n[ \t]*fileName\s*:\s*["'][^"']*["']\s*,?/g, "");
    // remove shorthand fileName,
    s = s.replace(/\n[ \t]*fileName\s*,\s*/g, "\n");
    // remove destructuring "fileName" de objetos
    s = s.replace(/\bfileName\s*,\s*/g, "");
    s = s.replace(/,\s*fileName\b/g, "");
    return s;
  });
  if (r.changed) { console.log("✅ Removed fileName in:", f); changes++; }
}

// (D) Corrigir mindestfitPdf.ts: fixar logo internamente e remover restos quebrados
{
  const f = "src/lib/pdf/mindsetfitPdf.ts";
  const r = patchFile(f, (s) => {
    // remove DEFAULT_LOGO_URL se existir (estava causando TS6133)
    s = s.replace(/^\s*const\s+DEFAULT_LOGO_URL\s*=\s*["'][^"']+["'];\s*\n/m, "");

    // remover referências a finalLogoUrl/fileName remanescentes
    s = s.replace(/\bfinalLogoUrl\b/g, `"${LOGO_PUBLIC_URL}"`);
    s = s.replace(/\bfileName\b/g, `undefined`);

    // se existir destructuring { logoUrl, ... } remover logoUrl
    s = s.replace(/\{\s*logoUrl\s*,/g, "{ ");
    s = s.replace(/,\s*logoUrl\s*\}/g, " }");
    s = s.replace(/\blogoUrl\b/g, "undefined");

    // garantir que a função de logo (toDataUrl) receba a URL fixa:
    // troca chamadas toDataUrl(...) por toDataUrl("/brand/...svg") quando estiver usando variável inexistente
    s = s.replace(/toDataUrl\(\s*undefined\s*\)/g, `toDataUrl("${LOGO_PUBLIC_URL}")`);

    // garantia extra: se houver uma string de logo local antiga, troca pra public
    s = s.replace(/["'][^"']*assets\/branding\/mindsetfit-logo\.(png|svg)["']/g, `"${LOGO_PUBLIC_URL}"`);

    return s;
  });
  if (r.changed) { console.log("✅ Hardened:", f); changes++; }
}

// (E) OnboardingFlow: remover onFinish inválido e finalizar pelo onNext quando chegar na última etapa
{
  const f = "src/pages/OnboardingFlow.tsx";
  const r = patchFile(f, (s) => {
    // remove onFinish={finalizeOnboarding} se tiver sido injetado
    s = s.replace(/\s+onFinish=\{finalizeOnboarding\}/g, "");

    // garantir wrapper de onNext: se está na última etapa, finaliza; senão avança
    // tenta padrão: onNext={() => updateState({ etapaAtual: etapaAtual + 1 })}
    s = s.replace(
      /onNext=\{\(\)\s*=>\s*updateState\(\{\s*etapaAtual:\s*etapaAtual\s*\+\s*1\s*\}\)\s*\}\}/g,
      'onNext={() => { if (etapaAtual >= steps.length - 1) { finalizeOnboarding(); return; } updateState({ etapaAtual: etapaAtual + 1 }); }}'
    );

    // tenta padrão alternativo: onNext={() => updateState({ etapaAtual: idx + 1 })} (raro)
    s = s.replace(
      /onNext=\{\(\)\s*=>\s*updateState\(\{\s*etapaAtual:\s*([a-zA-Z_$][\w$]*)\s*\+\s*1\s*\}\)\s*\}\}/g,
      'onNext={() => { if (etapaAtual >= steps.length - 1) { finalizeOnboarding(); return; } updateState({ etapaAtual: etapaAtual + 1 }); }}'
    );

    return s;
  });
  if (r.changed) { console.log("✅ Fixed onboarding finish:", f); changes++; }
}

console.log(`\n==> FIX v3 DONE ✅ | alterações: ${changes}\n`);
