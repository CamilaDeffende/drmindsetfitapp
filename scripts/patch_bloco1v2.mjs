import fs from "node:fs";

const files = {
  metab: "src/lib/metabolismo.ts",
  step2: "src/components/steps/Step2Avaliacao.tsx",
  gp: "src/features/global-profile/store.ts",
};

const read = (p) => fs.readFileSync(p, "utf8");
const write = (p, s) => fs.writeFileSync(p, s, "utf8");

function must(cond, msg) {
  if (!cond) {
    console.error("❌ " + msg);
    process.exit(1);
  }
}

/** =========================
 * (A) Global Profile Store
 * ========================= */
{
  let s = read(files.gp);
  const before = s;

  // garantir campo persistido
  if (!/frequenciaAtividadeSemanal\s*:/.test(s)) {
    // tenta inserir no retorno do create/persist
    s = s.replace(/return\s*\{\s*\n/, (m) => `${m}  frequenciaAtividadeSemanal: "moderadamente_ativo",\n`);
  }

  // garantir setter
  if (!/setFrequenciaAtividadeSemanal\s*:/.test(s)) {
    // inserir antes do fechamento final do objeto
    s = s.replace(/\n(\s*\}\s*\)\s*;?\s*)$/m, `\n  setFrequenciaAtividadeSemanal: (v: string) => set(() => ({ frequenciaAtividadeSemanal: v })),\n$1`);
  }

  must(/frequenciaAtividadeSemanal\s*:/.test(s), "GlobalProfile store: não consegui inserir frequenciaAtividadeSemanal.");
  must(/setFrequenciaAtividadeSemanal\s*:/.test(s), "GlobalProfile store: não consegui inserir setFrequenciaAtividadeSemanal.");

  if (s !== before) write(files.gp, s);
  console.log("✅ Patched:", files.gp);
}

/** =========================
 * (B) Step2Avaliacao UI/submit
 * ========================= */
{
  let s = read(files.step2);
  const before = s;

  // garantir enum com valores corretos (já existe, mas normalizar)
  s = s.replace(
    /frequenciaAtividadeSemanal:\s*z\.enum\(\[[^\]]+\]\)/,
    `frequenciaAtividadeSemanal: z.enum(['sedentario','moderadamente_ativo','ativo','muito_ativo'])`
  );

  // garantir defaultValues com moderadamente_ativo
  if (s.includes("useForm<") && !/defaultValues\s*:\s*\{[\s\S]*frequenciaAtividadeSemanal/.test(s)) {
    s = s.replace(
      /(resolver:\s*zodResolver\(avaliacaoSchema\),)/,
      `$1\n    defaultValues: { frequenciaAtividadeSemanal: "moderadamente_ativo" },`
    );
  }

  // garantir que onSubmit inclui frequenciaAtividadeSemanal no objeto avaliacao
  if (!/frequenciaAtividadeSemanal:\s*data\.frequenciaAtividadeSemanal/.test(s)) {
    s = s.replace(
      /(const\s+avaliacao:\s*AvaliacaoFisica\s*=\s*\{)/,
      `$1\n      frequenciaAtividadeSemanal: data.frequenciaAtividadeSemanal,`
    );
  }

  // sanity: já existe Controller name="frequenciaAtividadeSemanal" (seu log mostra)
  must(/name="frequenciaAtividadeSemanal"/.test(s), "Step2Avaliacao: não encontrei o campo UI (Controller) para frequenciaAtividadeSemanal.");

  if (s !== before) write(files.step2, s);
  console.log("✅ Patched:", files.step2);
}

/** =========================
 * (C) Metabolismo: multiplicador + fafFinal + auditoria
 * ========================= */
{
  let s = read(files.metab);
  const before = s;

  // inserir helper (se não existir)
  if (!/getWeeklyActivityMultiplier/.test(s)) {
    const insertAt = s.indexOf("// Fator de Atividade Física (FAF)");
    must(insertAt !== -1, "metabolismo.ts: não achei o bloco FAF para inserir helper.");
    const helper = `
// BLOCO 1 (Premium): multiplicador por frequência semanal (atividade real)
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
    s = s.slice(0, insertAt) + helper + s.slice(insertAt);
  }

  // garantir que freqSemanal vem da avaliacao (não perfil.avaliacao)
  s = s.replace(
    /const\s+freqSemanal\s*=\s*\(perfil\s+as\s+any\)\?\.\s*avaliacao\?\.\s*frequenciaAtividadeSemanal[\s\S]*?;/,
    `const freqSemanal = (avaliacao as any)?.frequenciaAtividadeSemanal as (string | undefined);`
  );

  // garantir fafMult e fafFinal (se já existe parcial, normaliza)
  if (!/const\s+fafMult\s*=/.test(s)) {
    s = s.replace(
      /(const\s+fafBase\s*=\s*getFAF\([^)]+\)\s*;)/,
      `$1\n  const fafMult = getWeeklyActivityMultiplier(freqSemanal);\n  const fafFinal = Math.min(2.4, Math.max(1.0, fafBase * fafMult));`
    );
  } else {
    // se já existe fafMult, garantir fafFinal e clamp
    if (!/fafFinal/.test(s)) {
      s = s.replace(
        /(const\s+fafMult\s*=\s*getWeeklyActivityMultiplier\([^)]+\)\s*;)/,
        `$1\n  const fafFinal = Math.min(2.4, Math.max(1.0, fafBase * fafMult));`
      );
    }
  }

  // GET: substituir qualquer "tmb * fafBase" por "tmb * fafFinal"
  s = s.replace(/Math\.round\(\s*tmb\s*\*\s*fafBase\s*\)/g, "Math.round(tmb * fafFinal)");
  s = s.replace(/\btmb\s*\*\s*fafBase\b/g, "tmb * fafFinal");

  // auditoria no retorno: fafBase, fafMultiplicador, fafFinal, frequenciaSemanal
  if (!/fafMultiplicador/.test(s)) {
    s = s.replace(
      /return\s*\{\s*/m,
      `return {\n    frequenciaSemanal: freqSemanal,\n    fafMultiplicador: Number(fafMult.toFixed(3)),\n    fafFinal: Number(fafFinal.toFixed(3)),\n`
    );
  }

  must(/getWeeklyActivityMultiplier/.test(s), "metabolismo.ts: helper não inserido.");
  must(/fafFinal/.test(s), "metabolismo.ts: fafFinal não aplicado.");
  must(/frequenciaSemanal:\s*freqSemanal/.test(s), "metabolismo.ts: auditoria frequenciaSemanal não inserida.");

  if (s !== before) write(files.metab, s);
  console.log("✅ Patched:", files.metab);
}

console.log("🎯 BLOCO 1 v2 FIX: patches aplicados com sucesso.");
