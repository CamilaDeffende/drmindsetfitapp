#!/usr/bin/env node
/**
 * BLOCO 6B FIX1 — aplicar UI completa NO COMPONENTE (evitar rules-of-hooks)
 * Alvo: src/components/planos/DietaAtivaView.tsx
 * Estratégia: localizar o corpo do componente (brace matching) e substituir somente o return dele.
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

// remove qualquer resíduo de marcador antigo (se houver no HEAD — raro)
s = s.replace(/\/\/\s*MF_BLOCO6B_DIETA_UI[\s\S]*?\n\}\s*$/m, (m)=>m); // noop seguro

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
  // adiciona import após o último import do topo
  const all = [...s.matchAll(/^import[\s\S]*?;\s*$/gm)];
  const idx = all.length ? (all[all.length-1].index + all[all.length-1][0].length) : 0;
  const ins = `\nimport { ${names.join(", ")} } from '${from}';\n`;
  s = s.slice(0, idx) + ins + s.slice(idx);
}

ensureNamedImport("@/components/ui/button", ["Button"]);
ensureNamedImport("@/components/ui/card", ["Card", "CardContent", "CardHeader", "CardTitle"]);
ensureNamedImport("react-router-dom", ["useNavigate"]);
ensureNamedImport("react", ["useMemo", "useState"]);

// helpers fora do componente (idempotente)
if (!/function\s+mfSumMeal\(/.test(s)){
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
`.trim() + "\n\n";

  // inserir helpers após o bloco de imports
  const imports = [...s.matchAll(/^import[\s\S]*?;\s*$/gm)];
  const end = imports.length ? (imports[imports.length-1].index + imports[imports.length-1][0].length) : 0;
  s = s.slice(0, end) + "\n\n" + helpers + s.slice(end);
}

// localizar componente DietaAtivaView (function ou const)
const startIdx =
  s.search(/export\s+function\s+DietaAtivaView\s*\(/) >= 0
    ? s.search(/export\s+function\s+DietaAtivaView\s*\(/)
    : s.search(/export\s+const\s+DietaAtivaView\s*=/);

if (startIdx < 0) die("Não achei o componente DietaAtivaView (export function/const).");

// achar a primeira "{"
const braceOpen = s.indexOf("{", startIdx);
if (braceOpen < 0) die("Não achei '{' do componente.");

// brace matching até fechar o componente
let i = braceOpen, depth = 0, endIdx = -1;
for (; i < s.length; i++){
  const ch = s[i];
  if (ch === "{") depth++;
  else if (ch === "}") {
    depth--;
    if (depth === 0) { endIdx = i; break; }
  }
}
if (endIdx < 0) die("Não consegui fechar o bloco do componente (brace matching falhou).");

const comp = s.slice(startIdx, endIdx+1);

// garantir navigate dentro do componente
let comp2 = comp;
if (!/const\s+navigate\s*=\s*useNavigate\(\)/.test(comp2)) {
  comp2 = comp2.replace(/\{\s*\n/, "{\n  const navigate = useNavigate();\n");
}

// substituir SOMENTE o return do componente
const retPos = comp2.search(/return\s*\(/);
if (retPos < 0) die("Não achei return( dentro do componente.");

comp2 = comp2.replace(/return\s*\([\s\S]*?\);\s*$/m, `
  // MF_BLOCO6B_DIETA_UI: exibição completa + equivalências (UI)
  const refeicoes = Array.isArray((dietaAtiva as any)?.nutricao?.refeicoes) ? (dietaAtiva as any).nutricao.refeicoes : [];
  const day = useMemo(() => mfSumDay(refeicoes), [refeicoes]);

  const alvoKcal = mfNum((dietaAtiva as any)?.nutricao?.caloriasAlvo ?? (dietaAtiva as any)?.nutricao?.kcalAlvo ?? (dietaAtiva as any)?.caloriasAlvo, 0);
  const alvoP = mfNum((dietaAtiva as any)?.nutricao?.macros?.proteinas ?? (dietaAtiva as any)?.nutricao?.proteinasAlvo, 0);
  const alvoC = mfNum((dietaAtiva as any)?.nutricao?.macros?.carboidratos ?? (dietaAtiva as any)?.nutricao?.carboidratosAlvo, 0);
  const alvoG = mfNum((dietaAtiva as any)?.nutricao?.macros?.gorduras ?? (dietaAtiva as any)?.nutricao?.gordurasAlvo, 0);

  const [eqOpen, setEqOpen] = useState<{ foodName: string; kcal: number } | null>(null);

  const goEdit = () => navigate("/nutrition");

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
                Substituições são aproximações (kcal). Macros podem variar conforme o alimento.
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Refeições</div>
              <div className="text-xs text-gray-400">{refeicoes.length} no dia</div>
            </div>

            {refeicoes.length === 0 ? (
              <div className="text-sm text-gray-400">Nenhuma refeição encontrada no plano ativo.</div>
            ) : (
              <div className="space-y-3">
                {refeicoes.map((r: any, idx: number) => {
                  const m = mfSumMeal(r);
                  const title = r?.nome ?? r?.title ?? r?.label ?? `Refeição ${idx + 1}`;
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
                              const name = a?.nome ?? a?.name ?? a?.alimento ?? `Alimento ${aIdx+1}`;
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
                            {" "}· ref {o.kcal100} kcal/100{o.unit}
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
`.trim());

s = s.slice(0, startIdx) + comp2 + s.slice(endIdx+1);

// sanity: hooks não podem ficar fora do componente
if (/function\s+mfEqPortion[\s\S]*useMemo/.test(s)) die("Sanity: hooks caíram dentro de mfEqPortion (não pode).");
if (!s.includes("MF_BLOCO6B_DIETA_UI")) die("Sanity: marcador MF_BLOCO6B_DIETA_UI não encontrado.");

if (s === before) die("Nenhuma alteração aplicada (inesperado).");
write(FILE, s);
console.log("✅ FIX1 aplicado em:", FILE);
