import fs from "node:fs";
import path from "node:path";

const file = "src/pages/Report.tsx";

function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.writeFileSync(p,s,"utf8"); }
function must(cond,msg){ if(!cond){ console.error("❌",msg); process.exit(1);} }

let s = read(file);
const before = s;

const MARK = "MF_BLOCO6_REPORT_RESOLVER";

// 1) inserir helper local no topo do componente (antes do return), sem depender de perfil/metabolismo soltos
// Tentamos achar "function Report" ou "const Report" e inserir logo no começo do corpo.
if (!s.includes(MARK)) {
  const helper = `
  // ${MARK}: resolver determinístico (state/perfil) para auditoria premium
  const __mfResolveReportData = () => {
    // tenta pegar "state" de onde o Report já usa (não cria novo store)
    const st: any = (typeof state !== "undefined") ? (state as any) : null;
    const pf: any = st?.perfil ?? st?.profile ?? null;

    const metabolismo: any =
      pf?.metabolismo ??
      pf?.calculoMetabolico ??
      pf?.metabolic ??
      st?.metabolismo ??
      st?.calculoMetabolico ??
      st?.metabolic ??
      null;

    const dieta: any =
      st?.dietaAtiva ??
      pf?.dietaAtiva ??
      pf?.diet ??
      st?.dietPlan ??
      null;

    const macros: any =
      (st?.macros ?? pf?.macros ?? pf?.macroSplit ?? null);

    return { st, pf, metabolismo, dieta, macros };
  };
  const __mfReport = __mfResolveReportData();
`;

  // Inserir após a linha onde "state" costuma ser definido no Report.
  // Fallback: inserir logo antes do primeiro "return (" do componente.
  if (s.match(/\bconst\s+state\s*=\s*use\w+Store\(/)) {
    s = s.replace(
      /(const\s+state\s*=\s*use\w+Store\([^;]*\);\s*\n)/,
      `$1${helper}\n`
    );
  } else {
    s = s.replace(/return\s*\(/, `${helper}\n  return (`);
  }

  // 2) Se existir bloco antigo de auditoria com getter inline gigante, trocar por __mfReport.metabolismo
  // reduz complexidade e mantém build verde.
  s = s.replace(/\(\(\(state as any\)\?\.[\s\S]*?null\)\s+as\s+any\)/g, "(__mfReport.metabolismo as any)");

  // 3) Também normaliza possíveis refs remanescentes
  s = s.replace(/\b__mfResolveReportData\b/g, "__mfResolveReportData");
}

// sanity: helper existe
must(s.includes(MARK), "BLOCO 6: marker não inserido.");
must(/__mfReport\s*=\s*__mfResolveReportData\(\)/.test(s), "BLOCO 6: __mfReport não criado.");

if (s !== before) {
  write(file, s);
  console.log("✅ Patched:", file);
} else {
  console.log("ℹ️ Nenhuma alteração necessária:", file);
}

console.log("🎯 BLOCO 6 aplicado: Report agora resolve metabolismo/dieta/macros de forma determinística e limpa.");
