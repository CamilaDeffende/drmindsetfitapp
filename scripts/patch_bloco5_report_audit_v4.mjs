import fs from "node:fs";

const file = "src/pages/Report.tsx";
let s = fs.readFileSync(file, "utf8");
const before = s;

function must(cond, msg){ if(!cond){ console.error("❌", msg); process.exit(1);} }

const MARK = "MF_BLOCO5_REPORT_AUDIT_V4";

// (A) injeta const __mfMetabolismo NO ESCOPO do componente (antes do return)
if (!s.includes("const __mfMetabolismo")) {
  s = s.replace(
    /(\n\s*)return\s*\(\s*/m,
    `$1// ${MARK}: metab audit source (scope-safe)\n` +
    `$1const __mfMetabolismo: any = (state as any)?.metabolismo\n` +
    `$1  ?? (state as any)?.perfil?.metabolismo\n` +
    `$1  ?? (state as any)?.perfil?.calculoMetabolico\n` +
    `$1  ?? (state as any)?.calculoMetabolico\n` +
    `$1  ?? (state as any)?.metabolic\n` +
    `$1  ?? null;\n` +
    `$1return (`
  );
}

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

// (B) inserir em ÂNCORA SEGURA (comentário do bloco de Plano Nutricional)
if (!s.includes(MARK)) {
  const commentAnchor = /\{\/\*\s*Plano\s+Nutricional[\s\S]*?\*\/\}/m;

  if (commentAnchor.test(s)) {
    s = s.replace(commentAnchor, (m) => auditBlock + "\n" + m);
  } else {
    // fallback seguro: após o primeiro container do return (logo após <div ...>)
    s = s.replace(/return\s*\(\s*<div[^>]*>/m, (m) => m + "\n" + auditBlock);
  }
}

// sanity
must(s.includes("const __mfMetabolismo"), "BLOCO 5 v4: __mfMetabolismo não inserido.");
must(s.includes(MARK), "BLOCO 5 v4: marker não inserido.");

if (s !== before) {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Patched:", file);
} else {
  console.log("ℹ️ Nenhuma alteração necessária:", file);
}
