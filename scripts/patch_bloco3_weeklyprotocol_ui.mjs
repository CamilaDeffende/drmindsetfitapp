import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const must = (cond, msg) => { if (!cond) { console.error("❌", msg); process.exit(1); } };
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const write = (p, s) => fs.writeFileSync(path.join(ROOT, p), s, "utf8");

const step3 = "src/components/steps/Step3Metabolismo.tsx";
must(fs.existsSync(path.join(ROOT, step3)), `Arquivo alvo ausente: ${step3}`);

let s = read(step3);
const before = s;

// 1) garantir import do WeeklyProtocolActive (já existe e compila no app)
if (!s.includes('from "@/components/treino/WeeklyProtocolActive"')) {
  // tenta inserir após imports existentes
  s = s.replace(
    /(import[\s\S]*?\n)\n/s,
    `$1import { WeeklyProtocolActive } from "@/components/treino/WeeklyProtocolActive";\n\n`
  );
}

// 2) injetar seção premium no Step3 (sem mexer em lógica de cálculo)
const marker = "/* MF_BLOCO3_WEEKLY_PROTOCOL_PREVIEW */";
if (!s.includes(marker)) {
  // tenta ancorar após o primeiro CardDescription introdutório (padrão do seu Step3)
  const anchor = /<CardDescription[^>]*>[\s\S]*?<\/CardDescription>/m;
  must(anchor.test(s), "Step3Metabolismo: não achei um <CardDescription> para ancorar a UI do BLOCO 3.");

  s = s.replace(anchor, (m) => {
    return `${m}

          ${marker}
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-gray-400">Seu protocolo semanal</div>
                <div className="text-base sm:text-lg font-semibold text-white">Semana completa • por modalidade • sem mistura</div>
              </div>
              <div className="text-[11px] text-gray-400 text-right">
                Visual premium • leitura rápida
              </div>
            </div>

            <div className="mt-3">
              {/* Reusa o componente já existente no app (PlanosAtivos) */}
              <WeeklyProtocolActive />
            </div>

            <div className="mt-3 text-xs text-gray-400">
              Dica: cada dia respeita a modalidade escolhida. Musculação mostra grupamentos; corrida/bike/crossfit/funcional mostram sessão completa.
            </div>
          </div>
  `;
  });
}

// sanity: import + marker + component render
must(s.includes('WeeklyProtocolActive'), "BLOCO 3: WeeklyProtocolActive não foi referenciado no Step3.");
must(s.includes("MF_BLOCO3_WEEKLY_PROTOCOL_PREVIEW"), "BLOCO 3: marker não inserido no Step3.");

if (s !== before) {
  write(step3, s);
  console.log("✅ Patched:", step3);
} else {
  console.log("ℹ️ Nenhuma alteração necessária:", step3);
}

console.log("🎯 BLOCO 3: UI premium adicionada no Step3Metabolismo (prévia do protocolo semanal).");
