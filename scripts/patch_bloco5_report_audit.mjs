import fs from "fs";

function must(cond, msg){ if(!cond){ console.error("❌", msg); process.exit(1); } }
function read(p){ return fs.readFileSync(p,"utf8"); }
function write(p,s){ fs.writeFileSync(p,s,"utf8"); }

const file = "src/pages/Report.tsx";
must(fs.existsSync(file), "Report.tsx não encontrado.");

let s = read(file);
const before = s;

const MARK = "MF_BLOCO5_REPORT_AUDIT";

if (!s.includes(MARK)) {
  // (1) inserir bloco UI premium perto da seção de Nutrição (sem depender de ids exatos)
  // vamos inserir antes do heading "Plano Nutricional" se existir; senão, perto do topo do return.
  const anchor = /Plano\s+Nutricional/i.test(s) ? /Plano\s+Nutricional[\s\S]{0,60}/m : null;

  const auditBlock = `
            {/* ${MARK}: Auditoria Premium (Metabolismo + Nutrição) */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold">Auditoria Premium</div>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-muted-foreground">Metabolismo</div>
                  <div className="mt-2 text-sm space-y-1">
                    <div><span className="text-muted-foreground">TMB:</span> <span className="font-semibold">{(metabolismo as any)?.tmb ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">FAF base:</span> <span className="font-semibold">{(metabolismo as any)?.fafBase ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Frequência semanal:</span> <span className="font-semibold">{(metabolismo as any)?.frequenciaSemanal ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Multiplicador:</span> <span className="font-semibold">{(metabolismo as any)?.fafMultiplicador ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">FAF final:</span> <span className="font-semibold">{(metabolismo as any)?.fafFinal ?? (metabolismo as any)?.faf ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">GET:</span> <span className="font-semibold">{(metabolismo as any)?.get ?? (metabolismo as any)?.caloriasManutencao ?? "—"}</span></div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-muted-foreground">Nutrição</div>
                  <div className="mt-2 text-sm space-y-1">
                    <div><span className="text-muted-foreground">Calorias (final):</span> <span className="font-semibold">{(dietaAtiva as any)?.calorias ?? (dietaAtiva as any)?.kcal ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Proteína:</span> <span className="font-semibold">{(dietaAtiva as any)?.proteina ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Carboidratos:</span> <span className="font-semibold">{(dietaAtiva as any)?.carboidratos ?? "—"}</span></div>
                    <div><span className="text-muted-foreground">Gorduras:</span> <span className="font-semibold">{(dietaAtiva as any)?.gorduras ?? "—"}</span></div>
                    <div className="pt-1 text-xs text-muted-foreground">
                      Nota: macros são recalculados para coerência kcal↔macros (diferenças por arredondamento são normalizadas).
                    </div>
                  </div>
                </div>
              </div>
            </div>
`;

  if (anchor) {
    // insere logo antes do primeiro heading de "Plano Nutricional"
    s = s.replace(/(\{\/\*\s*Plano\s+Nutricional[\s\S]*?\*\/\})/m, auditBlock + "\n$1");
    // se não achou comentário, tenta inserir antes de "Plano Nutricional -" string
    if (!s.includes(MARK)) {
      s = s.replace(/(\bPlano\s+Nutricional\b)/m, auditBlock + "\n$1");
    }
  } else {
    // fallback: inserir após o começo do return (primeiro <div className=... do container)
    s = s.replace(/return\s*\(\s*<div[^>]*>/m, (m) => m + "\n" + auditBlock);
  }

  must(s.includes(MARK), "BLOCO 5: não conseguiu inserir Auditoria Premium no Report.");
}

// sanity: garantir que as variáveis base existam no arquivo (não garante em runtime, mas evita patch em arquivo errado)
must(/metabolismo/.test(s), "BLOCO 5: Report.tsx não parece ter 'metabolismo'.");
must(/dietaAtiva/.test(s), "BLOCO 5: Report.tsx não parece ter 'dietaAtiva'.");

if (s !== before) {
  write(file, s);
  console.log("✅ Patched:", file);
} else {
  console.log("ℹ️ Nenhuma alteração necessária:", file);
}
