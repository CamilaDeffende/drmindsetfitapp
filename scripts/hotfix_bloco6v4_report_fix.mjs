import fs from "node:fs";

const file = "src/pages/Report.tsx";
if (!fs.existsSync(file)) {
  console.error("Arquivo não encontrado:", file);
  process.exit(1);
}

const backup = `.backups/Report.tsx.hotfix_bloco6v4.${new Date().toISOString().replace(/[:.]/g,"-")}.bak`;
fs.copyFileSync(file, backup);

let s = fs.readFileSync(file, "utf8");
const before = s;

// (1) remover qualquer declaração de __mfMet (qualquer variação)
s = s.replace(/^\s*const\s+__mfMet\s*:\s*any\s*=\s*.*?;\s*\n/gm, "");
s = s.replace(/^\s*const\s+__mfMet\s*=\s*.*?;\s*\n/gm, "");

// (2) substituir usos no JSX: (__mfMet as any) / __mfMet -> (__mfReport.metabolismo as any)
s = s.replace(/\(__mfMet\s+as\s+any\)/g, "(__mfReport.metabolismo as any)");
s = s.replace(/\b__mfMet\b/g, "(__mfReport.metabolismo as any)");

// (3) sanity mínima: precisa existir __mfReport
if (!/const\s+__mfReport\s*=\s*__mfResolveReportData\(\)\s*;/.test(s)) {
  console.error("Sanity falhou: não achei 'const __mfReport = __mfResolveReportData();' no Report.tsx");
  process.exit(1);
}

// (4) garantir que __mfReport está sendo usado em algum lugar do arquivo (JSX ou lógica)
// se por algum motivo ainda não estiver, força um touch seguro
if (!/__mfReport\./.test(s) && !/\b__mfReport\b/.test(s.replace(/const\s+__mfReport[\s\S]*?;/, ""))) {
  s = s.replace(
    /(const\s+__mfReport\s*=\s*__mfResolveReportData\(\)\s*;\s*\n)/,
    `$1  void __mfReport;\n`
  );
}

if (s === before) {
  console.log("ℹ️ Nenhuma alteração necessária.");
} else {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Patched:", file);
  console.log("🧷 Backup:", backup);
}
