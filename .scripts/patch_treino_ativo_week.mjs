import fs from "fs";

const file = process.env.FILE;
if (!file) throw new Error("FILE env missing");

let s = fs.readFileSync(file, "utf8");
const before = s;

function ensureOnce(needle, insertAfterRegex, chunk) {
  if (s.includes(needle)) return;
  const m = s.match(insertAfterRegex);
  if (!m) return;
  const idx = m.index + m[0].length;
  s = s.slice(0, idx) + "\n" + chunk + "\n" + s.slice(idx);
}

// 1) Inserir tipos locais + helpers de derivação e hardening
ensureOnce(
  "DASH_TREINO_ATIVO_DERIVE_V1",
  /export\s+function\s+TreinoAtivoView\s*\([\s\S]*?\)\s*\{/m,
  `  // DASH_TREINO_ATIVO_DERIVE_V1
  type __Ex = {
    nome?: string;
    series?: number;
    reps?: string | number;
    repeticoes?: string | number;
    tempo?: string;
    descanso?: string | number;
    intensidade?: string;
    observacoes?: string;
    exercicio?: { id?: string; nome?: string };
  };
  type __Dia = {
    dia?: string;
    foco?: string;
    grupamentos?: string[];
    exercicios?: __Ex[];
    observacoes?: string;
  };
  type __Divisao = { tipo?: string; intensidade?: string };
  type __TreinoPlan = {
    estrategia?: string;
    frequencia?: number;
    divisao?: __Divisao;
    treinos?: __Dia[];
    historicoCargas?: any[];
  };

  const __safeArr = (v: any) => (Array.isArray(v) ? v : []);
  const __safeStr = (v: any, fb = "—") => (typeof v === "string" && v.trim() ? v : fb);
  const __safeNum = (v: any, fb = 0) => (typeof v === "number" && Number.isFinite(v) ? v : fb);

  // Deriva um "treino ativo" a partir do state.treino (Step 5) — evita depender de state.treinoAtivo (pode ser undefined)
  const __deriveActiveFromTreino = (treino: any) => {
    const plan: __TreinoPlan | null = treino ? (treino as __TreinoPlan) : null;
    const treinos = __safeArr(plan?.treinos);
    return {
      estrategia: __safeStr((plan as any)?.estrategia, "Treino individualizado"),
      dataInicio: (new Date()).toISOString().slice(0,10),
      dataFim: (new Date(Date.now() + 28*24*60*60*1000)).toISOString().slice(0,10),
      duracaoSemanas: 4,
      treino: {
        divisao: {
          tipo: __safeStr((plan as any)?.divisao?.tipo, treinos.length ? "Semana estruturada" : "—"),
          intensidade: __safeStr((plan as any)?.divisao?.intensidade, "—"),
        },
        frequencia: __safeNum((plan as any)?.frequencia, treinos.length || 0),
        treinos: treinos as __Dia[],
        historicoCargas: __safeArr((plan as any)?.historicoCargas),
      },
    };
  };`
);

// 2) Garantir que o componente pegue state e derive o plano (sem crash)
if (!s.includes("const __mfActive")) {
  // tenta achar a linha onde pega state (padrão do app)
  // se não achar, não quebra: só injeta após a primeira ocorrência de "const { state"
  const anchor = s.match(/const\s+\{\s*state[\s\S]*?\}\s*=\s*useDrMindSetfit\(\)\s*;?/m)
             || s.match(/const\s+\{\s*state[\s\S]*?\}\s*=\s*useDrMindSetfit\(\)\s*/m);

  if (anchor) {
    const pos = anchor.index + anchor[0].length;
    s = s.slice(0, pos) + `
  // MF_ACTIVE_PLAN_V1
  const __mfTreinoPlan = (state as any)?.treino ?? null;
  const __mfActive = __deriveActiveFromTreino(__mfTreinoPlan);
  const __mfTreinosSemana: any[] = Array.isArray(__mfActive?.treino?.treinos) ? __mfActive.treino.treinos : [];
` + s.slice(pos);
  }
}

// 3) Hardening final: qualquer ".tipo" vira safe (sem duplicar)
s = s.replace(/(\bdivisao)\.tipo\b/g, '$1?.tipo ?? "—"');
s = s.replace(/(\bperiodizacao)\.tipo\b/g, '$1?.tipo ?? "—"');

// 4) Injetar UI semanal completa, sem depender do layout existente
// A estratégia aqui: se já existe um bloco "Treino Ativo" antigo, mantém, mas adiciona o "CRONOGRAMA SEMANAL" acima.
// Procura um ponto seguro: primeira ocorrência de "return (" dentro do componente.
if (!s.includes("MF_WEEK_SCHEDULE_UI_V1")) {
  const ret = s.match(/return\s*\(\s*</m);
  if (ret) {
    const idx = ret.index;
    s = s.slice(0, idx) + `
  // MF_WEEK_SCHEDULE_UI_V1
  const __mfMeta = {
    estrategia: __safeStr((__mfActive as any)?.estrategia, "Treino individualizado"),
    divisaoTipo: __safeStr((__mfActive as any)?.treino?.divisao?.tipo, "—"),
    intensidade: __safeStr((__mfActive as any)?.treino?.divisao?.intensidade, "—"),
    frequencia: __safeNum((__mfActive as any)?.treino?.frequencia, __mfTreinosSemana.length || 0),
    semanas: __safeNum((__mfActive as any)?.duracaoSemanas, 4),
  };
` + s.slice(idx);
  }
}

// 5) Trocar qualquer acesso perigoso state.treinoAtivo por __mfActive (evita crash lendo undefined)
s = s
  .replace(/state\.treinoAtivo\b/g, "__mfActive")
  .replace(/\(state\s+as\s+any\)\.treinoAtivo\b/g, "__mfActive");

// 6) Se tiver render lendo "treinoAtivo.treino.divisao.tipo" etc, deixa seguro com optional chaining
s = s.replace(/__mfActive\.treino\.divisao\.tipo\b/g, '__mfActive?.treino?.divisao?.tipo ?? "—"');
s = s.replace(/__mfActive\.treino\.divisao\.intensidade\b/g, '__mfActive?.treino?.divisao?.intensidade ?? "—"');

// 7) Inserir um bloco JSX de cronograma semanal (padrão premium) em um local provável:
// - tenta inserir logo após um header/topo se achar "Treino Ativo" title
if (!s.includes("MF_WEEK_BLOCK_RENDER_V1")) {
  const spot = s.match(/<CardHeader[\s\S]*?<\/CardHeader>/m);
  if (spot) {
    const at = spot.index + spot[0].length;
    s = s.slice(0, at) + `
          {/* MF_WEEK_BLOCK_RENDER_V1 */}
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-gray-400">Estratégia</div>
                  <div className="text-sm font-semibold text-white/90">{__mfMeta.estrategia}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Frequência</div>
                  <div className="text-sm font-semibold text-white/90">{__mfMeta.frequencia}x/sem • {__mfMeta.semanas} semanas</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-gray-400">Divisão</div>
                  <div className="text-sm font-semibold">{__mfMeta.divisaoTipo}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <div className="text-xs text-gray-400">Intensidade</div>
                  <div className="text-sm font-semibold">{__mfMeta.intensidade}</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-400">Cronograma semanal</div>
                  <div className="text-lg font-semibold">Sua semana completa</div>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {__mfTreinosSemana.length ? (
                  __mfTreinosSemana.map((dia: any, idx: number) => {
                    const exs = Array.isArray(dia?.exercicios) ? dia.exercicios : [];
                    return (
                      <div key={idx} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold">{dia?.dia ?? \`Dia \${idx + 1}\`}</div>
                            {dia?.foco ? <div className="text-xs text-gray-400 mt-1">{dia.foco}</div> : null}
                            {Array.isArray(dia?.grupamentos) && dia.grupamentos.length ? (
                              <div className="text-xs text-gray-500 mt-1">{dia.grupamentos.join(" • ")}</div>
                            ) : null}
                          </div>
                          <div className="text-xs text-gray-400">{exs.length} exercícios</div>
                        </div>

                        <div className="mt-3 space-y-2">
                          {exs.length ? (
                            exs.map((ex: any, eIdx: number) => {
                              const nome = ex?.nome ?? ex?.exercicio?.nome ?? \`Exercício \${eIdx + 1}\`;
                              const series = ex?.series ?? 0;
                              const reps = ex?.reps ?? ex?.repeticoes ?? "";
                              const tempo = ex?.tempo ?? "";
                              const desc = ex?.descanso ?? "";
                              const intensidade = ex?.intensidade ?? "";
                              return (
                                <div key={eIdx} className="rounded-xl border border-white/10 bg-black/20 p-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="text-sm font-medium text-white/90">{nome}</div>
                                    <div className="text-xs text-gray-400">
                                      {series ? \`\${series} séries\` : ""}{reps ? \` • \${reps} reps\` : ""}{tempo ? \` • \${tempo}\` : ""}
                                    </div>
                                  </div>
                                  <div className="mt-1 text-xs text-gray-400">
                                    {desc ? <>Descanso: <span className="text-white/80">{String(desc)}</span></> : null}
                                    {intensidade ? <> {desc ? " • " : ""}<span className="text-white/80">{String(intensidade)}</span></> : null}
                                  </div>
                                  {ex?.observacoes ? <div className="mt-2 text-xs text-gray-500 italic">{String(ex.observacoes)}</div> : null}
                                </div>
                              );
                            })
                          ) : (
                            <div className="text-xs text-gray-400">Nenhum exercício encontrado para este dia.</div>
                          )}
                        </div>

                        {dia?.observacoes ? <div className="mt-3 text-xs text-gray-500 italic">{String(dia.observacoes)}</div> : null}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-gray-400">Nenhum treino encontrado. Gere seu treino na etapa de Treino (Step 5).</div>
                )}
              </div>
            </div>
          </div>
` + s.slice(at);
  }
}

// 8) Se nada mudou, avisa
if (s === before) {
  console.log("ℹ️ Nenhuma alteração aplicada (talvez já esteja com week UI/derivação).");
} else {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Patch aplicado em TreinoAtivoView: derivação + UI semanal + hardening.");
}
