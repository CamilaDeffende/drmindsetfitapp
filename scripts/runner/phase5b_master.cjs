#!/usr/bin/env node
/**
 * BLOCO 5B — Propagação do nivelAtividadeSemanal (UI/Report/PDF) — versão robusta
 * - NÃO depende de "export default function Report"
 * - Injeta helpers após imports (ou topo do arquivo)
 * - Usa múltiplas âncoras/fallbacks; se não encontrar, falha com diagnóstico objetivo.
 */
const fs = require("fs");
const path = require("path");

function die(msg){ throw new Error(msg); }
function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.writeFileSync(p,s,"utf8"); }
function exists(p){ return fs.existsSync(p); }

const ROOT = process.cwd();
const F = (p) => path.join(ROOT, p);

const targets = {
  Report: "src/pages/Report.tsx",
  Step8:  "src/components/steps/Step8Relatorio.tsx",
  ExportPDF: "src/lib/exportar-pdf.ts",
  Step3:  "src/components/steps/Step3Metabolismo.tsx",
};

for (const [k,p] of Object.entries(targets)){
  if(!exists(F(p))) die(`Target ausente: ${k} -> ${p}`);
}

function insertAfterImports(file, snippet, key){
  let s = read(file);
  if (s.includes(snippet.trim())) return { changed:false };

  const importRe = /^import[^\n]*\n/gm;
  let last = -1, m;
  while ((m = importRe.exec(s)) !== null) last = importRe.lastIndex;

  if (last > -1) {
    // insere após o último import + uma quebra
    s = s.slice(0,last) + "\n" + snippet + "\n" + s.slice(last);
  } else {
    // sem imports: topo
    s = snippet + "\n" + s;
  }
  write(file,s);
  return { changed:true };
}

function mustReplace(file, from, to, label){
  let s = read(file);
  if (s.includes(to)) return { changed:false };
  if (!s.includes(from)) die(`${path.basename(file)}: âncora não encontrada (${label})`);
  s = s.replace(from, to);
  write(file,s);
  return { changed:true };
}

function tryInjectAfterFirstMatch(file, regex, insert, label){
  let s = read(file);
  if (s.includes(insert.trim())) return { changed:false };
  const m = s.match(regex);
  if (!m) return { changed:false, missed:true, label };
  const idx = s.indexOf(m[0]);
  const at = idx + m[0].length;
  s = s.slice(0, at) + insert + s.slice(at);
  write(file,s);
  return { changed:true };
}

/* -----------------------------
 * (1) Report.tsx
 * - helper mfActivityWeeklyLabel
 * - chip "Atividade semanal"
 * ----------------------------- */
{
  const f = F(targets.Report);
  const helper = `
function mfActivityWeeklyLabel(v) {
  const x = String(v || "").toLowerCase();
  if (x === "sedentario") return "Sedentário (0x/semana)";
  if (x === "moderadamente_ativo" || x === "moderadamente-ativo") return "Moderadamente ativo (1–3x/semana)";
  if (x === "ativo") return "Ativo (3–5x/semana)";
  if (x === "muito_ativo" || x === "muito-ativo") return "Muito ativo (5x+/semana)";
  return "—";
}
`.trim();

  insertAfterImports(f, helper, "helper");

  // Tentativa 1: âncora mais provável (se existir)
  // <div ...>Metabolismo</div>  -> injeta chip logo depois
  const chip = `
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[12px] text-white/80">
                      Atividade semanal: <b className="text-white">{mfActivityWeeklyLabel(state?.metabolismo?.nivelAtividadeSemanal)}</b>
                    </span>
                  </div>
`.trimEnd() + "\n";

  let injected = false;

  // 1) Match exato/semiexato “Metabolismo</div>”
  let r = tryInjectAfterFirstMatch(
    f,
    />\s*Metabolismo\s*<\/div>/,
    "\n" + chip,
    "chip_after_metabolismo_div"
  );
  if (r.changed) injected = true;

  // 2) Fallback: seção com “TMB” (injeta logo após primeira ocorrência de TMB label)
  if (!injected) {
    r = tryInjectAfterFirstMatch(
      f,
      /TMB\s*[:\)]/,
      "\n" + chip,
      "chip_after_TMB_label"
    );
    if (r.changed) injected = true;
  }

  // 3) Fallback: seção com “GET” (mesma lógica)
  if (!injected) {
    r = tryInjectAfterFirstMatch(
      f,
      /GET\s*[:\)]/,
      "\n" + chip,
      "chip_after_GET_label"
    );
    if (r.changed) injected = true;
  }

  if (!injected) {
    die("Report.tsx: não consegui localizar uma âncora estável (Metabolismo/TMB/GET) para inserir o chip. Me mande 20 linhas do trecho de Metabolismo no Report.tsx (sem OCR) que eu adapto com âncora exata.");
  }
}

