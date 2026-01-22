/**
 * Patch cirúrgico Step3Metabolismo:
 * - importa engine metabolismoActivity
 * - injeta cálculo GET com fator por nível (sem reescrever o Step3 todo)
 *
 * Estratégia:
 * 1) garantir import
 * 2) localizar um trecho de cálculo de GET/TDEE e substituir por computeGET()
 * 3) se não achar, injeta um bloco pequeno antes do updateState
 */
const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "src/components/steps/Step3Metabolismo.tsx");
if (!fs.existsSync(file)) {
  console.error("Arquivo não encontrado:", file);
  process.exit(1);
}

let s = fs.readFileSync(file, "utf8");
const original = s;

// 1) garantir import
if (!s.includes("metabolismoActivity")) {
  // tenta inserir depois de outros imports
  const importLine = `import { computeGET, getActivityFactor, inferNivelTreinoFromState } from "@/features/fitness-suite/engine/metabolismoActivity";\n`;
  const m = s.match(/^(import[\s\S]+?\n)\n/m);
  if (m) {
    s = s.replace(m[1], m[1] + importLine);
  } else {
    s = importLine + s;
  }
}

// 2) tentar substituir cálculo de GET comum: tmb * fator, ou get = ...
let replacedGet = false;

// padrões frequentes
const patterns = [
  // const get = Math.round(tmb * fator)
  /const\s+get\s*=\s*Math\.round\(\s*([a-zA-Z0-9_$.]+)\s*\*\s*([a-zA-Z0-9_$.]+)\s*\)\s*;?/,
  // const get = tmb * fator (com/sem round)
  /const\s+get\s*=\s*([a-zA-Z0-9_$.]+)\s*\*\s*([a-zA-Z0-9_$.]+)\s*;?/,
  // let get = ...
  /let\s+get\s*=\s*Math\.round\(\s*([a-zA-Z0-9_$.]+)\s*\*\s*([a-zA-Z0-9_$.]+)\s*\)\s*;?/,
];

for (const re of patterns) {
  const m = s.match(re);
  if (m) {
    // preserva "tmbVar" detectado
    const tmbVar = m[1];
    s = s.replace(re, `const __nivel = inferNivelTreinoFromState(state);\n  const __af = getActivityFactor(__nivel);\n  const get = computeGET(Number(${tmbVar}), __af);\n`);
    replacedGet = true;
    break;
  }
}

// 3) se não achou cálculo de GET, injeta antes de updateState
if (!replacedGet) {
  // tenta achar updateState({ metabolismo: ... })
  const reUpdate = /updateState\(\s*\{\s*metabolismo\s*:\s*\{\s*/m;
  if (reUpdate.test(s)) {
    s = s.replace(reUpdate, (m) => {
      return `const __nivel = inferNivelTreinoFromState(state);\n  const __af = getActivityFactor(__nivel);\n  // OBS: "tmb" precisa existir no escopo do Step3. Se seu Step3 usa outro nome, ajustaremos no próximo patch.\n  // Mantemos fallback seguro para não quebrar build.\n  const __tmb = (typeof tmb !== "undefined" ? Number(tmb) : Number((state as any)?.metabolismo?.tmb ?? 0));\n  const get = computeGET(__tmb, __af);\n\n` + m;
    });
    replacedGet = true;
  }
}

if (s === original) {
  console.error("PATCH_FAIL: Step3Metabolismo não foi modificado (nenhum padrão encontrado).");
  process.exit(2);
}

// sanity: evita inserir import duplicado por engano
s = s.replace(
  /import\s+\{\s*computeGET,\s*getActivityFactor,\s*inferNivelTreinoFromState\s*\}\s+from\s+["'][^"']+metabolismoActivity["'];\n(import\s+\{\s*computeGET,\s*getActivityFactor,\s*inferNivelTreinoFromState\s*\}\s+from\s+["'][^"']+metabolismoActivity["'];\n)+/g,
  `import { computeGET, getActivityFactor, inferNivelTreinoFromState } from "@/features/fitness-suite/engine/metabolismoActivity";\n`
);

fs.writeFileSync(file, s, "utf8");
console.log("PATCH_OK: Step3Metabolismo atualizado para usar fator de atividade por nível.");
