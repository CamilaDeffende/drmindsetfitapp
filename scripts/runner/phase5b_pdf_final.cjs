#!/usr/bin/env node
/**
 * BLOCO 5B — PDF FINAL (robusto e científico)
 * Objetivo: incluir "Atividade semanal: ..." no PDF onde o Metabolismo aparece,
 * SEM depender de âncoras frágeis (TMB/GET/metab).
 *
 * Estratégias (em ordem):
 * A) autoTable body/rows que contenham palavras do metabolismo -> injeta uma row
 * B) arrays de linhas/itens que contenham basal/gasto/energético -> injeta item
 * C) fallback: após a primeira ocorrência de um doc.text com "basal/gasto/energ" -> injeta doc.text
 *
 * Se falhar: imprime um "ANCHOR REPORT" com linhas candidatas e sai com code 1 (hard fail).
 */
const fs = require("fs");
const path = require("path");

function die(msg){ console.error("\n❌ " + msg + "\n"); process.exit(1); }
function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.writeFileSync(p,s,"utf8"); }
function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

const ROOT = process.cwd();
const FILE = path.join(ROOT, "src/lib/exportar-pdf.ts");
if (!fs.existsSync(FILE)) die("src/lib/exportar-pdf.ts não encontrado.");

let s = read(FILE);
const before = s;

if (/Atividade semanal\s*:/i.test(s)) {
  console.log("ℹ️ exportar-pdf.ts já contém 'Atividade semanal'. Nada a fazer.");
  process.exit(0);
}

// Palavra-chave metabolismo (PT/EN) — serve para encontrar o bloco real do PDF
const KW = [
  "metabol", "basal", "taxa metab", "tmb", "get", "gasto", "energ", "caloria", "kcal",
  "gasto energético", "gasto energetico", "energia total", "total diário", "total diario"
];

// Valor (fallback seguro)
const valueExpr =
  'String((metabolismo as any)?.nivelAtividadeSemanal ?? (resultado as any)?.nivelAtividadeSemanal ?? (data as any)?.nivelAtividadeSemanal ?? "—")';

// (A) autoTable: inserir row dentro de body/rows se o body contém metabolismo
// - Detecta: autoTable({ ... body: [...] ... }) OU autoTable(doc, { body: [...] })
function tryInjectAutoTableRow() {
  // pega blocos autoTable(...) com body:[...]
  const rx = /autoTable\s*\([\s\S]*?\{[\s\S]*?\bbody\s*:\s*(\[[\s\S]*?\])[\s\S]*?\}[\s\S]*?\)\s*;?/gm;

  let m;
  while ((m = rx.exec(s))) {
    const whole = m[0];
    const body = m[1];

    const bodyLower = body.toLowerCase();
    const hit = KW.some(k => bodyLower.includes(k));
    if (!hit) continue;

    // injeta uma row logo após a primeira row do body
    // formato comum: [ ["Label","Value"], ... ] ou [ [..], [..] ]
    // Vamos inserir após o primeiro '[' interno (primeira row).
    const row = `\n    ["Atividade semanal", ${valueExpr}],`;

    // encontra após a primeira row existente: após o primeiro '],' que fecha a primeira row
    const closeFirstRow = body.indexOf("],");
    if (closeFirstRow === -1) continue;

    const injectedBody = body.slice(0, closeFirstRow + 2) + row + body.slice(closeFirstRow + 2);
    const replaced = whole.replace(body, injectedBody);

    s = s.replace(whole, replaced);
    console.log("✅ PDF: inserido row em autoTable(body) dentro do bloco de Metabolismo.");
    return true;
  }
  return false;
}

// (B) arrays de linhas (strings) — ex: const linhas = [ "TMB: ...", "GET: ..." ]
function tryInjectLinesArray() {
  // procura arrays com strings que contenham keywords
  const rx = /(const|let)\s+([A-Za-z0-9_]+)\s*=\s*\[[\s\S]*?\];/gm;
  let m;
  while ((m = rx.exec(s))) {
    const whole = m[0];
    const lower = whole.toLowerCase();
    const hit = KW.some(k => lower.includes(k));
    if (!hit) continue;

    // injeta como string linha
    const insert = `\n  \`Atividade semanal: \${${valueExpr}}\`,`;

    // insere depois da primeira string do array
    const pos = whole.indexOf("`");
    const pos2 = whole.indexOf("'", 0);
    const pos3 = whole.indexOf('"', 0);
    const firstStrPos = [pos, pos2, pos3].filter(x => x >= 0).sort((a,b)=>a-b)[0];
    if (firstStrPos == null) continue;

    // achar fim da primeira entrada (vírgula depois)
    const commaAfter = whole.indexOf(",", firstStrPos);
    if (commaAfter === -1) continue;

    const injected = whole.slice(0, commaAfter + 1) + insert + whole.slice(commaAfter + 1);
    s = s.replace(whole, injected);
    console.log("✅ PDF: inserido linha em array de linhas do bloco de Metabolismo.");
    return true;
  }
  return false;
}

// (C) fallback doc.text: após doc.text que menciona basal/gasto/energético/calorias/kcal
function tryInjectDocText() {
  const rx = /doc\.text\(\s*([\s\S]*?)\)\s*;?/gm;
  let m;
  while ((m = rx.exec(s))) {
    const call = m[0];
    const lower = call.toLowerCase();
    const hit = KW.some(k => lower.includes(k));
    if (!hit) continue;

    // inserir doc.text logo após essa chamada
    const insert = `\n  yPos += 8;\n  doc.text(\`Atividade semanal: \${${valueExpr}}\`, 25, yPos);\n`;
    const idx = s.indexOf(call);
    if (idx === -1) continue;
    const at = idx + call.length;
    s = s.slice(0, at) + insert + s.slice(at);
    console.log("✅ PDF: inserido doc.text após bloco de Metabolismo (fallback).");
    return true;
  }
  return false;
}

let ok = false;
if (!ok) ok = tryInjectAutoTableRow();
if (!ok) ok = tryInjectLinesArray();
if (!ok) ok = tryInjectDocText();

if (!ok || s === before) {
  // ANCHOR REPORT: mostrar linhas candidatas
  const lines = before.split("\n");
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const L = lines[i];
    const low = L.toLowerCase();
    if (KW.some(k => low.includes(k))) hits.push(i);
  }

  const report = hits.slice(0, 60).map(n => {
    const a = Math.max(0, n-1), b = Math.min(lines.length-1, n+1);
    return [
      `---`,
      `L${a+1}: ${lines[a]}`.slice(0, 220),
      `L${n+1}: ${lines[n]}`.slice(0, 220),
      `L${b+1}: ${lines[b]}`.slice(0, 220),
    ].join("\n");
  }).join("\n");

  console.error("\n================= ANCHOR REPORT (exportar-pdf.ts) =================");
  console.error(report || "(nenhuma linha com keywords de metabolismo encontrada)");
  console.error("====================================================================\n");

  die("exportar-pdf.ts: não foi possível inserir 'Atividade semanal' automaticamente. As keywords não aparecem no formato esperado.");
}

write(FILE, s);
console.log("✅ [BLOCO 5B-PDF FINAL] patch aplicado com sucesso.");
