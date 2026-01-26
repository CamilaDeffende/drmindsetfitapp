import fs from "fs";

const file = "vite.config.ts";
let s = fs.readFileSync(file, "utf8");

// se já existe, não faz nada
if (/chunkSizeWarningLimit\s*:/.test(s)) {
  console.log("SKIP: chunkSizeWarningLimit já existe.");
  process.exit(0);
}

// tenta inserir dentro de build: { ... }
if (/build\s*:\s*\{/.test(s)) {
  s = s.replace(/build\s*:\s*\{\s*\n/, (m) => m + "    chunkSizeWarningLimit: 2200,\n");
  fs.writeFileSync(file, s);
  console.log("PATCH_OK: inserido chunkSizeWarningLimit: 2200 dentro de build{}");
  process.exit(0);
}

// se não houver build, cria um build block antes de server: (ou antes do final)
if (s.includes("server:")) {
  s = s.replace(/server\s*:\s*\{/m, () => `build: {\n    chunkSizeWarningLimit: 2200,\n  },\n\n  server: {`);
  fs.writeFileSync(file, s);
  console.log("PATCH_OK: criado build{chunkSizeWarningLimit} antes de server{}");
  process.exit(0);
}

// fallback: inserir no objeto principal antes do fechamento
s = s.replace(/\n\}\s*\)\s*;?\s*$/m, (m) => `\n  build: {\n    chunkSizeWarningLimit: 2200,\n  },\n` + m);
fs.writeFileSync(file, s);
console.log("PATCH_OK: criado build{chunkSizeWarningLimit} no final do config");
