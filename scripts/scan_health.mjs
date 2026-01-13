import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = path.join(root, ".scan");
const report = path.join(outDir, `scan-${stamp}.log`);

fs.mkdirSync(outDir, { recursive: true });

function sh(cmd) {
  try {
    return execSync(cmd, { stdio: "pipe", encoding: "utf8" });
  } catch (e) {
    const stdout = e?.stdout?.toString?.() ?? "";
    const stderr = e?.stderr?.toString?.() ?? "";
    return stdout + "\n" + stderr;
  }
}

let log = "";
log += `✅ Projeto: ${root}\n`;
log += `✅ Node: ${process.version}\n\n`;

log += "==> (1) Git status\n";
log += sh("git status -sb") + "\n";

log += "==> (2) Type-check (tsc --noEmit)\n";
log += sh("npm run -s type-check") + "\n";

log += "==> (3) Build (vite build)\n";
log += sh("npm run -s build") + "\n";

log += "==> (4) Lint (se existir)\n";
log += sh("npm run -s lint") + "\n";

log += "==> (5) Scan rápido por padrões perigosos (rg)\n";
log += sh("rg -n \"\\)\\s*=\\s*onFinish|onFinish=\\{|variant:\\s*pdfVariant:|Unexpected token|TS1109|fileNameUsed|finalLogoUrlUsed\" src || true") + "\n";

fs.writeFileSync(report, log, "utf8");
console.log(`✅ Scan concluído. Relatório: ${path.relative(root, report)}`);
