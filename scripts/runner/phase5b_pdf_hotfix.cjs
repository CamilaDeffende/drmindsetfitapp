#!/usr/bin/env node
/**
 * BLOCO 5B — HOTFIX PDF: inserir "Atividade semanal" no exportar-pdf.ts (robusto)
 * - não depende de string exata
 * - tenta múltiplas âncoras (GET/TMB/metabolismo.* / resultado.*)
 * - falha hard com diagnóstico útil
 */
const fs = require("fs");
const path = require("path");

function die(msg){ throw new Error(msg); }
function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.writeFileSync(p,s,"utf8"); }

const ROOT = process.cwd();
const FILE = path.join(ROOT, "src/lib/exportar-pdf.ts");

if (!fs.existsSync(FILE)) die("src/lib/exportar-pdf.ts não encontrado.");

let s = read(FILE);
const before = s;

if (s.includes("Atividade semanal:")) {
  console.log("ℹ️ exportar-pdf.ts já contém 'Atividade semanal'. Nada a fazer.");
  process.exit(0);
}

const insertLine = `
  yPos += 8
  doc.text(\`Atividade semanal: \${String((metabolismo as any)?.nivelAtividadeSemanal ?? (resultado as any)?.nivelAtividadeSemanal ?? "—")}\`, 25, yPos)
`;

function injectAfterRegex(rx, label){
  const m = s.match(rx);
  if (!m) return false;
  const idx = s.indexOf(m[0]);
  const at = idx + m[0].length;
  s = s.slice(0, at) + insertLine + s.slice(at);
  console.log(`✅ Inserido após âncora: ${label}`);
  return true;
}

// 1) GET em doc.text (qualquer formato)
if (!injectAfterRegex(/doc\.text\(\s*([`'"])\s*GET[\s\S]*?\)\s*;?/m, "doc.text(GET...)")) {
  // 2) TMB em doc.text
  if (!injectAfterRegex(/doc\.text\(\s*([`'"])\s*TMB[\s\S]*?\)\s*;?/m, "doc.text(TMB...)")) {
    // 3) metabolismo.get / metabolismo.tmb (independente do texto)
    if (!injectAfterRegex(/metabolismo\.(get|tmb)[\s\S]{0,120}?;?/m, "metabolismo.get|tmb")) {
      // 4) resultado.get / resultado.tmb
      if (!injectAfterRegex(/resultado\.(get|tmb)[\s\S]{0,120}?;?/m, "resultado.get|tmb")) {
        // 5) seção "Metabolismo" -> primeiro doc.text após a palavra
        const sec = s.match(/Metabolismo[\s\S]{0,800}?doc\.text\([\s\S]*?\)\s*;?/m);
        if (sec) {
          const chunk = sec[0];
          const m2 = chunk.match(/doc\.text\([\s\S]*?\)\s*;?/m);
          if (m2) {
            const globalIdx = s.indexOf(chunk) + chunk.indexOf(m2[0]);
            const at2 = globalIdx + m2[0].length;
            s = s.slice(0, at2) + insertLine + s.slice(at2);
            console.log("✅ Inserido após primeira doc.text() dentro da seção 'Metabolismo'");
          } else {
            die("exportar-pdf.ts: encontrei 'Metabolismo' mas não encontrei doc.text() na janela de 800 chars.");
          }
        } else {
          // diagnóstico: imprimir contexto onde aparece "metab"
          const lines = s.split("\n");
          const hits = [];
          for (let i=0;i<lines.length;i++){
            if (/metab/i.test(lines[i])) hits.push(i);
          }
          const where = hits.length ? hits.slice(0,3).map(n=>`L${n+1}: ${lines[n].slice(0,140)}`).join("\n") : "(nenhuma ocorrência de 'metab' encontrada)";
          die(
            "exportar-pdf.ts: não achei âncora para inserir 'Atividade semanal'.\n" +
            "👉 Cole aqui o trecho do exportar-pdf.ts onde o PDF imprime Metabolismo/TMB/GET.\n" +
            "Achados (primeiras linhas com 'metab'):\n" + where
          );
        }
      }
    }
  }
}

if (s === before) {
  die("exportar-pdf.ts: nenhum patch aplicado (inesperado).");
}

write(FILE, s);
console.log("✅ [BLOCO 5B-PDF HOTFIX] patch aplicado com sucesso.");
