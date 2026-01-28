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

// 1) Remover specifiers/imports mortos conhecidos
s = s.replace(
  /import\s+\{\s*Card\s*,\s*CardContent\s*,\s*CardDescription\s*,\s*CardHeader\s*,\s*CardTitle\s*\}\s+from\s+['"]@\/components\/ui\/card['"]\s*;?/,
  "import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'"
);

// linhas inteiras (se existirem)
s = s.replace(/^\s*import\s+\{\s*Badge\s*\}\s+from\s+['"]@\/components\/ui\/badge['"]\s*;?\s*$/gm, "");
s = s.replace(/^\s*import\s+\{\s*Progress\s*\}\s+from\s+['"]@\/components\/ui\/progress['"]\s*;?\s*$/gm, "");
s = s.replace(/^\s*import\s+\{\s*sumAlimentosTotals\s*\}\s+from\s+['"]@\/engine\/nutrition\/NutritionEngine['"]\s*;?\s*$/gm, "");
s = s.replace(/^\s*import\s+\{\s*Calendar\s*,\s*TrendingUp\s*,\s*Clock\s*\}\s+from\s+['"]lucide-react['"]\s*;?\s*$/gm, "");

// Se existir qualquer import legado do NutritionEngine (não usamos mais no UI novo), remove a linha toda
s = s.replace(/^\s*import\s+\{[\s\S]*?\}\s+from\s+['"]@\/engine\/nutrition\/NutritionEngine['"]\s*;?\s*$/gm, "");

// 2) Remover bloco legado de variáveis não usadas dentro do componente (o TS acusou)
const legacyBlockRe =
/^\s*const\s+\{\s*nutricao\s*,\s*dataInicio\s*,\s*dataFim\s*,\s*duracaoSemanas\s*,\s*estrategia\s*\}\s*=\s*dietaAtiva\s*\n[\s\S]*?^\s*const\s+mensagemStatus\s*=\s*getMensagemStatus\s*\(\s*status\s*\)\s*;?\s*$/m;

if (legacyBlockRe.test(s)) {
  s = s.replace(legacyBlockRe, "  // (removido) bloco legado não utilizado — UI BLOCO6B usa cálculo novo (refeicoes/day)\n");
} else {
  // fallback: remove linhas individuais se o bloco mudou levemente
  const lines = [
    /^\s*const\s+\{\s*nutricao\s*,\s*dataInicio\s*,\s*dataFim\s*,\s*duracaoSemanas\s*,\s*estrategia\s*\}\s*=\s*dietaAtiva\s*;?\s*$/m,
    /^\s*const\s+dayTotals\s*=\s*sumMacrosFromRefeicoes\([\s\S]*?\)\s*;?\s*$/m,
    /^\s*const\s+pesoKg\s*=\s*guessPesoKgFromStateLike\([\s\S]*?\)\s*;?\s*$/m,
    /^\s*const\s+science\s*=\s*validateDietScience\([\s\S]*?\)\s*;?\s*$/m,
    /^\s*const\s+\{\s*semanaAtual\s*,\s*totalSemanas\s*,\s*status\s*,\s*diasRestantes\s*,\s*progressoPorcentagem\s*\}\s*=\s*[\s\S]*?\n/m,
    /^\s*const\s+periodoFormatado\s*=\s*formatarPeriodo\([\s\S]*?\)\s*;?\s*$/m,
    /^\s*const\s+mensagemStatus\s*=\s*getMensagemStatus\([\s\S]*?\)\s*;?\s*$/m,
  ];
  for (const re of lines) s = s.replace(re, "");
}

// 3) Limpeza de múltiplas linhas vazias
s = s.replace(/\n{4,}/g, "\n\n\n");

// Sanity: marcador do BLOCO6B deve continuar existindo
if (!s.includes("MF_BLOCO6B_DIETA_UI")) die("Sanity: marcador MF_BLOCO6B_DIETA_UI sumiu.");

// Sanity: imports não podem ficar com chaves vazias
s = s.replace(/^\s*import\s+\{\s*\}\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm, "");

if (s === before) die("Nenhuma alteração aplicada (inesperado).");
write(FILE, s);
console.log("✅ FIX6 aplicado em:", FILE);
