#!/usr/bin/env node
const fs = require("fs");

function die(msg){ throw new Error(msg); }
function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.writeFileSync(p,s,"utf8"); }
function backup(p){
  const ts = new Date().toISOString().replace(/[:.]/g,"-");
  const out = `.backups/${p.replace(/\//g,"__")}.${ts}.bak`;
  fs.mkdirSync(".backups",{recursive:true});
  fs.copyFileSync(p,out);
  console.log("✅ BACKUP:", out);
}

const FILE = "src/components/planos/DietaAtivaView.tsx";
if (!fs.existsSync(FILE)) die("Não achei: " + FILE);

backup(FILE);
let s = read(FILE);
const before = s;

// 1) Garantir import do Card (usado no JSX)
const cardImport = "import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'";
if (!new RegExp(cardImport.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).test(s)) {
  // remove qualquer import antigo quebrado de card (se existir)
  s = s.replace(/^\s*import\s+\{[^}]*\}\s+from\s+['"]@\/components\/ui\/card['"]\s*;?\s*$/gm, "");
  // inserir no topo, após imports iniciais (primeiro bloco de imports)
  const m = s.match(/^(?:import[^\n]*\n)+/);
  if (m) {
    s = s.slice(0, m[0].length) + cardImport + "\n" + s.slice(m[0].length);
  } else {
    s = cardImport + "\n" + s;
  }
}

// 2) Remover state não usado
s = s.replace(/^\s*const\s*\{\s*state\s*\}\s*=\s*useDrMindSetfit\(\)\s*;?\s*$/m, "");

// 3) Se useDrMindSetfit sobrou apenas “solto”, remover também import e chamada
const usesHook = (s.match(/\buseDrMindSetfit\s*\(/g) || []).length;
if (usesHook === 0) {
  // remove import do hook se existir
  s = s.replace(/^\s*import\s*\{\s*useDrMindSetfit\s*\}\s*from\s*['"]@\/contexts\/DrMindSetfitContext['"]\s*;?\s*$/gm, "");
}

// 4) limpar excesso de linhas vazias no topo
s = s.replace(/\n{4,}/g, "\n\n\n").replace(/^\n+/, "");

// sanity: JSX usa Card? então precisa do import (check simples)
if (/\<Card\b/.test(s) && !/from\s+['"]@\/components\/ui\/card['"]/.test(s)) {
  die("Sanity: JSX usa <Card> mas import de card não está presente.");
}

if (s === before) die("Nenhuma alteração aplicada (inesperado).");
write(FILE, s);
console.log("✅ FIX7 aplicado em:", FILE);
