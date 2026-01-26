import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const must = (c, m) => { if (!c) { console.error("❌", m); process.exit(1); } };
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const write = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");

const files = {
  step4: "src/components/steps/Step4Nutricao.tsx",
  dieta: "src/utils/geradorDieta.ts",
};

for (const k of Object.keys(files)) {
  const p = files[k];
  must(fs.existsSync(path.join(ROOT, p)), `Arquivo alvo ausente: ${p}`);
}

// -------------------- (A) geradorDieta: guardrails + consistência --------------------
{
  let s = read(files.dieta);
  const before = s;

  // helper: clamp + kcalFromMacros
  if (!s.includes("MF_BLOCO4_GUARDRAILS")) {
    s = `// MF_BLOCO4_GUARDRAILS: consistência kcal/macros + guardrails de aderência\n` + s;
  }

  if (!s.includes("function mfClamp(")) {
    s = s.replace(
      /(export\s+function\s+gerarDieta[\s\S]*?\{)/m,
      `$1\n\nfunction mfClamp(n: number, min: number, max: number){ return Math.max(min, Math.min(max, n)); }\nfunction mfKcalFromMacros(p: number, c: number, g: number){ return p*4 + c*4 + g*9; }\n`
    );
  }

  // inserir guardrails após calcular macros (local: logo após carboidratos)
  // padrão atual: calcula proteina, gorduras, caloriasRestantes, carboidratos
  // Vamos forçar:
  // - gordura mínima: 0.6g/kg (safe)
  // - proteína mínima: 1.6g/kg (safe)
  // - proteína máxima: 2.6g/kg (evitar extremos para a maioria)
  // - gordura máxima: 1.2g/kg (evitar “keto acidental”)
  // - recalcular carbo para bater kcal
  if (!s.includes("MF_BLOCO4_APPLIED")) {
    s = s.replace(
      /(const\s+carboidratos\s*=\s*Math\.round\([\s\S]*?\);\s*)/m,
      `$1\n\n  // MF_BLOCO4_APPLIED: guardrails (aderência + segurança)\n  const pesoRef = Number((dados as any)?.peso ?? (dados as any)?.pesoKg ?? 0) || 0;\n  if (pesoRef > 0) {\n    const pMin = Math.round(pesoRef * 1.6);\n    const pMax = Math.round(pesoRef * 2.6);\n    const gMin = Math.round(pesoRef * 0.6);\n    const gMax = Math.round(pesoRef * 1.2);\n\n    // aplica limites sem quebrar seu racional original\n    proteina = mfClamp(proteina, pMin, pMax);\n    gorduras = mfClamp(gorduras, gMin, gMax);\n\n    // recalcula carbo para fechar calorias\n    const kcalFixas = proteina * 4 + gorduras * 9;\n    const kcalRest = Math.max(0, Math.round(calorias) - kcalFixas);\n    const carboFix = Math.round(kcalRest / 4);\n    // substitui carboidratos final\n    // @ts-ignore\n    carboidratos = carboFix;\n\n    // normaliza calorias (kcal do pacote final)\n    const kcalFinal = mfKcalFromMacros(proteina, carboFix, gorduras);\n    calorias = Math.round(kcalFinal);\n  }\n`
    );
  }

  // garantir retorno usa calorias já normalizadas (ele já usa Math.round(calorias))
  // sanity: presença dos markers
  must(s.includes("MF_BLOCO4_GUARDRAILS"), "geradorDieta.ts: marker BLOCO4 não inserido.");
  must(s.includes("MF_BLOCO4_APPLIED"), "geradorDieta.ts: guardrails não aplicados.");

  if (s !== before) write(files.dieta, s);
  console.log("✅ Patched:", files.dieta);
}

// -------------------- (B) Step4Nutricao: UX premium (sem alterar fluxo) --------------------
{
  let s = read(files.step4);
  const before = s;

  if (!s.includes("MF_BLOCO4_UX")) {
    // inserir bloco educativo abaixo do título principal de calorias
    // ancorar perto do trecho que mostra calorias (onde aparece "calorias por dia")
    const anchor = /<p className="text-sm sm:text-base text-muted-foreground mt-2">calorias por dia<\/p>/m;
    must(anchor.test(s), "Step4Nutricao.tsx: não achei o anchor do bloco de calorias.");

    s = s.replace(anchor, (m) => {
      return `${m}

            {/* MF_BLOCO4_UX: aderência + guardrails (premium) */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[11px] uppercase tracking-wider text-gray-400">Ajuste inteligente</div>
              <div className="mt-1 text-sm text-white/90">
                Nós fechamos suas calorias com macros consistentes e aplicamos limites de segurança para evitar extremos
                (proteína e gordura mínimas/máximas). Isso melhora aderência, energia e sustentabilidade.
              </div>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-gray-400">Se sentir fome</div>
                  <div className="text-sm text-white/90">aumente volume alimentar (saladas, legumes, sopas), água e fibra.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-gray-400">Se cair energia</div>
                  <div className="text-sm text-white/90">priorize carbo em torno do treino e sono. Ajustes são ilimitados no app.</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-[11px] text-gray-400">Se travar 10–14 dias</div>
                  <div className="text-sm text-white/90">revise passos, NEAT e consistência. Depois ajuste o déficit/superávit.</div>
                </div>
              </div>
            </div>
      `;
    });
  }

  must(s.includes("MF_BLOCO4_UX"), "Step4Nutricao.tsx: bloco UX BLOCO4 não inserido.");

  if (s !== before) write(files.step4, s);
  console.log("✅ Patched:", files.step4);
}

console.log("🎯 BLOCO 4: patches aplicados (guardrails + consistência + UX premium).");
