import fs from "fs";

const file = "src/features/run-pro/components/RunProElitePanel.tsx";
let s = fs.readFileSync(file, "utf8");

// 1) garantir import
if (!s.includes('RunProEliteCharts')) {
  if (s.includes('from "@/features/run-pro/utils/timeLabel"')) {
    s = s.replace(
      /from\s+"@\/features\/run-pro\/utils\/timeLabel";\s*\n/,
      (m) => m + 'import { RunProEliteCharts } from "@/features/run-pro/components/RunProEliteCharts";\n'
    );
  } else {
    // fallback: insere após último import
    const lastImportIdx = s.lastIndexOf("import");
    if (lastImportIdx !== -1) {
      const upTo = s.indexOf("\n", s.indexOf(";", lastImportIdx)) + 1;
      s = s.slice(0, upTo) + 'import { RunProEliteCharts } from "@/features/run-pro/components/RunProEliteCharts";\n' + s.slice(upTo);
    } else {
      s = 'import { RunProEliteCharts } from "@/features/run-pro/components/RunProEliteCharts";\n' + s;
    }
  }
}

// 2) injetar componente uma única vez
if (!s.includes("<RunProEliteCharts")) {
  const marker = "</div>";
  const idx = s.lastIndexOf(marker);
  if (idx === -1) {
    // fallback: coloca antes do return fechar
    s = s.replace(/return\s*\(\s*/m, (m) => m + "\n  <div className=\"mt-4\"><RunProEliteCharts /></div>\n");
  } else {
    s = s.slice(0, idx) + '\n      <div className="mt-4"><RunProEliteCharts /></div>\n' + s.slice(idx);
  }
}

fs.writeFileSync(file, s);
console.log("INJECT_OK:", file);