/* -----------------------------
 * (2) Step8Relatorio.tsx
 * - inserir linha “Atividade semanal”
 * ----------------------------- */
{
  const f = F(targets.Step8);
  let s = read(f);
  const before = s;

  if (!s.includes("Atividade semanal:")) {
    // tenta após "Equação aplicada"
    const re = /(Equação aplicada:[\s\S]*?<\/CardDescription>)/m;
    if (re.test(s)) {
      s = s.replace(
        re,
        `$1\n            <CardDescription>Atividade semanal: <span className="font-medium">{String(state.metabolismo?.nivelAtividadeSemanal || "—")}</span></CardDescription>`
      );
    } else if (s.includes("GET") || s.includes("TMB")) {
      // fallback: insere após primeira CardDescription que cite GET/TMB
      s = s.replace(
        /(<CardDescription>[\s\S]*?(GET|TMB)[\s\S]*?<\/CardDescription>)/m,
        `$1\n            <CardDescription>Atividade semanal: <span className="font-medium">{String(state.metabolismo?.nivelAtividadeSemanal || "—")}</span></CardDescription>`
      );
    } else {
      die("Step8Relatorio.tsx: não encontrei âncora (Equação aplicada/GET/TMB) para inserir Atividade semanal.");
    }
  }

  if (s !== before) write(f, s);
}

/* -----------------------------
 * (3) exportar-pdf.ts
 * - inserir linha no PDF: Atividade semanal
 * ----------------------------- */
{
  const f = F(targets.ExportPDF);
  let s = read(f);
  const before = s;

  if (!s.includes("Atividade semanal:")) {
    const a1 = "doc.text(`GET: ${metabolismo.get} kcal`, 25, yPos)";
    const a2 = "doc.text(`TMB: ${metabolismo.tmb} kcal`, 25, yPos)";

    if (s.includes(a1)) {
      s = s.replace(
        a1,
        `${a1}\n  yPos += 8\n  doc.text(\`Atividade semanal: \${String(metabolismo.nivelAtividadeSemanal || "—")}\`, 25, yPos)`
      );
    } else if (s.includes(a2)) {
      s = s.replace(
        a2,
        `${a2}\n  yPos += 8\n  doc.text(\`Atividade semanal: \${String(metabolismo.nivelAtividadeSemanal || "—")}\`, 25, yPos)`
      );
    } else {
      die("exportar-pdf.ts: âncora (GET/TMB) não encontrada para inserir Atividade semanal.");
    }
  }

  if (s !== before) write(f, s);
}

/* -----------------------------
 * (4) Step3Metabolismo.tsx
 * - UX premium: mostrar seleção semanal + fator aplicado (se existir)
 * ----------------------------- */
{
  const f = F(targets.Step3);
  let s = read(f);
  const before = s;

  if (!s.includes("Atividade semanal selecionada:")) {
    const anchor = "Metabolismo calibrado";
    if (!s.includes(anchor)) die("Step3Metabolismo.tsx: texto 'Metabolismo calibrado' não encontrado.");

    s = s.replace(
      anchor,
      `${anchor}</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Atividade semanal selecionada: <span className="text-white font-medium">{String((resultado as any)?.nivelAtividadeSemanal || (state as any)?.metabolismo?.nivelAtividadeSemanal || "—")}</span>
              {Number.isFinite(Number((resultado as any)?.fafFinal ?? (resultado as any)?.faf)) ? (
                <span className="text-white/70"> • Fator aplicado: <b className="text-white">{String((resultado as any)?.fafFinal ?? (resultado as any)?.faf)}</b></span>
              ) : null}
            </p>
            <h2 className="text-3xl font-bold mb-2">`
    );
  }

  if (s !== before) write(f, s);
}

console.log("✅ [BLOCO 5B] patch aplicado com sucesso (anchors robustas).");
