#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function die(msg){ throw new Error(msg); }
function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.writeFileSync(p,s,"utf8"); }
function ok(msg){ console.log("✅", msg); }

const FILE = "src/features/fitness-suite/engine/metabolismoActivity.ts";
const abs = path.join(process.cwd(), FILE);
if (!fs.existsSync(abs)) die(`Arquivo não encontrado: ${FILE}`);

let s = read(FILE);
const before = s;

// 1) Trocar reatribuição proibida em const
if (!s.includes("(fatorAtividade as any) = 1.2") && !s.includes("fatorAtividade = 1.2")) {
  die("Não encontrei a linha de fallback do fatorAtividade (âncora mudou).");
}
s = s.replace(/\(fatorAtividade\s+as\s+any\)\s*=\s*1\.2\s*;/g, "fatorAtividade = 1.2;");

// 2) Garantir que fatorAtividade seja 'let' (se existir como const)
const reConst = /const\s+fatorAtividade\s*=/;
const reLet  = /let\s+fatorAtividade\s*=/;

if (reConst.test(s)) {
  s = s.replace(reConst, "let fatorAtividade =");
}

if (!reLet.test(s)) {
  // se não achou nem const nem let, aborta (não patchar no escuro)
  die("Não consegui localizar declaração de fatorAtividade (nem const nem let).");
}

// 3) Sanity: não pode sobrar cast/atribuição estranha
if (/\(fatorAtividade\s+as\s+any\)\s*=/.test(s)) {
  die("Ainda sobrou reatribuição com cast (sanity falhou).");
}

if (s === before) die("Nenhuma alteração aplicada (inesperado).");
write(FILE, s);
ok("Engine: fatorAtividade agora é 'let' e fallback não causa throw.");
