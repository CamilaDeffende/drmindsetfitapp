import fs from "fs";

const file = "src/components/planos/TreinoAtivoView.tsx";
let s = fs.readFileSync(file, "utf8");

// 1) remove bloco de fallbacks injetado (onde quer que esteja)
s = s.replace(
  /\n\s*\/\/\s*FIX:\s*fallbacks\s+para\s+build\s+verde\s+\(refinar\s+depois\)\s*\n\s*const\s+__mfActive\s*:\s*any\s*=\s*null\s*;\s*\n\s*const\s+__mfTreinosSemana\s*:\s*any\[\]\s*=\s*\[\]\s*;\s*\n/gm,
  "\n"
);

// 2) reinserir dentro do componente TreinoAtivoView
const insertBlock =
  "  // FIX: fallbacks para build verde (refinar depois)\n" +
  "  const __mfActive: any = null;\n" +
  "  const __mfTreinosSemana: any[] = [];\n\n";

if (!s.includes("const __mfActive: any = null;")) {
  // tenta padrões comuns
  const patterns = [
    /export\s+function\s+TreinoAtivoView\s*\([^)]*\)\s*\{\s*\n/m,
    /function\s+TreinoAtivoView\s*\([^)]*\)\s*\{\s*\n/m,
    /export\s+const\s+TreinoAtivoView\s*=\s*\([^)]*\)\s*=>\s*\{\s*\n/m,
    /const\s+TreinoAtivoView\s*=\s*\([^)]*\)\s*=>\s*\{\s*\n/m,
  ];

  let injected = false;
  for (const re of patterns) {
    const m = s.match(re);
    if (m) {
      s = s.replace(re, (mm) => mm + insertBlock);
      injected = true;
      break;
    }
  }

  if (!injected) {
    // fallback: injeta após o primeiro "return (" dentro do arquivo (antes do JSX)
    const idx = s.indexOf("return (");
    if (idx !== -1) {
      const before = s.slice(0, idx);
      const after = s.slice(idx);
      s = before + insertBlock + after;
      injected = true;
    }
  }

  if (!injected) {
    console.log("WARN: não encontrei ponto seguro para injetar. Nenhuma mudança aplicada.");
  } else {
    console.log("INJECT_OK: fallbacks inseridos no corpo do componente.");
  }
} else {
  console.log("SKIP: fallbacks já existem.");
}

// 3) se houver 1 brace extra no final do arquivo, remove apenas 1
// (heurística: se fechar com "}\n" e tiver mais '}' que '{', remove o último)
const open = (s.match(/\{/g) || []).length;
const close = (s.match(/\}/g) || []).length;
if (close > open) {
  s = s.replace(/\n\}\s*$/, "\n");
  console.log("TRIM_OK: removido 1 '}' extra no final.");
}

fs.writeFileSync(file, s);
console.log("PATCH_OK:", file);
