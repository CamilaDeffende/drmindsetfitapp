import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const FILE = "src/features/fitness-suite/modules/dashboard/DashboardPro.tsx";
const LOGO_URL = "/brand/mindsetfit-logo.svg";

const abs = path.join(ROOT, FILE);
if (!fs.existsSync(abs)) {
  console.error("❌ Arquivo não encontrado:", FILE);
  process.exit(1);
}

let s = fs.readFileSync(abs, "utf8");

// (A) Trocar qualquer referência antiga .png -> .svg (não mexe em JSX)
s = s.replace(/mindsetfit-logo\.png/g, "mindsetfit-logo.svg");

// (B) Corrigir shorthand quebrado: "logoUrl," -> "logoUrl: '/brand/...svg',"
s = s.replace(/(\n\s*)logoUrl\s*,/g, `$1logoUrl: "${LOGO_URL}",`);

// (C) Remover SOMENTE propriedades de objeto `fileName: "..."` e `fileName,`
//     (linhas inteiras) — sem mexer em outras chaves para não quebrar objetos.
s = s.replace(/\n[ \t]*fileName\s*:\s*["'][^"']*["']\s*,?/g, "");
s = s.replace(/\n[ \t]*fileName\s*,\s*/g, "\n");

// (D) Se houver qualquer `logoUrl: undefined` por algum motivo, força string
s = s.replace(/logoUrl:\s*undefined\s*,/g, `logoUrl: "${LOGO_URL}",`);

fs.writeFileSync(abs, s, "utf8");
console.log("✅ Patched safely:", FILE);
