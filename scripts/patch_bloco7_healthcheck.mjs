import fs from "node:fs";

function must(cond, msg){ if(!cond){ console.error("❌", msg); process.exit(1);} }
function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.writeFileSync(p,s,"utf8"); }

const targets = [
  "src/pages/Report.tsx",
  "src/components/steps/Step8Relatorio.tsx"
];

for (const t of targets) must(fs.existsSync(t), "Arquivo alvo ausente: " + String(t));

const MARK = "MF_BLOCO7_HEALTHCHECK_V1";

function patchReport() {
  const p = "src/pages/Report.tsx";
  let s = read(p);
  const before = s;

  if (s.includes(MARK)) return;

  // injeta helper local, sem depender de imports
  const helper = "\n  // " + String(MARK) + "\n  function __mfHealthcheckReport(state: any){\n    const perfil = state?.perfil ?? state?.userProfile ?? null;\n    const avaliacao = perfil?.avaliacao ?? state?.avaliacao ?? null;\n    const metabolismo = (state?.metabolismo ?? perfil?.metabolismo ?? perfil?.calculoMetabolico ?? state?.calculoMetabolico ?? null) as any;\n    const dieta = (state?.dietaAtiva ?? state?.dieta ?? perfil?.dieta ?? null) as any;\n\n    const issues: { level: \"ok\"|\"warn\"; key: string; msg: string }[] = [];\n    const ok = (key: string, msg: string) => issues.push({ level: \"ok\", key, msg });\n    const warn = (key: string, msg: string) => issues.push({ level: \"warn\", key, msg });\n\n    if (!perfil) warn(\"perfil\", \"Perfil não encontrado (estado incompleto).\");\n    else ok(\"perfil\", \"Perfil carregado.\");\n\n    if (!avaliacao) warn(\"avaliacao\", \"Avaliação física ausente. Alguns cálculos podem ficar genéricos.\");\n    else ok(\"avaliacao\", \"Avaliação carregada.\");\n\n    // FAF\n    const freq = avaliacao?.frequenciaAtividadeSemanal ?? null;\n    if (!freq) warn(\"faf_freq\", \"Frequência semanal não informada (FAF padrão aplicado).\");\n    else ok(\"faf_freq\", \"Frequência semanal: \" . String(freq));\n\n    // Metabolismo / GET\n    if (!metabolismo) warn(\"metabolismo\", \"Metabolismo não encontrado no estado. Relatório pode ficar incompleto.\");\n    else {\n      ok(\"metabolismo\", \"Metabolismo disponível.\");\n      const tmb = Number(metabolismo?.tmb ?? NaN);\n      const get = Number(metabolismo?.get ?? metabolismo?.caloriasManutencao ?? NaN);\n      const fafFinal = Number(metabolismo?.fafFinal ?? metabolismo?.faf ?? NaN);\n      if (Number.isFinite(tmb) && Number.isFinite(get) && Number.isFinite(fafFinal)) {\n        const expected = Math.round(tmb * fafFinal);\n        const delta = Math.abs(expected - get);\n        if (delta > 25) warn(\"get_consistencia\", \"GET parece inconsistente (Δ≈\" . String(delta) . \" kcal).\");\n        else ok(\"get_consistencia\", \"GET consistente com TMB×FAF.\");\n      } else {\n        warn(\"get_consistencia\", \"Não foi possível auditar GET/TMB/FAF (valores ausentes).\");\n      }\n    }\n\n    // Dieta / macros (se existir)\n    const kcal = Number(dieta?.calorias ?? dieta?.kcal ?? NaN);\n    const pG = Number(dieta?.proteinas ?? dieta?.proteina ?? NaN);\n    const cG = Number(dieta?.carboidratos ?? dieta?.carboidrato ?? NaN);\n    const gG = Number(dieta?.gorduras ?? dieta?.gordura ?? NaN);\n\n    if (Number.isFinite(kcal) && Number.isFinite(pG) && Number.isFinite(cG) && Number.isFinite(gG)) {\n      const kcalFromMacros = Math.round(pG*4 + cG*4 + gG*9);\n      const delta = Math.abs(kcalFromMacros - kcal);\n      if (delta > 50) warn(\"kcal_macros\", \"Kcal vs macros com diferença (Δ≈\" . String(delta) . \" kcal).\");\n      else ok(\"kcal_macros\", \"Kcal coerente com macros.\");\n    } else {\n      warn(\"kcal_macros\", \"Não foi possível auditar macros/kcal (dieta parcial).\");\n    }\n\n    return { perfil, avaliacao, metabolismo, dieta, issues };\n  }\n";

  // inserir helper logo após o primeiro "const state = ..."
  if (s.includes("const state =")) {
    s = s.replace(/(const\s+state\s*=\s*use\w+Store\([^;]*\);\s*\n)/, "$1" + String(helper) + "\\n");
  } else {
    // fallback: antes do return
    s = s.replace(/return\s*\(/, String(helper) + "\\n  return (");
  }

  // criar healthcheck no escopo do componente (apenas 1 vez)
  if (!s.includes("const __mfHC = __mfHealthcheckReport(state);")) {
    s = s.replace(/return\s*\(/, "  const __mfHC = __mfHealthcheckReport(state);\\n  return (" );
  }

  // inserir bloco UI premium (minimiza layout e não quebra)
  if (!s.includes("MF_BLOCO7_HEALTHCHECK_UI")) {
    const ui = "\n      {/* MF_BLOCO7_HEALTHCHECK_UI */}\n      <div className=\"mt-4 rounded-xl border border-white/10 bg-white/5 p-4\">\n        <div className=\"flex items-center justify-between gap-3\">\n          <div>\n            <div className=\"text-sm font-semibold\">HealthCheck Premium</div>\n            <div className=\"text-xs text-muted-foreground\">Auditoria rápida de consistência (sem travar sua experiência).</div>\n          </div>\n          <div className=\"text-xs text-muted-foreground\">{(__mfHC.issues?.filter((x:any)=>x.level===\"warn\")?.length ?? 0)} alertas</div>\n        </div>\n        <div className=\"mt-3 space-y-1\">\n          {(__mfHC.issues ?? []).slice(0, 8).map((it:any) => (\n            <div key={it.key} className=\"flex items-start justify-between gap-3 text-xs\">\n              <span className={it.level === \"warn\" ? \"text-amber-300\" : \"text-emerald-300\"}>{it.level === \"warn\" ? \"• Atenção\" : \"• OK\"}</span>\n              <span className=\"flex-1 text-muted-foreground\">{it.msg}</span>\n            </div>\n          ))}\n        </div>\n      </div>\n    ";
    // âncora: insere antes do heading de Plano Nutricional se existir
    if (/\bPlano\s+Nutricional\b/.test(s)) s = s.replace(/(\bPlano\s+Nutricional\b)/m, ui + "\n$1");
    else s = s.replace(/return\s*\(\s*<div[^>]*>/m, (m)=> m + "\n" + ui);
  }

  // sanity
  must(s.includes(MARK), "Report: marker não inserido");
  must(s.includes("__mfHealthcheckReport"), "Report: helper não inserido");
  must(s.includes("const __mfHC = __mfHealthcheckReport(state);"), "Report: __mfHC não criado");

  if (s !== before) write(p, s);
  console.log("✅ Patched:", p);
}

function patchStep8Relatorio() {
  const p = "src/components/steps/Step8Relatorio.tsx";
  let s = read(p);
  const before = s;

  if (s.includes("MF_BLOCO7_STEP8_HINT")) return;

  // só uma nota premium (não mexe em lógica)
  s = s.replace(
    /(<CardDescription[^>]*>)([\s\S]*?)(<\/CardDescription>)/m,
    (m,a,b,c)=> String(a) + String(b) + " <span className=\"text-xs text-muted-foreground\">• MF_BLOCO7_STEP8_HINT: No relatório final, você verá a auditoria premium (TMB, FAF, GET e consistência kcal↔macros).</span>" + String(c)
  );

  if (s !== before) write(p, s);
  console.log("✅ Patched:", p);
}

patchReport();
patchStep8Relatorio();
console.log("🎯 BLOCO 7 patch (HealthCheck + UX) aplicado com sucesso.");
