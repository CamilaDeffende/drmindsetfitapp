#!/usr/bin/env node
/* BLOCO 6A — Planos Ativos / Dieta editável
   Objetivo:
   - Garantir que PlanosAtivos (Aba Dieta) mostre RESUMO + CTA claro "Editar Nutrição"
   - Botão leva pra rota correta de Nutrição (existente no app)
   - Não mexer em engine/calculos agora (só UX/integração segura)
   - BUILD VERDE SEMPRE
*/
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

const PLANOS = "src/pages/PlanosAtivos.tsx";
if (!fs.existsSync(PLANOS)) die("Não achei src/pages/PlanosAtivos.tsx");

backup(PLANOS);
let s = read(PLANOS);
const before = s;

// 1) Inferir rota de Nutrição existente (prioridade)
const routeCandidates = [
  "/nutrition",
  "/nutricao",
  "/dieta",
];

function inferRoute(){
  // tenta achar em rotas do próprio arquivo
  for (const r of routeCandidates){
    if (s.includes(`"${r}"`) || s.includes(`'${r}'`)) return r;
  }
  // fallback: /nutrition (padrão que você já usa em conversas anteriores)
  return "/nutrition";
}

const NUTRI_ROUTE = inferRoute();

// 2) Garantir imports necessários: useNavigate + Button (se já existirem, não duplica)
function ensureImport(from, named){
  const re = new RegExp(`from\\s+['"]${from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}['"]`);
  if (!re.test(s)) return false;

  // se já tem import { ... } from '...'
  const impRe = new RegExp(`import\\s*\\{([\\s\\S]*?)\\}\\s*from\\s*['"]${from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}['"]`);
  const m = s.match(impRe);
  if (m){
    const inside = m[1];
    if (inside.split(",").map(x=>x.trim()).includes(named)) return true;
    const replaced = m[0].replace(m[1], inside.trim().replace(/\s+$/,"") + `, ${named}\n`);
    s = s.replace(m[0], replaced);
    return true;
  }
  return false;
}

// se não existir import de useNavigate, adiciona
if (!/useNavigate/.test(s)){
  s = `import { useNavigate } from "react-router-dom";\n` + s;
}

// 3) Inserir navigate hook no componente (sem depender do nome exato do componente)
if (!/const\s+navigate\s*=\s*useNavigate\(\)/.test(s)){
  // âncora segura: primeiro "{ state }" ou "useDrMindSetfit()"
  const hookAnchor = s.match(/const\s*\{\s*state[\s\S]*?\}\s*=\s*useDrMindSetfit\s*\(\s*\)\s*;?/);
  if (hookAnchor){
    s = s.replace(hookAnchor[0], hookAnchor[0] + `\n  const navigate = useNavigate();\n`);
  } else {
    // fallback: após "export function" ou "function PlanosAtivos"
    const fnAnchor = s.match(/export\s+function\s+\w+\s*\(\s*\)\s*\{/);
    if (!fnAnchor) die("PlanosAtivos.tsx: não achei âncora de function para injetar useNavigate().");
    s = s.replace(fnAnchor[0], fnAnchor[0] + `\n  const navigate = useNavigate();\n`);
  }
}

// 4) Garantir CTA "Editar Nutrição" na área da Dieta (sem quebrar layout)
// Estratégia: procurar pelo texto/label "Dieta" e inserir um botão próximo.
const buttonJSX =
`\n\n        <div className="mt-4">
          <Button
            onClick={() => navigate("${NUTRI_ROUTE}")}
            className="w-full h-11 text-base font-semibold glow-blue"
          >
            Editar Nutrição
          </Button>
          <p className="mt-2 text-xs text-gray-400">
            Ajuste refeições, alimentos e equivalências mantendo a consistência calórica do plano.
          </p>
        </div>\n`;

// âncora 1: bloco que contenha "Dieta" e "TabsContent" (muito provável)
let injected = false;
const tabDietaRe = /(<TabsContent[^>]*value\s*=\s*["']dieta["'][\s\S]*?)(<\/TabsContent>)/m;
if (tabDietaRe.test(s)){
  s = s.replace(tabDietaRe, (all, a, b) => {
    if (a.includes("Editar Nutrição")) return all;
    injected = true;
    return a + buttonJSX + b;
  });
}

// âncora 2: algum header/título "Dieta" em Card (fallback)
if (!injected){
  const dietTitleRe = /(Dieta\s*Ativa|Plano\s*de\s*Dieta|Dieta)/;
  if (dietTitleRe.test(s)){
    // insere após a primeira ocorrência de "Dieta" em JSX (muito conservador)
    const idx = s.search(dietTitleRe);
    if (idx !== -1){
      const slice = s.slice(idx, idx+800);
      // tenta inserir após um fechamento de tag próximo para não quebrar texto
      const closeIdx = slice.indexOf("</");
      if (closeIdx !== -1){
        const insertPos = idx + closeIdx;
        s = s.slice(0, insertPos) + buttonJSX + s.slice(insertPos);
        injected = true;
      }
    }
  }
}

if (!injected) {
  die("BLOCO 6A: não consegui achar âncora segura da aba Dieta para inserir o CTA. Preciso ajustar a estratégia de injeção pelo layout real.");
}

if (s === before) die("BLOCO 6A: nenhum patch aplicado (inesperado).");
write(PLANOS, s);
console.log("✅ BLOCO 6A: CTA 'Editar Nutrição' inserido em PlanosAtivos (rota:", NUTRI_ROUTE, ")");
