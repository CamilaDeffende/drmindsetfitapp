#!/usr/bin/env node
/**
 * BLOCO 6B — DietaAtivaView ultra completa (exibição) + equivalências (UI)
 * Alvos explícitos:
 * - src/components/planos/DietaAtivaView.tsx
 *
 * Regras:
 * - NÃO alterar engine (NutritionEngine) agora
 * - Exibição completa (refeições, alimentos, macros, kcal)
 * - UI de equivalências simples e segura (aprox por kcal)
 * - BUILD VERDE
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

const FILE = "src/components/planos/DietaAtivaView.tsx";
if (!fs.existsSync(FILE)) die("Não achei: " + FILE);

backup(FILE);
let s = read(FILE);
const before = s;

// 1) garantir imports básicos usados na UI
function ensureNamedImport(from, names){
  const esc = from.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re = new RegExp(`import\\s*\\{([\\s\\S]*?)\\}\\s*from\\s*['"]${esc}['"]`);
  const m = s.match(re);
  if (m){
    const inside = m[1];
    const current = inside.split(",").map(x=>x.trim()).filter(Boolean);
    const need = names.filter(n => !current.includes(n));
    if (!need.length) return;
    const rebuilt = `import { ${[...current, ...need].join(", ")} } from '${from}'`;
    s = s.replace(m[0], rebuilt);
    return;
  }
  // se não existir import desse módulo, adiciona no topo (depois de primeiros imports)
  const firstImportEnd = (() => {
    const mm = s.match(/^(import[\s\S]*?\n)(?!import)/m);
    return mm ? mm[0].length : 0;
  })();
  const ins = `import { ${names.join(", ")} } from '${from}';\n`;
  s = s.slice(0, firstImportEnd) + ins + s.slice(firstImportEnd);
}

ensureNamedImport("@/components/ui/button", ["Button"]);
ensureNamedImport("@/components/ui/card", ["Card", "CardContent", "CardHeader", "CardTitle"]);
ensureNamedImport("react-router-dom", ["useNavigate"]);
ensureNamedImport("react", ["useMemo", "useState"]);

// 2) garantir navigate hook dentro do componente
if (!/const\s+navigate\s*=\s*useNavigate\(\)/.test(s)){
  // tenta inserir após início da função do componente
  const fnRe = /(export\s+function\s+\w+\s*\([\s\S]*?\)\s*\{\s*)/m;
  const m = s.match(fnRe);
  if (!m) die("Não achei assinatura do componente em DietaAtivaView.tsx");
  s = s.replace(fnRe, `$1\n  const navigate = useNavigate();\n`);
}

// 3) helpers: somatórios robustos (kcal/macros), equivalências simples por categoria
if (!/function\s+mfSumMeal/.test(s)){
  const helpers = `
function mfNum(x: unknown, fallback = 0): number {
  const n = typeof x === "number" ? x : Number(x);
  return Number.isFinite(n) ? n : fallback;
}
function mfRound(n: unknown): number {
  return Math.round(mfNum(n, 0));
}
function mfSumMeal(refeicao: any) {
  const foods = Array.isArray(refeicao?.alimentos) ? refeicao.alimentos : [];
  let kcal = 0, p = 0, c = 0, g = 0;
  for (const a of foods){
    kcal += mfNum(a?.calorias, 0);
    p += mfNum(a?.proteinas, 0);
    c += mfNum(a?.carboidratos, 0);
    g += mfNum(a?.gorduras, 0);
  }
  return { kcal, p, c, g };
}
function mfSumDay(refeicoes: any[]) {
  let kcal = 0, p = 0, c = 0, g = 0;
  for (const r of refeicoes){ const m = mfSumMeal(r); kcal += m.kcal; p += m.p; c += m.c; g += m.g; }
  return { kcal, p, c, g };
}

/**
 * Equivalências (MVP):
 * - baseadas em kcal aproximada por 100g (ou porção comum).
 * - objetivo: sugestões rápidas; edição real acontece na tela /nutrition (ou EditDiet).
 */
const MF_EQ: Record<string, { label: string; kcal100: number; unit: string; note?: string }[]> = {
  proteina: [
    { label: "Peito de frango", kcal100: 165, unit: "g" },
    { label: "Patinho moído", kcal100: 170, unit: "g" },
    { label: "Ovos (inteiro)", kcal100: 143, unit: "g", note: "≈ 2 ovos = 100g" },
    { label: "Atum em água", kcal100: 116, unit: "g" },
    { label: "Iogurte grego zero", kcal100: 60, unit: "g" },
  ],
  carbo: [
    { label: "Arroz branco cozido", kcal100: 130, unit: "g" },
    { label: "Batata inglesa cozida", kcal100: 87, unit: "g" },
    { label: "Aveia", kcal100: 389, unit: "g" },
    { label: "Pão integral", kcal100: 250, unit: "g" },
    { label: "Banana", kcal100: 89, unit: "g" },
  ],
  gordura: [
    { label: "Azeite de oliva", kcal100: 884, unit: "g", note: "≈ 1 colher sopa = 10g" },
    { label: "Pasta de amendoim", kcal100: 588, unit: "g" },
    { label: "Castanhas", kcal100: 600, unit: "g" },
    { label: "Abacate", kcal100: 160, unit: "g" },
  ],
  vegetal: [
    { label: "Brócolis", kcal100: 34, unit: "g" },
    { label: "Salada (folhas)", kcal100: 15, unit: "g" },
    { label: "Cenoura", kcal100: 41, unit: "g" },
  ],
};

