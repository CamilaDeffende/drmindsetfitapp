import fs from "fs";

const files = [
  "src/features/fitness-suite/modules/dashboard/DashboardPro.tsx",
  "src/pages/HistoryReports.tsx",
];

const bad = [];
for (const f of files) {
  const s = fs.readFileSync(f, "utf8");
  if (s.includes('localStorage.setItem("pdfVariant"') || s.includes('localStorage.getItem("pdfVariant"')) {
    bad.push(`${f}: ainda contém key antiga "pdfVariant"`);
  }
  if (s.includes('"mindsetfit:reportHistory:v1"')) {
    bad.push(`${f}: ainda contém literal "mindsetfit:reportHistory:v1" (deve usar storageKeys)`);
  }
  if (s.includes('"mindsetfit:pdfVariant"')) {
    bad.push(`${f}: ainda contém literal "mindsetfit:pdfVariant" (deve usar storageKeys)`);
  }
}

if (bad.length) {
  console.error("❌ Smoke-check falhou:");
  for (const b of bad) console.error(" - " + b);
  process.exit(1);
}

console.log("✅ Smoke-check OK (keys centralizadas, sem literais antigas).");
