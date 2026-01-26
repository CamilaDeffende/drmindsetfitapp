import fs from "fs";

const file = "src/components/steps/Step4Nutricao.tsx";
if (!fs.existsSync(file)) {
  console.error("Arquivo não encontrado:", file);
  process.exit(1);
}

let s = fs.readFileSync(file, "utf8");
const before = s;

const MARK = "MF_BLOCO4_GUARDRAILS_V2";

if (!s.includes(MARK)) {
  // (1) inserir helpers após imports (sem depender de estrutura interna)
  // tenta inserir após o último import do topo
  const importBlockMatch = s.match(/^(?:import[^\n]*\n)+/m);
  if (!importBlockMatch) {
    console.error("Não encontrei bloco de imports para inserir helpers.");
    process.exit(1);
  }

  const helpers = `\n// ${MARK}: helpers locais (escopo seguro no Step4)\nconst mfClamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));\nconst mfKcalFromMacros = (p: number, c: number, g: number) => (p * 4) + (c * 4) + (g * 9);\n\n`;

  s = s.replace(importBlockMatch[0], importBlockMatch[0] + helpers);

  // (2) permitir ajuste de carboidratos (const -> let) no bloco de cálculo padrão do Step4
  // alvo: "const carboidratos = Math.round(caloriasRestantes / 4)"
  s = s.replace(
    /const\s+carboidratos\s*=\s*Math\.round\(\s*caloriasRestantes\s*\/\s*4\s*\)\s*;?/g,
    "let carboidratos = Math.round(caloriasRestantes / 4);"
  );

  // (3) inserir ajuste final logo após a linha de carboidratos (guardrails + consistência kcal/macros)
  // procura o primeiro "let carboidratos = Math.round(caloriasRestantes / 4);"
  const needle = "let carboidratos = Math.round(caloriasRestantes / 4);";
  if (!s.includes(needle)) {
    console.error("Não encontrei ponto de inserção (carboidratos) no Step4.");
    process.exit(1);
  }

  const insert = `${needle}\n\n    // ${MARK}: consistência kcal ↔ macros (ajusta carboidratos mantendo proteína/gordura)\n    const kcalFixas = (proteina * 4) + (gorduras * 9);\n    const kcalTarget = Math.round(caloriasFinais);\n    const kcalRest = Math.max(0, kcalTarget - kcalFixas);\n    const carboFix = Math.max(0, Math.round(kcalRest / 4));\n    // clamp de carbo para evitar valores absurdos em cenários extremos\n    carboidratos = mfClamp(carboFix, 0, 900);\n    // recalcula kcal final para exibição coerente (diferenças por arredondamento)\n    const kcalFinal = mfKcalFromMacros(proteina, carboidratos, gorduras);\n    caloriasFinais = mfClamp(Math.round(kcalFinal), 800, 6500);\n`;

  s = s.replace(needle, insert);

  // (4) Pequeno reforço de copy/UX (sem quebrar layout): adicionar nota se não existir
  if (!s.includes("Guardrails")) {
    s = s.replace(
      /(<CardDescription[^>]*>)([\s\S]*?)(<\/CardDescription>)/m,
      (m, a, b, c) => `${a}${b} <span className="text-xs text-muted-foreground">• Guardrails premium: macros consistentes e faixa segura.</span>${c}`
    );
  }

  // sanity mínima: marker + uso das helpers
  if (!s.includes(MARK) || !s.includes("mfKcalFromMacros") || !s.includes("carboidratos =")) {
    console.error("Sanity falhou: patch não aplicou corretamente.");
    process.exit(1);
  }
}

if (s !== before) {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Patched:", file);
} else {
  console.log("ℹ️ Nenhuma alteração necessária:", file);
}