function mfGuessCat(foodName: string): keyof typeof MF_EQ {
  const n = (foodName || "").toLowerCase();
  if (/(frango|carne|atum|ovo|whey|iogurte|queijo|peixe)/.test(n)) return "proteina";
  if (/(arroz|batata|aveia|pao|banana|macarrao|mandioca|tapioca)/.test(n)) return "carbo";
  if (/(azeite|castanha|amendoim|abacate|manteiga)/.test(n)) return "gordura";
  if (/(salada|brocolis|cenoura|legume|vegetal)/.test(n)) return "vegetal";
  return "carbo";
}

function mfEqPortion(kcalTarget: number, kcal100: number) {
  if (!Number.isFinite(kcalTarget) || kcalTarget <= 0) return 0;
  if (!Number.isFinite(kcal100) || kcal100 <= 0) return 0;
  return (kcalTarget / kcal100) * 100;
}
`;
  // inserir helpers após imports
  const pos = s.indexOf("\n\n");
  s = s.slice(0,pos+2) + helpers.trim() + "\n\n" + s.slice(pos+2);
}

// 4) Inserir UI premium (se já tiver, não duplica)
if (s.includes("MF_BLOCO6B_DIETA_UI")) {
  console.log("ℹ️ BLOCO 6B: UI já parece aplicada. Nada a fazer.");
} else {
  // Encontrar retorno principal e envolver com cards/resumos
  const retRe = /return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*$/m;
  const m = s.match(retRe);
  if (!m) die("Não achei return(...) para substituir com UI completa.");

  const newReturn = `
  // MF_BLOCO6B_DIETA_UI: exibição completa + equivalências (UI)
  const refeicoes = Array.isArray((dietaAtiva as any)?.nutricao?.refeicoes) ? (dietaAtiva as any).nutricao.refeicoes : [];
  const day = useMemo(() => mfSumDay(refeicoes), [refeicoes]);

  // metas (quando existirem)
  const alvoKcal = mfNum((dietaAtiva as any)?.nutricao?.caloriasAlvo ?? (dietaAtiva as any)?.nutricao?.kcalAlvo ?? (dietaAtiva as any)?.caloriasAlvo, 0);
  const alvoP = mfNum((dietaAtiva as any)?.nutricao?.macros?.proteinas ?? (dietaAtiva as any)?.nutricao?.proteinasAlvo, 0);
  const alvoC = mfNum((dietaAtiva as any)?.nutricao?.macros?.carboidratos ?? (dietaAtiva as any)?.nutricao?.carboidratosAlvo, 0);
  const alvoG = mfNum((dietaAtiva as any)?.nutricao?.macros?.gorduras ?? (dietaAtiva as any)?.nutricao?.gordurasAlvo, 0);

  const [eqOpen, setEqOpen] = useState<{ foodName: string; kcal: number } | null>(null);

  const goEdit = () => {
    // Preferência: se existir EditDiet no app via navegação interna, mantém /nutrition como fonte única de edição
    navigate("/nutrition");
  };

  return (
    <div className="space-y-4">
      <Card className="glass-effect neon-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Dieta ativa</CardTitle>
              <div className="text-xs text-gray-400 mt-1">
                {(dietaAtiva as any)?.estrategia ? String((dietaAtiva as any).estrategia) : "Plano personalizado"}
              </div>
            </div>
            <Button onClick={goEdit} className="h-10 px-4 font-semibold glow-blue">
              Editar Nutrição
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-black/30 border border-white/10">
              <div className="text-xs text-gray-400">Calorias (dia)</div>
              <div className="text-xl font-semibold text-white">
                {mfRound(day.kcal)} <span className="text-sm text-gray-400">kcal</span>
              </div>
              {alvoKcal > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  Alvo: <span className="text-white/90">{mfRound(alvoKcal)} kcal</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-white/10">
              <div className="text-xs text-gray-400">Macros (dia)</div>
              <div className="text-sm text-white mt-1">
                P <span className="font-semibold">{mfRound(day.p)}g</span>{" "}
                · C <span className="font-semibold">{mfRound(day.c)}g</span>{" "}
                · G <span className="font-semibold">{mfRound(day.g)}g</span>
              </div>
              {(alvoP+alvoC+alvoG) > 0 && (
                <div className="text-xs text-gray-400 mt-1">
                  Alvo: P <span className="text-white/90">{mfRound(alvoP)}g</span> · C{" "}
                  <span className="text-white/90">{mfRound(alvoC)}g</span> · G{" "}
                  <span className="text-white/90">{mfRound(alvoG)}g</span>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-black/30 border border-white/10">
              <div className="text-xs text-gray-400">Consistência</div>
              <div className="text-sm text-white mt-1">
                {alvoKcal > 0 ? (
                  <span>
                    Diferença:{" "}
                    <span className="font-semibold">
                      {mfRound(day.kcal - alvoKcal)} kcal
                    </span>
                  </span>
                ) : (
                  <span className="text-gray-400">Alvo não definido no plano.</span>
                )}
              </div>
              <div className="text-[11px] text-gray-500 mt-2">
                Mantemos calorias como referência principal. Substituições são aproximações e podem variar em macros.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Refeições</div>
              <div className="text-xs text-gray-400">{refeicoes.length} no dia</div>
            </div>

            {refeicoes.length === 0 ? (
              <div className="text-sm text-gray-400">
                Nenhuma refeição encontrada no plano ativo.
              </div>
            ) : (
              <div className="space-y-3">
                {refeicoes.map((r: any, idx: number) => {
                  const m = mfSumMeal(r);
                  const title = r?.nome ?? r?.title ?? r?.label ?? \`Refeição \${idx + 1}\`;
                  const foods = Array.isArray(r?.alimentos) ? r.alimentos : [];
                  return (
                    <Card key={idx} className="bg-black/30 border border-white/10">
                      <CardHeader className="py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-base font-semibold text-white">{String(title)}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {mfRound(m.kcal)} kcal · P {mfRound(m.p)}g · C {mfRound(m.c)}g · G {mfRound(m.g)}g
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="h-9 px-3 border-white/15 bg-black/40"
                            onClick={goEdit}
                          >
                            Ajustar
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="pb-4 space-y-2">
                        {foods.length === 0 ? (
                          <div className="text-sm text-gray-400">Sem alimentos cadastrados.</div>
                        ) : (
                          <div className="space-y-2">
                            {foods.map((a: any, aIdx: number) => {
                              const name = a?.nome ?? a?.name ?? a?.alimento ?? \`Alimento \${aIdx+1}\`;
                              const kcal = mfNum(a?.calorias, 0);
                              const qty = a?.quantidade ?? a?.qty ?? a?.porcao ?? "";
                              const unit = a?.unidade ?? a?.unit ?? "";
                              return (
                                <div
                                  key={aIdx}
                                  className="p-3 rounded-xl bg-black/20 border border-white/10 flex items-start justify-between gap-3"
                                >
                                  <div className="min-w-0">
                                    <div className="text-sm font-semibold text-white truncate">{String(name)}</div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      {qty ? <span>{String(qty)} {unit ? String(unit) : ""} · </span> : null}
                                      {mfRound(kcal)} kcal
                                      {typeof a?.proteinas !== "undefined" || typeof a?.carboidratos !== "undefined" || typeof a?.gorduras !== "undefined" ? (
                                        <span>
                                          {" "}· P {mfRound(a?.proteinas)}g · C {mfRound(a?.carboidratos)}g · G {mfRound(a?.gorduras)}g
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>

                                  <Button
                                    variant="outline"
                                    className="h-9 px-3 border-white/15 bg-black/40 shrink-0"
                                    onClick={() => setEqOpen({ foodName: String(name), kcal })}
                                    disabled={!(kcal > 0)}
                                    title={kcal > 0 ? "Ver equivalências" : "Sem kcal para equivalência"}
                                  >
                                    Equivalências
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {eqOpen && (
            <div className="p-4 rounded-2xl bg-black/60 border border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">Equivalências por kcal</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Base: <span className="text-white/90">{eqOpen.foodName}</span> ·{" "}
                    <span className="text-white/90">{mfRound(eqOpen.kcal)} kcal</span>
                  </div>
                </div>
                <Button variant="ghost" className="h-9" onClick={() => setEqOpen(null)}>
                  Fechar
                </Button>
              </div>

              {(() => {
                const cat = mfGuessCat(eqOpen.foodName);
                const opts = MF_EQ[cat] || [];
                return (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {opts.map((o, i) => {
                      const portion = mfEqPortion(eqOpen.kcal, o.kcal100);
                      return (
                        <div key={i} className="p-3 rounded-xl bg-black/30 border border-white/10">
                          <div className="text-sm font-semibold text-white">{o.label}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Porção equivalente:{" "}
                            <span className="text-white/90">{mfRound(portion)} {o.unit}</span>
                            {" "}· referência {o.kcal100} kcal/100{o.unit}
                          </div>
                          {o.note ? <div className="text-[11px] text-gray-500 mt-1">{o.note}</div> : null}
                          <div className="text-[11px] text-gray-500 mt-2">
                            Ajuste final e macros detalhados ficam na tela de edição.
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
`;

  // Substituir o return atual pelo novoReturn
  s = s.replace(retRe, newReturn.trim() + "\n");
}

// sanity mínima
if (!s.includes("MF_BLOCO6B_DIETA_UI")) die("Sanity: marcador MF_BLOCO6B_DIETA_UI não encontrado após patch.");
if (s === before) die("Nenhuma alteração aplicada (inesperado).");

write(FILE, s);
console.log("✅ BLOCO 6B aplicado em:", FILE);
