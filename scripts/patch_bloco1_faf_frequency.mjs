import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

function walk(dir, exts) {
  const out = [];
  const st = fs.statSync(dir);
  if (!st.isDirectory()) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "node_modules" || ent.name === "dist" || ent.name === ".backups") continue;
      out.push(...walk(p, exts));
    } else if (exts.some((e) => ent.name.endsWith(e))) out.push(p);
  }
  return out;
}

function read(p) { return fs.readFileSync(p, "utf8"); }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }
function backupFile(p) {
  const rel = path.relative(ROOT, p).replace(/[\\/]/g, "__");
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(ROOT, ".backups", `bloco1_${rel}.${ts}.bak`);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(p, dest);
  return dest;
}

function pickFirstFileByHeuristics(files, predicates) {
  for (const pred of predicates) {
    const hit = files.find((p) => {
      const s = read(p);
      return pred(p, s);
    });
    if (hit) return hit;
  }
  return null;
}

// ---------- (A) Store: weeklyActivityFrequency ----------
const tsFiles = walk(SRC, [".ts", ".tsx"]);

const storeFile =
  pickFirstFileByHeuristics(tsFiles, [
    (p, s) => /useUIStore\.ts$/.test(p) && /create\(/.test(s) && /persist/.test(s),
    (p, s) => /useUIStore/.test(p) && /create\(/.test(s) && /persist/.test(s),
    (p, s) => /store/i.test(p) && /create\(/.test(s) && /persist/.test(s) && /onboarding|perfil|profile/i.test(s),
  ]);

if (!storeFile) {
  console.error("❌ BLOCO 1: não encontrei store (useUIStore/onboarding) para persistir weeklyActivityFrequency.");
  process.exit(1);
}

let store = read(storeFile);
const storeBefore = store;

if (!/weeklyActivityFrequency/.test(store)) {
  backupFile(storeFile);

  // tenta inserir campo no estado inicial: padrão "moderately_active"
  // Heurística: achar um objeto grande com perfil/usuario; inserir perto de "sexo" / "idade" / "objetivo"
  const defaultLine = `weeklyActivityFrequency: "moderately_active",`;

  // 1) se existir "profile:" ou "perfil:" objeto, injeta dentro
  let injected = false;
  store = store.replace(/(profile\s*:\s*\{[\s\S]*?)(\n\s*\})/m, (m, a, b) => {
    if (/weeklyActivityFrequency/.test(m)) return m;
    injected = true;
    return `${a}\n      ${defaultLine}${b}`;
  });

  if (!injected) {
    store = store.replace(/(perfil\s*:\s*\{[\s\S]*?)(\n\s*\})/m, (m, a, b) => {
      if (/weeklyActivityFrequency/.test(m)) return m;
      injected = true;
      return `${a}\n      ${defaultLine}${b}`;
    });
  }

  // 2) fallback: inserir no primeiro objeto de estado retornado pelo create()
  if (!injected) {
    store = store.replace(/return\s*\{\s*\n/m, (m) => `${m}  ${defaultLine}\n`);
    injected = /weeklyActivityFrequency/.test(store);
  }

  if (!injected) {
    console.error("❌ BLOCO 1: falha ao injetar weeklyActivityFrequency no store (heurística não encaixou).");
    process.exit(1);
  }

  // garantir que exista setter (setWeeklyActivityFrequency) sem quebrar
  if (!/setWeeklyActivityFrequency/.test(store)) {
    // tenta achar bloco de actions / setters comuns
    const setter = `
  setWeeklyActivityFrequency: (v) => set(() => ({ weeklyActivityFrequency: v })),`;
    let ok = false;

    // tenta inserir junto de outros setters
    store = store.replace(/(\n\s*\w+\s*:\s*\(.*?\)\s*=>\s*set\([\s\S]*?\)\s*,)/m, (m) => {
      ok = true;
      return `${m}\n${setter}`;
    });

    if (!ok) {
      // fallback: inserir antes do fechamento final do objeto retornado
      store = store.replace(/(\n\s*\}\s*\)\s*;?\s*\n?)/m, (m) => {
        ok = true;
        return `\n${setter}\n${m}`;
      });
    }

    if (!ok) {
      console.error("❌ BLOCO 1: falha ao inserir setWeeklyActivityFrequency no store.");
      process.exit(1);
    }
  }

  write(storeFile, store);
}

console.log(`✅ Store OK: ${path.relative(ROOT, storeFile)}`);

// ---------- (B) UI Avaliação Física: pergunta frequência semanal ----------
const avaliacaoFile =
  pickFirstFileByHeuristics(tsFiles, [
    (p, s) => /Step2Avaliacao\.tsx$/.test(p),
    (p, s) => /Avaliacao/i.test(p) && /frequência|frequencia|atividade física|atividade fisica/i.test(s),
    (p, s) => /Avaliacao/i.test(p) && /return\s*\(/.test(s) && /Card|Section|Pergunta|Question/i.test(s),
  ]);

if (!avaliacaoFile) {
  console.error("❌ BLOCO 1: não encontrei a tela de Avaliação Física (Step2Avaliacao.tsx ou similar).");
  process.exit(1);
}

let ui = read(avaliacaoFile);
const uiBefore = ui;

if (!/Qual a sua frequenc/i.test(ui) && !/frequência de atividade/i.test(ui)) {
  backupFile(avaliacaoFile);

  // tenta identificar onde inserir: após um título/h2/h3 ou após um bloco de perguntas
  // Injeta um Card/Section simples, usando componentes nativos (sem depender de libs novas)
  const block = `
        {/* BLOCO 1 (Premium): Frequência de atividade física semanal */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-white">
            Qual a sua frequência de atividade física semanal?
          </div>
          <div className="mt-2 text-xs text-white/60">
            Isso é usado no cálculo metabólico (FAF) para estimar seu gasto total com mais precisão.
          </div>

          <div className="mt-3 grid gap-2">
            {[
              { k: "sedentary", label: "Sedentário" },
              { k: "moderately_active", label: "Moderadamente ativo (1 a 3x/semana)" },
              { k: "active", label: "Ativo (3 a 5x/semana)" },
              { k: "very_active", label: "Muito ativo (+5x/semana)" },
            ].map((opt) => (
              <button
                key={opt.k}
                type="button"
                onClick={() => (typeof setWeeklyActivityFrequency === "function" ? setWeeklyActivityFrequency(opt.k) : null)}
                className={
                  "w-full rounded-xl border px-3 py-2 text-left text-sm transition " +
                  ((weeklyActivityFrequency === opt.k)
                    ? "border-white/30 bg-white/10"
                    : "border-white/10 bg-transparent hover:bg-white/5")
                }
              >
                <div className="flex items-center justify-between">
                  <span className="text-white">{opt.label}</span>
                  <span className={"text-[10px] " + ((weeklyActivityFrequency === opt.k) ? "text-white" : "text-white/40")}>
                    {weeklyActivityFrequency === opt.k ? "Selecionado" : "Selecionar"}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
`;

  // garantir que a tela tenha acesso ao estado+setter
  // tenta inserir no topo imports/hooks: procurar por "useUIStore" e desestruturar
  if (/useUIStore/.test(ui) && !/weeklyActivityFrequency/.test(ui)) {
    ui = ui.replace(
      /const\s*\{\s*([^}]+)\s*\}\s*=\s*useUIStore\s*\(\s*\)\s*;?/m,
      (m, inner) => {
        if (/weeklyActivityFrequency/.test(inner)) return m;
        return `const { ${inner.trim()}, weeklyActivityFrequency, setWeeklyActivityFrequency } = useUIStore();`;
      }
    );
  }

  // fallback: se não tem useUIStore desestruturado, tenta adicionar uma linha padrão
  if (!/weeklyActivityFrequency/.test(ui)) {
    // inserir após o primeiro "const ... = useUIStore()"
    ui = ui.replace(
      /(useUIStore\s*\(\s*\)\s*;?\s*\n)/m,
      (m) => `${m}  const { weeklyActivityFrequency, setWeeklyActivityFrequency } = useUIStore();\n`
    );
  }

  if (!/weeklyActivityFrequency/.test(ui) || !/setWeeklyActivityFrequency/.test(ui)) {
    console.error("❌ BLOCO 1: não consegui conectar weeklyActivityFrequency + setter na tela de avaliação.");
    process.exit(1);
  }

  // inserir bloco na UI: antes do último fechamento do container principal (heurística)
  let inserted = false;
  ui = ui.replace(/(\n\s*<\/div>\s*\n\s*\);\s*\n\s*\}\s*$)/m, (m) => {
    inserted = true;
    return `\n${block}\n${m}`;
  });

  // fallback: inserir antes do último </main> ou </section> se existir
  if (!inserted) {
    ui = ui.replace(/(\n\s*<\/(main|section)>\s*\n\s*\);\s*\n\s*\}\s*$)/m, (m) => {
      inserted = true;
      return `\n${block}\n${m}`;
    });
  }

  if (!inserted) {
    console.error("❌ BLOCO 1: não consegui inserir o bloco da pergunta na UI (estrutura diferente).");
    process.exit(1);
  }

  write(avaliacaoFile, ui);
}

