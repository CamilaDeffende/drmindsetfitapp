import fs from "fs";
import path from "path";

const base = process.argv[2];
if (!base) throw new Error("Uso: node _merge_and_validate.mjs <base_dir>");

const prohibited = [
  "dor",
  "dores",
  "lesão",
  "lesoes",
  "reabilitação",
  "reabilitacao",
  "fisioterapia",
  "prevenção",
  "prevencao",
  "limitação",
  "limitacao",
  "clínica",
  "clinica"
];

const TEMPLATE = {
  musculacao: {
    costas: { halteres: [], maquinas: [], cabos: [] },
    peito: { halteres: [], maquinas: [], cabos: [] },
    ombros: { halteres: [], maquinas: [], cabos: [] },
    biceps: { halteres: [], maquinas: [], cabos: [] },
    triceps: { halteres: [], maquinas: [], cabos: [] },
    gluteos: { halteres: [], maquinas: [], cabos: [] },
    quadriceps: { halteres: [], maquinas: [], cabos: [] },
    posterior_coxa: { halteres: [], maquinas: [], cabos: [] },
    panturrilhas: { halteres: [], maquinas: [], cabos: [] }
  }
};

function deepMerge(dst, src) {
  for (const k of Object.keys(src)) {
    if (src[k] && typeof src[k] === "object" && !Array.isArray(src[k])) {
      if (!dst[k] || typeof dst[k] !== "object" || Array.isArray(dst[k])) dst[k] = {};
      deepMerge(dst[k], src[k]);
    } else {
      dst[k] = src[k];
    }
  }
  return dst;
}

function readJSON(p) {
  const s = fs.readFileSync(p, "utf8");
  return JSON.parse(s);
}

function assert(cond, msg) {
  if (!cond) throw new Error("VALIDATION FAIL: " + msg);
}

function scanProhibited(obj, fileTag) {
  const s = JSON.stringify(obj).toLowerCase();
  for (const w of prohibited) {
    if (s.includes(w)) throw new Error(`PROIBIDO DETECTADO (${w}) em ${fileTag}`);
  }
}

function validateExercise(ex, where) {
  const keys = ["name","goal","execution","focus","cues","common_errors","variations"];
  for (const k of keys) assert(k in ex, `${where}: faltando campo "${k}"`);
  assert(typeof ex.name === "string" && ex.name.trim().length > 0, `${where}: name inválido`);
  assert(typeof ex.goal === "string" && ex.goal.trim().length > 0, `${where}: goal inválido`);
  assert(typeof ex.focus === "string" && ex.focus.trim().length > 0, `${where}: focus inválido`);

  for (const arrKey of ["execution","cues","common_errors","variations"]) {
    assert(Array.isArray(ex[arrKey]), `${where}: ${arrKey} não é array`);
    assert(ex[arrKey].length === 3, `${where}: ${arrKey} deve ter exatamente 3 itens`);
    for (const [i, v] of ex[arrKey].entries()) {
      assert(typeof v === "string" && v.trim().length > 0, `${where}: ${arrKey}[${i}] inválido`);
    }
  }
}

function validateFull(doc) {
  assert(doc && typeof doc === "object", "documento inválido");
  assert(doc.musculacao && typeof doc.musculacao === "object", "faltando musculacao");

  const groups = ["costas","peito","ombros","biceps","triceps","gluteos","quadriceps","posterior_coxa","panturrilhas"];
  const cats = ["halteres","maquinas","cabos"];

  for (const g of groups) {
    assert(doc.musculacao[g], `faltando grupamento: ${g}`);
    for (const c of cats) {
      assert(Array.isArray(doc.musculacao[g][c]), `faltando categoria ${g}.${c}`);
      assert(doc.musculacao[g][c].length > 0, `${g}.${c} está vazio (não permitido)`);
      doc.musculacao[g][c].forEach((ex, idx) => validateExercise(ex, `${g}.${c}[${idx}]`));
    }
  }

  scanProhibited(doc, "FULL_JSON");
}

const files = [
  "musculacao.block1.costas_peito.json",
  "musculacao.block2.ombros_biceps_triceps.json",
  "musculacao.block3.gluteos_quadriceps.json",
  "musculacao.block4.posterior_panturrilhas.json"
].map(f => path.join(base, f));

for (const f of files) {
  assert(fs.existsSync(f), `arquivo não encontrado: ${f}`);
}

let out = JSON.parse(JSON.stringify(TEMPLATE));
for (const f of files) {
  const part = readJSON(f);
  scanProhibited(part, path.basename(f));
  out = deepMerge(out, part);
}

validateFull(out);

const outPath = path.join(base, "musculacao.full.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");

console.log("✅ MERGE OK | FULL JSON:", outPath);
