const fs = require("fs");

const FILE = "src/lib/resetApp.ts";
if (!fs.existsSync(FILE)) {
  console.log("ℹ️ resetApp.ts não encontrado em", FILE, "(não-fatal).");
  process.exit(0);
}
let s0 = fs.readFileSync(FILE, "utf8");
let s = s0;

// Skip if already patched
if (s.includes("MFRESET_CANONICAL_V1") || s.includes("mfResetFromQuery")) {
  console.log("ℹ️ resetApp.ts já está com hook do mfreset (skip).");
  process.exit(0);
}

// 1) ensure import
if (!s.includes('from "./mfreset"') && !s.includes("from './mfreset'")) {
  if (/^import\s/m.test(s)) {
    // add after first import line
    s = s.replace(/^import[^\n]*\n/, (m) => m + `import { mfResetFromQuery } from "./mfreset";\n`);
  } else {
    s = `import { mfResetFromQuery } from "./mfreset";\n` + s;
  }
}

// 2) inject call near top of first exported reset function (best-effort)
const fnRe = /export\s+function\s+([A-Za-z0-9_]*reset[A-Za-z0-9_]*)\s*\([^)]*\)\s*\{\s*/m;
const m = fnRe.exec(s);

if (m) {
  const fnName = m[1];
  const idx = m.index + m[0].length;
  const injection =
`\n  // MFRESET_CANONICAL_V1: aplica reset por query (?reset=soft|hard) antes de qualquer redirect\n  try {\n    const did = mfResetFromQuery();\n    if (did) {\n      // mantém comportamento existente (redirects/return) definido no arquivo original\n    }\n  } catch { /* noop */ }\n`;
  s = s.slice(0, idx) + injection + s.slice(idx);
  console.log("✅ Hook inserido em:", fnName);
} else {
  // fallback: insert before any window.location.replace("/onboarding/step-1") if exists
  const anchor = 'window.location.replace("/onboarding/step-1");';
  if (s.includes(anchor)) {
    s = s.replace(anchor,
`// MFRESET_CANONICAL_V1\ntry { mfResetFromQuery(); } catch {}\n${anchor}`
    );
    console.log("✅ Hook inserido antes do redirect /onboarding/step-1");
  } else {
    console.log("⚠️ Não achei função reset* nem redirect anchor — patch skip (não-fatal).");
    process.exit(0);
  }
}

if (s !== s0) {
  fs.writeFileSync(FILE, s, "utf8");
  console.log("✅ Patched:", FILE);
} else {
  console.log("ℹ️ No changes applied.");
}
