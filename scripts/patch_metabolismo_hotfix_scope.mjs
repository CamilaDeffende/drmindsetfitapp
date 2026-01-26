import fs from "node:fs";

const file = "src/lib/metabolismo.ts";
let s = fs.readFileSync(file, "utf8");
const before = s;

const idxCalc = s.indexOf("export const calcularMetabolismo");
if (idxCalc === -1) {
  console.error("❌ Não achei 'export const calcularMetabolismo' em src/lib/metabolismo.ts");
  process.exit(1);
}

// (1) remover bloco audit que caiu ANTES do calcularMetabolismo (topo do arquivo)
{
  const head = s.slice(0, idxCalc);
  const tail = s.slice(idxCalc);

  const cleanedHead = head
    .replace(/\n\s*frequenciaSemanal:\s*freqSemanal,\s*\n\s*fafMultiplicador:\s*Number\(\s*fafMult\.toFixed\(\d+\)\s*\),\s*\n\s*fafFinal:\s*Number\(\s*fafFinal\.toFixed\(\d+\)\s*\),\s*\n/gm, "\n")
    .replace(/\n\s*fafMult:\s*Number\(\s*fafMult\.toFixed\(\d+\)\s*\),\s*\n/gm, "\n");

  s = cleanedHead + tail;
}

// (2) remover função antiga não usada (se existir)
s = s.replace(/function\s+mapFreqSemanalToFafMultiplier[\s\S]*?\n\}\n/gm, "\n");

// (3) dentro do calcularMetabolismo: garantir freqSemanal -> fafMult -> fafFinal (clamp) + compat `faf`
{
  // garantir que freqSemanal vem da avaliacao
  s = s.replace(
    /const\s+freqSemanal\s*=\s*[\s\S]*?frequenciaAtividadeSemanal[\s\S]*?;/m,
    `const freqSemanal = (avaliacao as any)?.frequenciaAtividadeSemanal as (string | undefined);`
  );

  // se não houver linha freqSemanal, inserir logo após fafBase
  if (!/const\s+freqSemanal\s*=/.test(s)) {
    s = s.replace(
      /(const\s+fafBase\s*=\s*getFAF\([^)]+\)\s*;)/,
      `$1\n  const freqSemanal = (avaliacao as any)?.frequenciaAtividadeSemanal as (string | undefined);`
    );
  }

  // garantir fafMult
  if (!/const\s+fafMult\s*=/.test(s)) {
    s = s.replace(
      /(const\s+freqSemanal\s*=\s*[^\n;]+;)/,
      `$1\n  const fafMult = getWeeklyActivityMultiplier(freqSemanal);`
    );
  }

  // remover linha errada "const fafFinal = faf;" se existir
  s = s.replace(/const\s+fafFinal\s*=\s*faf\s*;\s*/g, "");

  // se já existe 'const faf = ...' antigo, removemos para re-inserir do jeito certo
  s = s.replace(/\n\s*const\s+faf\s*=\s*[^\n;]+;\s*/g, "\n");

  // garantir fafFinal clamp (ou corrigir se já existir mas errado)
  if (!/const\s+fafFinal\s*=/.test(s)) {
    s = s.replace(
      /(const\s+fafMult\s*=\s*getWeeklyActivityMultiplier\([^)]+\)\s*;)/,
      `$1\n  const fafFinal = Math.min(2.4, Math.max(1.0, fafBase * fafMult));`
    );
  } else {
    // se existe, força a forma clamp correta (sem duplicar)
    s = s.replace(
      /const\s+fafFinal\s*=\s*[^;]+;/,
      `const fafFinal = Math.min(2.4, Math.max(1.0, fafBase * fafMult));`
    );
  }

  // inserir compat faf logo após fafFinal
  s = s.replace(
    /(const\s+fafFinal\s*=\s*Math\.min\([\s\S]*?\)\s*;)/,
    `$1\n  const faf = fafFinal;`
  );
}

// (4) garantir que helper novo seja realmente usado (evita TS6133)
if (/const\s+getWeeklyActivityMultiplier/.test(s) && !/getWeeklyActivityMultiplier\(/.test(s)) {
  console.error("❌ helper getWeeklyActivityMultiplier existe mas não está sendo chamado.");
  process.exit(1);
}

if (s === before) {
  console.log("ℹ️ Nenhuma alteração necessária (arquivo já parecia corrigido).");
} else {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Patched:", file);
}
