#!/usr/bin/env node
"use strict";

/**
 * BLOCO 5C
 * 1) Canonizar nivelAtividadeSemanal (enum/string union) + normalizador
 * 2) Guardrails anti-NaN no fator de atividade
 * 3) UX premium: mostrar impacto real Δ = GET - TMB e explicar
 *
 * Alvos explícitos (sem âncoras frágeis):
 * - src/types/index.ts
 * - src/features/fitness-suite/engine/metabolismoActivity.ts
 * - src/components/steps/Step3Metabolismo.tsx
 *
 * Regra: não quebrar fluxo, build sempre verde.
 */

const fs = require("fs");
const path = require("path");

function die(msg) { throw new Error(msg); }
function read(p) { return fs.readFileSync(p, "utf8"); }
function write(p, s) { fs.writeFileSync(p, s, "utf8"); }
function ok(msg) { console.log("✅", msg); }

const ROOT = process.cwd();
const FILES = {
  TYPES: "src/types/index.ts",
  ENGINE: "src/features/fitness-suite/engine/metabolismoActivity.ts",
  STEP3: "src/components/steps/Step3Metabolismo.tsx",
};

for (const [k, rel] of Object.entries(FILES)) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) die(`Arquivo não encontrado (${k}): ${rel}`);
}

console.log("ℹ️ ==> [BLOCO 5C] Targets OK:");
for (const rel of Object.values(FILES)) console.log(" -", rel);

/* ============================================================
   (A) TYPES: criar enum canônico + normalizador + label
   ============================================================ */
{
  const FILE = FILES.TYPES;
  let s = read(FILE);
  const before = s;

  // Se já existir, não duplicar
  const hasType = /export\s+type\s+MFActivityWeeklyLevel\b/.test(s);
  const hasNorm = /export\s+function\s+normalizeMFActivityWeeklyLevel\b/.test(s);
  const hasLabel = /export\s+function\s+mfActivityWeeklyLabel\b/.test(s);

  // Inserir no final (mais seguro) — mantendo estilo do projeto
  if (!hasType || !hasNorm || !hasLabel) {
    const block = `
/** MindsetFit: Atividade semanal (canônico) */
export type MFActivityWeeklyLevel =
  | "sedentario"
  | "moderadamente_ativo"
  | "ativo"
  | "muito_ativo";

export function normalizeMFActivityWeeklyLevel(v: unknown): MFActivityWeeklyLevel | undefined {
  const x = String(v ?? "").trim().toLowerCase();
  if (!x) return undefined;

  // aceita variações comuns (hífen/espaco)
  const y = x
    .replace(/\\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/__+/g, "_");

  if (y === "sedentario") return "sedentario";
  if (y === "moderadamente_ativo") return "moderadamente_ativo";
  if (y === "ativo") return "ativo";
  if (y === "muito_ativo") return "muito_ativo";
  return undefined;
}

export function mfActivityWeeklyLabel(v: unknown): string {
  const n = normalizeMFActivityWeeklyLevel(v);
  if (n === "sedentario") return "Sedentário (0x/semana)";
  if (n === "moderadamente_ativo") return "Moderadamente ativo (1–3x/semana)";
  if (n === "ativo") return "Ativo (3–5x/semana)";
  if (n === "muito_ativo") return "Muito ativo (5x+/semana)";
  return "—";
}
`.trim() + "\n";

    // Garantir que não colamos duas vezes
    if (!hasType) s += "\n" + block;
    // Se já tinha o type mas não tinha as funções, cola só o que falta (simples: cola tudo e remove duplicatas? Não.)
    // Estratégia segura: se tinha type, mas não funções, cola só funções.
    if (hasType && (!hasNorm || !hasLabel)) {
      const fnOnly = `
export function normalizeMFActivityWeeklyLevel(v: unknown): MFActivityWeeklyLevel | undefined {
  const x = String(v ?? "").trim().toLowerCase();
  if (!x) return undefined;

  const y = x
    .replace(/\\s+/g, "_")
    .replace(/-+/g, "_")
    .replace(/__+/g, "_");

  if (y === "sedentario") return "sedentario";
  if (y === "moderadamente_ativo") return "moderadamente_ativo";
  if (y === "ativo") return "ativo";
  if (y === "muito_ativo") return "muito_ativo";
  return undefined;
}

export function mfActivityWeeklyLabel(v: unknown): string {
  const n = normalizeMFActivityWeeklyLevel(v);
  if (n === "sedentario") return "Sedentário (0x/semana)";
  if (n === "moderadamente_ativo") return "Moderadamente ativo (1–3x/semana)";
  if (n === "ativo") return "Ativo (3–5x/semana)";
  if (n === "muito_ativo") return "Muito ativo (5x+/semana)";
  return "—";
}
`.trim() + "\n";
      if (!hasNorm || !hasLabel) s += "\n" + fnOnly;
    }
  }

  if (s !== before) {
    write(FILE, s);
    ok("Types: MFActivityWeeklyLevel + normalize + label adicionados (canônico).");
  } else {
    console.log("ℹ️ Types: nada a fazer (já canônico).");
  }
}

