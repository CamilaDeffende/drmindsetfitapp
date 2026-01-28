#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function die(msg){ throw new Error(msg); }
function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.writeFileSync(p,s,"utf8"); }
function ok(msg){ console.log("✅", msg); }

const FILE = "src/components/steps/Step3Metabolismo.tsx";
const abs = path.join(process.cwd(), FILE);
if (!fs.existsSync(abs)) die(`Arquivo não encontrado: ${FILE}`);

let s = read(FILE);
const before = s;

// bloco que queremos mover (entre marcador e a última linha const __weeklyLabel)
const startMarker = "MF_BLOCO5C_DELTA_GET_TMB_CALC";
const startIdx = s.indexOf(startMarker);
if (startIdx === -1) die("Não achei marcador MF_BLOCO5C_DELTA_GET_TMB_CALC no Step3.");

const blockStart = s.lastIndexOf("\n", startIdx);
if (blockStart === -1) die("Falha ao localizar início do bloco (linha).");

// heurística: bloco termina no final da linha: `const __weeklyLabel = ...;`
const endNeedle = "const __weeklyLabel =";
const endIdx = s.indexOf(endNeedle, startIdx);
if (endIdx === -1) die("Não achei fim do bloco (__weeklyLabel).");

// pega até o fim da linha do __weeklyLabel;
const endLine = s.indexOf("\n", endIdx);
if (endLine === -1) die("Falha ao achar quebra de linha após __weeklyLabel.");

// inclui até essa quebra + 1 linha em branco se existir
let blockEnd = endLine + 1;
if (s.slice(blockEnd, blockEnd + 1) === "\n") blockEnd += 1;

const block = s.slice(blockStart + 1, blockEnd); // sem o \n inicial extra
if (!block.includes("const __delta") || !block.includes("const __weeklyLabel")) {
  die("O bloco localizado não parece o CALC esperado (sanity falhou).");
}

// remove o bloco do lugar atual
s = s.slice(0, blockStart + 1) + s.slice(blockEnd);

// âncora de inserção: depois do destructuring do hook
const hookRe = /const\s+\{\s*state\s*,\s*updateState\s*,\s*nextStep\s*,\s*prevStep\s*\}\s*=\s*useDrMindSetfit\s*\(\s*\)\s*;?\s*\n/;
const m = s.match(hookRe);
if (!m) die("Não achei a linha do useDrMindSetfit() para inserir o bloco (abortando).");

const insertPos = (m.index || 0) + m[0].length;

// evitar duplicar se por acaso já estiver no lugar certo
const afterSlice = s.slice(insertPos, insertPos + 500);
if (afterSlice.includes(startMarker)) die("O bloco já parece estar após o hook (evitando duplicar).");

// inserir com espaçamento premium
s = s.slice(0, insertPos) + "\n" + block.trimEnd() + "\n\n" + s.slice(insertPos);

// sanity: não pode existir uso de state antes da declaração
const firstStateUse = s.search(/\bstate\b/);
const firstStateDecl = s.search(/const\s+\{\s*state\s*,\s*updateState\s*,\s*nextStep\s*,\s*prevStep\s*\}\s*=\s*useDrMindSetfit/);
if (firstStateUse !== -1 && firstStateDecl !== -1 && firstStateUse < firstStateDecl) {
  die("Ainda existe 'state' sendo usado antes da declaração (sanity falhou).");
}

if (s === before) die("Nenhuma alteração aplicada (inesperado).");
write(FILE, s);
ok("Step3Metabolismo: bloco CALC movido para depois do useDrMindSetfit().");
