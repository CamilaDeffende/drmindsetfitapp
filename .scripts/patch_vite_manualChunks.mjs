import fs from "fs";

const file = "vite.config.ts";
let s = fs.readFileSync(file, "utf8");

// já tem manualChunks?
if (/manualChunks\s*\(/.test(s) || /manualChunks\s*:/.test(s)) {
  console.log("SKIP: manualChunks já existe no vite.config.ts");
  process.exit(0);
}

const manualChunksBlock = `
        // premium chunking (investor-ready)
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) return "react-vendor";
            if (id.includes("/@radix-ui/") || id.includes("/class-variance-authority/") || id.includes("/clsx/") || id.includes("/tailwind-merge/")) return "ui-vendor";
            if (id.includes("/recharts/") || id.includes("/d3-")) return "charts-vendor";
            if (id.includes("/leaflet/") || id.includes("/react-leaflet/")) return "maps-vendor";
            if (id.includes("/jspdf/") || id.includes("pdf") || id.includes("/html2canvas/") || id.includes("/pdf-lib/")) return "pdf-vendor";
            return "vendor";
          }
        },`;

// garante chunkSizeWarningLimit
if (!/chunkSizeWarningLimit\s*:/.test(s)) {
  // tenta inserir no build: { ... } logo após "build: {"
  s = s.replace(/build\s*:\s*\{\s*\n/, (m) => m + `    chunkSizeWarningLimit: 1800,\n`);
}

// agora inserir manualChunks dentro de build.rollupOptions.output
// Estratégias:
// A) existe "rollupOptions: { output: { ... } }" => injeta após "output: {"
// B) existe "output: { ... }" => injeta após "output: {"
// C) não existe rollupOptions/output => cria blocos

if (/rollupOptions\s*:\s*\{[\s\S]*?output\s*:\s*\{/.test(s)) {
  s = s.replace(/(output\s*:\s*\{\s*\n)/, (m) => m + manualChunksBlock + "\n");
  console.log("PATCH_OK: manualChunks inserido em output{} existente");
} else if (/build\s*:\s*\{/.test(s)) {
  // tem build mas não tem rollupOptions/output: cria rollupOptions/output no topo do build
  s = s.replace(/build\s*:\s*\{\s*\n/, (m) =>
    m +
`    rollupOptions: {
      output: {
${manualChunksBlock}
      }
    },
`
  );
  console.log("PATCH_OK: rollupOptions/output criado com manualChunks");
} else {
  console.log("ERROR: não encontrei bloco build no vite.config.ts");
  process.exit(1);
}

fs.writeFileSync(file, s);