console.log(`✅ UI Avaliação OK: ${path.relative(ROOT, avaliacaoFile)}`);

// ---------- (C) Metabolismo: aplicar multiplicador por frequência semanal ----------
const metabFile =
  pickFirstFileByHeuristics(tsFiles, [
    (p, s) => /metabol/i.test(p) && /(TMB|TDEE|Mifflin|Cunningham|FAF|calori)/i.test(s),
    (p, s) => /(Mifflin|Cunningham|FAO)/i.test(s),
    (p, s) => /(TDEE|FAF|fator de atividade|activity factor)/i.test(s),
  ]);

if (!metabFile) {
  console.error("❌ BLOCO 1: não encontrei módulo/função de metabolismo (arquivo com Mifflin/Cunningham/TDEE/FAF).");
  process.exit(1);
}

let metab = read(metabFile);
const metabBefore = metab;

if (!/getWeeklyActivityMultiplier/.test(metab)) {
  backupFile(metabFile);

  // injeta helper + aplica multiplicador no cálculo final de gasto/calorias
  const helper = `
// BLOCO 1 (Premium): multiplicador por frequência semanal (FAF)
// Observação: valores típicos usados em guias de atividade (sedentário -> muito ativo).
export function getWeeklyActivityMultiplier(freq) {
  switch (freq) {
    case "sedentary": return 1.20;
    case "moderately_active": return 1.375;
    case "active": return 1.55;
    case "very_active": return 1.725;
    default: return 1.375;
  }
}
`;

  // coloca helper no topo (após imports)
  if (/^import[\s\S]+?\n\n/m.test(metab)) {
    metab = metab.replace(/^(import[\s\S]+?\n)\n/m, `$1\n${helper}\n`);
  } else {
    metab = `${helper}\n${metab}`;
  }

  // agora aplicar no cálculo: procurar padrão de TDEE = TMB * faf ou gasto = tmb * fator
  // Heurística 1: "* faf" presente em retorno
  let applied = false;

  // caso tenha função que calcula tdee/gasto total
  metab = metab.replace(
    /(return\s+)([a-zA-Z0-9_$.]+)\s*\*\s*([a-zA-Z0-9_$.]+)\s*;\s*$/m,
    (m, a, b, c) => {
      // evita mexer em retornos irrelevantes
      if (!/(tmb|bmr|TMB|BMR)/.test(`${b}${c}`) && !/(faf|factor|atividade)/i.test(`${b}${c}`)) return m;
      applied = true;
      return `${a}(${b} * ${c} * getWeeklyActivityMultiplier(input?.weeklyActivityFrequency || input?.profile?.weeklyActivityFrequency || weeklyActivityFrequency));`;
    }
  );

  // Heurística 2: procurar atribuição "tdee =" e multiplicar
  if (!applied) {
    metab = metab.replace(
      /(tdee|TDEE|gastoTotal|totalDailyEnergy)\s*=\s*([^\n;]+);/m,
      (m, name, expr) => {
        if (!/(tmb|bmr|TMB|BMR|faf|factor|atividade)/i.test(expr)) return m;
        applied = true;
        return `${name} = (${expr}) * getWeeklyActivityMultiplier(input?.weeklyActivityFrequency || input?.profile?.weeklyActivityFrequency || weeklyActivityFrequency);`;
      }
    );
  }

  // Heurística 3: retorno direto em objeto
  if (!applied) {
    metab = metab.replace(
      /(tdee|TDEE|gastoTotal|totalDailyEnergy)\s*:\s*([^,\n}]+)([,\n}])/m,
      (m, k, expr, end) => {
        if (!/(tmb|bmr|TMB|BMR|faf|factor|atividade)/i.test(expr)) return m;
        applied = true;
        return `${k}: (${expr}) * getWeeklyActivityMultiplier(input?.weeklyActivityFrequency || input?.profile?.weeklyActivityFrequency || weeklyActivityFrequency)${end}`;
      }
    );
  }

  if (!applied) {
    console.error("❌ BLOCO 1: encontrei metabolismo, mas não consegui aplicar multiplicador no cálculo (padrões não bateram).");
    process.exit(1);
  }

  write(metabFile, metab);
}

console.log(`✅ Metabolismo OK: ${path.relative(ROOT, metabFile)}`);

// ---------- sanity: garantir 3 entregas ----------
const finalStore = read(storeFile);
const finalUI = read(avaliacaoFile);
const finalMetab = read(metabFile);

if (!/weeklyActivityFrequency/.test(finalStore)) {
  console.error("❌ BLOCO 1: sanity falhou: store sem weeklyActivityFrequency.");
  process.exit(1);
}
if (!/Qual a sua frequência de atividade física semanal\?/.test(finalUI)) {
  console.error("❌ BLOCO 1: sanity falhou: pergunta não inserida na UI.");
  process.exit(1);
}
if (!/getWeeklyActivityMultiplier/.test(finalMetab)) {
  console.error("❌ BLOCO 1: sanity falhou: helper de multiplicador não inserido no metabolismo.");
  process.exit(1);
}

console.log("🎯 BLOCO 1: patches aplicados com sucesso (store + UI + metabolismo).");
