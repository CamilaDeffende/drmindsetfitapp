import fs from "node:fs";

const file = "src/pages/Report.tsx";
let s = fs.readFileSync(file, "utf8");
const before = s;

function must(cond, msg){ if(!cond){ console.error("❌", msg); process.exit(1);} }

const MARK = "MF_BLOCO5_REPORT_AUDIT_V2";

// 1) garantir const __mfMetabolismo no ESCOPO do componente (antes do return)
if (!s.includes("const __mfMetabolismo")) {
  // injeta antes do primeiro return( do componente
  s = s.replace(
    /(\n\s*)return\s*\(\s*/m,
    `$1const __mfMetabolismo: any =
${MARK} && ((state as any)?.metabolismo
  ?? (state as any)?.perfil?.metabolismo
  ?? (state as any)?.perfil?.calculoMetabolico
  ?? (state as any)?.calculoMetabolico
  ?? (state as any)?.metabolic
  ?? null);
$1return (`
  );
}

// 2) bloco de auditoria premium (apenas se ainda não existir)
if (!s.includes(MARK) || !s.includes("Auditoria Premium")) {
  const auditBlock = `
{/* ${MARK}: Auditoria Premium (metabolismo + nutrição) */}
<div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
  <div className="text-sm font-semibold text-white/90">Auditoria Premium</div>
  <div className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
    <div><span className="text-muted-foreground">TMB:</span> <span className="font-semibold">{(__mfMetabolismo as any)?.tmb ?? "—"}</span></div>
    <div><span className="text-muted-foreground">FAF base:</span> <span className="font-semibold">{(__mfMetabolismo as any)?.fafBase ?? "—"}</span></div>
    <div><span className="text-muted-foreground">Frequência semanal:</span> <span className="font-semibold">{(__mfMetabolismo as any)?.frequenciaSemanal ?? "—"}</span></div>
    <div><span className="text-muted-foreground">Multiplicador:</span> <span className="font-semibold">{(__mfMetabolismo as any)?.fafMultiplicador ?? "—"}</span></div>
    <div><span className="text-muted-foreground">FAF final:</span> <span className="font-semibold">{(__mfMetabolismo as any)?.fafFinal ?? (__mfMetabolismo as any)?.faf ?? "—"}</span></div>
    <div><span className="text-muted-foreground">GET:</span> <span className="font-semibold">{(__mfMetabolismo as any)?.get ?? (__mfMetabolismo as any)?.caloriasManutencao ?? "—"}</span></div>
  </div>
  <div className="mt-2 text-xs text-muted-foreground">
    Valores auditáveis do seu metabolismo e consistência de cálculos (premium).
  </div>
</div>
`;

  // tenta inserir antes do heading/área de Plano Nutricional
  if (/\bPlano\s+Nutricional\b/.test(s)) {
    s = s.replace(/(\bPlano\s+Nutricional\b)/m, auditBlock + "\n$1");
  } else {
    // fallback: após o começo do return container
    s = s.replace(/return\s*\(\s*<div[^>]*>/m, (m) => m + "\n" + auditBlock);
  }
}

// sanity
must(s.includes("const __mfMetabolismo"), "BLOCO 5 v3: __mfMetabolismo não inserido.");
must(s.includes(MARK), "BLOCO 5 v3: marker não inserido.");
must(s.includes("Auditoria Premium"), "BLOCO 5 v3: bloco de auditoria não inserido.");

if (s !== before) {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Patched:", file);
} else {
  console.log("ℹ️ Nenhuma alteração necessária:", file);
}