/* ============================================================
   (B) ENGINE: guardrails anti-NaN + normalização
   ============================================================ */
{
  const FILE = FILES.ENGINE;
  let s = read(FILE);
  const before = s;

  // garantir import do normalizador se usarmos
  if (!/normalizeMFActivityWeeklyLevel/.test(s)) {
    // tenta inserir junto do bloco de imports
    if (/from\s+["']@\/types\/index["']/.test(s)) {
      s = s.replace(
        /from\s+["']@\/types\/index["']\s*;/,
        (m) => m.replace(";", ", normalizeMFActivityWeeklyLevel;")
      );
      // se o replace acima não funcionou (por não ser import named), cai pro plano B:
    }
  }

  // Plano B: inserir import explícito se não existir
  if (!/normalizeMFActivityWeeklyLevel/.test(s)) {
    const impAnchor = s.match(/(^import[\s\S]*?\n)\n/m);
    if (impAnchor) {
      s = s.replace(
        impAnchor[0],
        impAnchor[0] + `import { normalizeMFActivityWeeklyLevel } from "@/types";\n`
      );
    } else {
      s = `import { normalizeMFActivityWeeklyLevel } from "@/types";\n` + s;
    }
  }

  // Guardrail: ao calcular fator/GET, evitar NaN e usar normalize
  // Procura local onde nivelAtividadeSemanal é lido.
  // (Se já existe leitura, ajusta; se não existe, não inventa lógica — BLOCO 5A já colocou leitura.)
  // Padrão: algo como: const lvl = ...nivelAtividadeSemanal...
  // Vamos inserir um normalize + fallback seguro perto da primeira ocorrência de nivelAtividadeSemanal
  if (s.includes("nivelAtividadeSemanal") && !s.includes("normalizeMFActivityWeeklyLevel(")) {
    s = s.replace(
      /(nivelAtividadeSemanal[\s\S]{0,120};)/m,
      (m) => {
        return m + `
  // BLOCO 5C: normaliza + fallback seguro
  const __lvlNorm = normalizeMFActivityWeeklyLevel((nivelAtividadeSemanal as any));
  const __lvlSafe = __lvlNorm ?? (nivelAtividadeSemanal as any) ?? "sedentario";
`;
      }
    );
  }

  // Guardrail final: após calcular fator, garantir número finito
  // Inserir uma proteção genérica: se existir getActivityFactor(...) ou computeGET(...) usamos fallback.
  if (!s.includes("BLOCO 5C: guardrail fator")) {
    s = s.replace(
      /(const\s+fatorAtividade[\s\S]{0,200}=\s*[^;]+;)/m,
      (m) => {
        return m + `
  // BLOCO 5C: guardrail fator (evita NaN/undefined)
  if (typeof fatorAtividade !== "number" || !isFinite(fatorAtividade) || fatorAtividade <= 0) {
    // fallback seguro: sedentário ≈ 1.2 (padrão comum em TDEE)
    // Mantemos conservador para não inflar GET indevidamente.
    (fatorAtividade as any) = 1.2;
  }
`;
      }
    );
  }

  if (s !== before) {
    write(FILE, s);
    ok("Engine: normalização + guardrails anti-NaN aplicados (fallback seguro).");
  } else {
    console.log("ℹ️ Engine: nada a fazer (já hardenizado).");
  }
}

/* ============================================================
   (C) STEP3 (Metabolismo): UX premium — mostrar Δ (GET−TMB)
   ============================================================ */
{
  const FILE = FILES.STEP3;
  let s = read(FILE);
  const before = s;

  // Import do label (para exibir bonito) — sem duplicar
  if (!/mfActivityWeeklyLabel/.test(s)) {
    // tenta inserir em imports existentes
    const anchor = s.match(/(^import[\s\S]*?\n)\n/m);
    if (anchor) {
      s = s.replace(anchor[0], anchor[0] + `import { mfActivityWeeklyLabel } from "@/types";\n`);
    } else {
      s = `import { mfActivityWeeklyLabel } from "@/types";\n` + s;
    }
  }

  // Inserir bloco de UI com Δ real: delta = GET - TMB
  // Procurar onde GET e TMB já aparecem. Se encontrar "GET" ou "TMB", injeta um card/linha abaixo.
  if (!s.includes("MF_BLOCO5C_DELTA_GET_TMB")) {
    // Heurística: após primeira ocorrência de "GET" no JSX de resultados
    const jsxAnchor = s.indexOf("GET");
    if (jsxAnchor !== -1) {
      // tenta inserir perto do return principal: de forma segura, injeta uma constante calculada dentro do componente (não em JSX!)
      // Inserir após obter resultado/metabolismo no componente (busca "const resultado" ou "const metabolismo")
      const insertAfter = s.match(/const\s+(resultado|metabolismo)[\s\S]{0,120};\n/);
      if (insertAfter) {
        s = s.replace(insertAfter[0], insertAfter[0] + `
  // MF_BLOCO5C_DELTA_GET_TMB: impacto real do fator semanal
  const __tmb = Number((resultado as any)?.tmb ?? (resultado as any)?.TMB ?? (metabolismo as any)?.tmb ?? 0);
  const __get = Number((resultado as any)?.get ?? (resultado as any)?.GET ?? (metabolismo as any)?.get ?? 0);
  const __delta = (isFinite(__get) && isFinite(__tmb)) ? Math.max(0, Math.round(__get - __tmb)) : 0;

  const __weeklyRaw =
    (resultado as any)?.nivelAtividadeSemanal ??
    (metabolismo as any)?.nivelAtividadeSemanal ??
    (state as any)?.perfil?.nivelAtividadeSemanal ??
    "—";
  const __weeklyLabel = mfActivityWeeklyLabel(__weeklyRaw);
`);
      }

      // Inserir bloco visual (texto) dentro do JSX onde já mostra resultados — tentamos ancorar em um trecho "Metabolismo" ou "GET"
      // Se não achar, não injeta JSX para não quebrar.
      const block = `
        {/* MF_BLOCO5C_DELTA_GET_TMB */}
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-300">
              <span className="font-semibold text-white">Atividade semanal</span>: {__weeklyLabel}
            </div>
            <div className="text-xs text-gray-300">
              <span className="font-semibold text-white">Impacto (Δ GET − TMB)</span>: {__delta} kcal/dia
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-gray-400">
            Esse delta representa o efeito do seu fator de atividade semanal sobre o gasto energético total (GET).
            Não é “chute”: é a diferença matemática entre GET e TMB no seu cálculo atual.
          </p>
        </div>
`;

      // Tenta inserir após um bloco que contenha "GET" no JSX (primeira ocorrência de "</" após GET)
      const idx = s.indexOf("GET");
      if (idx !== -1) {
        const near = s.slice(idx, idx + 2000);
        const closeTag = near.indexOf("</");
        if (closeTag !== -1) {
          const globalInsertPos = idx + closeTag;
          s = s.slice(0, globalInsertPos) + block + s.slice(globalInsertPos);
        }
      }
    }
  }

  if (s !== before) {
    write(FILE, s);
    ok("Step3Metabolismo: UX premium Δ(GET−TMB) + label atividade semanal inseridos.");
  } else {
    console.log("ℹ️ Step3: nada a fazer (já com UX 5C ou âncoras não encontradas).");
  }
}

ok("BLOCO 5C patcher aplicado com sucesso (alvos explícitos, hardening + UX).");
