import fs from "node:fs";

const file = "src/lib/metabolismo.ts";
let s = fs.readFileSync(file, "utf8");
const before = s;

function must(cond, msg) {
  if (!cond) {
    console.error("❌ " + msg);
    process.exit(1);
  }
}

// 1) garantir helper com valores do seu Step2 (sedentario/moderadamente_ativo/ativo/muito_ativo)
if (!/getWeeklyActivityMultiplier/.test(s)) {
  const anchor = s.indexOf("// Fator de Atividade Física (FAF)");
  must(anchor !== -1, "metabolismo.ts: não achei o comentário 'FAF' para inserir helper.");
  const helper = `// BLOCO 1 (Premium): multiplicador por frequência semanal (atividade real)
const getWeeklyActivityMultiplier = (freq?: string): number => {
  switch (String(freq || "").toLowerCase()) {
    case "sedentario": return 1.20;
    case "moderadamente_ativo": return 1.375;
    case "ativo": return 1.55;
    case "muito_ativo": return 1.725;
    default: return 1.375;
  }
};

`;
  s = s.slice(0, anchor) + helper + s.slice(anchor);
}

// 2) freqSemanal deve vir da AVALIACAO (não do perfil as any)
s = s.replace(
  /const\s+freqSemanal\s*=\s*\(perfil\s+as\s+any\)\?\.\s*avaliacao\?\.\s*frequenciaAtividadeSemanal[^;]*;/g,
  `const freqSemanal = (avaliacao as any)?.frequenciaAtividadeSemanal as (string | undefined);`
);

// se ainda não existir, tenta substituir variantes comuns
s = s.replace(
  /const\s+freqSemanal\s*=\s*[^;]*frequenciaAtividadeSemanal[^;]*;/g,
  (m) => m.includes("avaliacao") ? m : `const freqSemanal = (avaliacao as any)?.frequenciaAtividadeSemanal as (string | undefined);`
);

// 3) garantir fafMult e fafFinal após fafBase
if (!/const\s+fafMult\s*=/.test(s)) {
  s = s.replace(
    /(const\s+fafBase\s*=\s*getFAF\([^)]+\)\s*;)/,
    `$1\n  const fafMult = getWeeklyActivityMultiplier(freqSemanal);\n  const fafFinal = Math.min(2.4, Math.max(1.0, fafBase * fafMult));`
  );
} else if (!/fafFinal/.test(s)) {
  s = s.replace(
    /(const\s+fafMult\s*=\s*getWeeklyActivityMultiplier\([^)]+\)\s*;)/,
    `$1\n  const fafFinal = Math.min(2.4, Math.max(1.0, fafBase * fafMult));`
  );
}

// 4) trocar qualquer GET calculado com fafBase/faf por fafFinal
s = s.replace(/Math\.round\(\s*tmb\s*\*\s*fafBase\s*\)/g, "Math.round(tmb * fafFinal)");
s = s.replace(/\btmb\s*\*\s*fafBase\b/g, "tmb * fafFinal");
s = s.replace(/Math\.round\(\s*tmb\s*\*\s*faf\s*\)/g, "Math.round(tmb * fafFinal)");
s = s.replace(/\btmb\s*\*\s*faf\b/g, "tmb * fafFinal");

// 5) auditoria no retorno (se ainda não existir)
if (!/fafMultiplicador/.test(s)) {
  s = s.replace(
    /return\s*\{\s*/m,
    `return {\n    frequenciaSemanal: freqSemanal,\n    fafMultiplicador: Number(fafMult.toFixed(3)),\n    fafFinal: Number(fafFinal.toFixed(3)),\n`
  );
}

// sanity mínima
must(/getWeeklyActivityMultiplier/.test(s), "metabolismo.ts: helper não inserido.");
must(/freqSemanal\s*=\s*\(avaliacao\s+as\s+any\)\?\./.test(s), "metabolismo.ts: freqSemanal não está vindo de avaliacao.");
must(/fafFinal/.test(s), "metabolismo.ts: fafFinal não existe.");
must(/frequenciaSemanal:\s*freqSemanal/.test(s), "metabolismo.ts: auditoria frequenciaSemanal não inserida.");

if (s !== before) fs.writeFileSync(file, s, "utf8");
console.log("✅ Patched:", file);
