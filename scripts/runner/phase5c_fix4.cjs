#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

function die(msg){ throw new Error(msg); }
function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.writeFileSync(p,s,"utf8"); }
function ok(msg){ console.log("✅", msg); }

const ROOT = process.cwd();
const STEP3 = "src/components/steps/Step3Metabolismo.tsx";
const ENGINE = "src/features/fitness-suite/engine/metabolismoActivity.ts";

for (const f of [STEP3, ENGINE]) {
  const abs = path.join(ROOT, f);
  if (!fs.existsSync(abs)) die(`Arquivo não encontrado: ${f}`);
}

/* ============================================================
   (A) Step3Metabolismo.tsx — garantir __weeklyLabel e __delta no escopo
   - Usa SOMENTE state (não depende de variáveis locais desconhecidas)
   - Mantém bloco JSX MF_BLOCO5C_DELTA_GET_TMB, mas garante consts
   ============================================================ */
{
  const FILE = STEP3;
  let s = read(FILE);
  const before = s;

  // 1) garantir import do mfActivityWeeklyLabel (uma vez)
  const wantImport = `import { mfActivityWeeklyLabel } from "@/types";`;
  if (!s.includes(wantImport)) {
    // insere após último import
    const lastImportIdx = (() => {
      const re = /^import[\s\S]*?;\s*$/gm;
      let m, last = -1;
      while ((m = re.exec(s))) last = m.index + m[0].length;
      return last;
    })();
    if (lastImportIdx === -1) {
      s = wantImport + "\n" + s;
    } else {
      s = s.slice(0, lastImportIdx) + "\n" + wantImport + s.slice(lastImportIdx);
    }
  }

  // 2) inserir cálculo (se ainda não existir)
  if (!s.includes("MF_BLOCO5C_DELTA_GET_TMB_CALC")) {
    // âncora: primeira ocorrência do uso do state (bem comum)
    const anchorRe = /(const\s+\{\s*state\s*\}\s*=\s*useDrMindSetfit\s*\(\s*\)\s*;?\s*\n)/m;
    const m = s.match(anchorRe);

    if (m) {
      const insert = m[0] + `
  // MF_BLOCO5C_DELTA_GET_TMB_CALC: impacto real do fator semanal (apenas via state => sem risco de escopo)
  const __tmb = Number(
    (state as any)?.resultadoMetabolico?.tmb ??
    (state as any)?.resultadoMetabolico?.TMB ??
    (state as any)?.metabolismo?.tmb ??
    (state as any)?.metabolismo?.TMB ??
    0
  );
  const __get = Number(
    (state as any)?.resultadoMetabolico?.get ??
    (state as any)?.resultadoMetabolico?.GET ??
    (state as any)?.metabolismo?.get ??
    (state as any)?.metabolismo?.GET ??
    0
  );
  const __delta = (isFinite(__get) && isFinite(__tmb)) ? Math.max(0, Math.round(__get - __tmb)) : 0;

  const __weeklyRaw =
    (state as any)?.perfil?.nivelAtividadeSemanal ??
    (state as any)?.resultadoMetabolico?.nivelAtividadeSemanal ??
    (state as any)?.metabolismo?.nivelAtividadeSemanal ??
    "—";
  const __weeklyLabel = mfActivityWeeklyLabel(__weeklyRaw);
`;
      s = s.replace(anchorRe, insert);
    } else {
      // fallback: insere logo após "export function" (ou default function) do componente
      const fnRe = /(export\s+default\s+function\s+Step3Metabolismo|export\s+function\s+Step3Metabolismo|function\s+Step3Metabolismo)\s*\([\s\S]*?\)\s*\{\s*\n/m;
      const fm = s.match(fnRe);
      if (!fm) die("Step3Metabolismo.tsx: não encontrei âncora de função para inserir cálculo (abortando).");

      s = s.replace(fnRe, (hdr) => hdr + `
  // MF_BLOCO5C_DELTA_GET_TMB_CALC: impacto real do fator semanal (apenas via state => sem risco de escopo)
  const __tmb = Number(
    (state as any)?.resultadoMetabolico?.tmb ??
    (state as any)?.resultadoMetabolico?.TMB ??
    (state as any)?.metabolismo?.tmb ??
    (state as any)?.metabolismo?.TMB ??
    0
  );
  const __get = Number(
    (state as any)?.resultadoMetabolico?.get ??
    (state as any)?.resultadoMetabolico?.GET ??
    (state as any)?.metabolismo?.get ??
    (state as any)?.metabolismo?.GET ??
    0
  );
  const __delta = (isFinite(__get) && isFinite(__tmb)) ? Math.max(0, Math.round(__get - __tmb)) : 0;

  const __weeklyRaw =
    (state as any)?.perfil?.nivelAtividadeSemanal ??
    (state as any)?.resultadoMetabolico?.nivelAtividadeSemanal ??
    (state as any)?.metabolismo?.nivelAtividadeSemanal ??
    "—";
  const __weeklyLabel = mfActivityWeeklyLabel(__weeklyRaw);
`);
    }
  }

  // 3) sanity: se JSX usa __delta/__weeklyLabel, eles precisam existir agora
  if (/\{__weeklyLabel\}/.test(s) && !s.includes("const __weeklyLabel")) die("Step3: JSX usa __weeklyLabel mas const não existe (sanity).");
  if (/\{__delta\}/.test(s) && !s.includes("const __delta")) die("Step3: JSX usa __delta mas const não existe (sanity).");

  if (s !== before) {
    write(FILE, s);
    ok("Step3Metabolismo: __weeklyLabel/__delta definidos no escopo + import garantido.");
  } else {
    console.log("ℹ️ Step3Metabolismo: nada a fazer.");
  }
}

/* ============================================================
   (B) metabolismoActivity.ts — remover bloco inválido (nivelAtividadeSemanal fora de escopo)
   - remove import normalizeMFActivityWeeklyLevel se existir
   - remove __lvlNorm/__lvlSafe e comentários do patch ruim
   ============================================================ */
{
  const FILE = ENGINE;
  let s = read(FILE);
  const before = s;

  // remove import (se existir) para evitar unused
  s = s.replace(/^\s*import\s+\{\s*normalizeMFActivityWeeklyLevel\s*\}\s+from\s+["']@\/types["'];\s*\n/m, "");
  s = s.replace(/^\s*import\s+\{\s*normalizeMFActivityWeeklyLevel\s*\}\s+from\s+["']@\/types\/index["'];\s*\n/m, "");
  s = s.replace(/^\s*import\s+\{\s*normalizeMFActivityWeeklyLevel\s*\}\s+from\s+["']@\/types\/index\.ts["'];\s*\n/m, "");

  // remove bloco inserido que referencia nivelAtividadeSemanal inexistente
  s = s.replace(
    /\n\s*\/\/\s*BLOCO 5C: normaliza \+ fallback seguro[\s\S]*?\n\s*const\s+__lvlSafe[\s\S]*?\n/gm,
    "\n"
  );

  // remove linhas soltas (caso o regex não pegue tudo)
  s = s.replace(/^\s*const\s+__lvlNorm[\s\S]*?;\s*$/gm, "");
  s = s.replace(/^\s*const\s+__lvlSafe[\s\S]*?;\s*$/gm, "");

  // sanity: não pode sobrar normalizeMFActivityWeeklyLevel sem import
  if (/normalizeMFActivityWeeklyLevel/.test(s)) {
    // se sobrou uso, aborta (aqui queremos remover tudo)
    die("Engine: ainda existe uso de normalizeMFActivityWeeklyLevel após limpeza (abortando para não quebrar).");
  }

  if (s !== before) {
    write(FILE, s);
    ok("Engine: removido bloco inválido de normalização (sem referências fora de escopo).");
  } else {
    console.log("ℹ️ Engine: nada a fazer.");
  }
}

ok("HOTFIX 5C (FIX4) aplicado com sucesso.");
