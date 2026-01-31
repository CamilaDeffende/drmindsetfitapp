const fs = require("fs");

const FILE = "src/pages/OnboardingFlow.tsx";
const s0 = fs.readFileSync(FILE, "utf8");
let s = s0;

// Se já existe alguma função/const isDone, não mexe.
if (/\bfunction\s+isDone\s*\(|\bconst\s+isDone\s*=/.test(s)) {
  console.log("ℹ️ isDone já existe. Nada a fazer.");
  process.exit(0);
}

// Procura o DONE_KEY e injeta isDone logo depois.
const re = /(const\s+DONE_KEY\s*=\s*["'][^"']+["']\s*;\s*)/m;
if (!re.test(s)) {
  console.error("❌ Não encontrei DONE_KEY para ancorar o isDone(). Abortando.");
  process.exit(2);
}

s = s.replace(re, (m) => {
  return m + "\n" +
`function isDone(): boolean {
  try { return localStorage.getItem(DONE_KEY) === "1"; } catch { return false; }
}
`;
});

fs.writeFileSync(FILE, s, "utf8");
console.log("✅ Patched:", FILE);
