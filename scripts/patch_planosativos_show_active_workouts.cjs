/* eslint-disable */
const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "src/pages/PlanosAtivos.tsx");
let s = fs.readFileSync(file, "utf8");

// 1) garantir que temos acesso ao state (geralmente já existe).
if (!s.includes("useDrMindSetfit")) {
  console.error("PATCH_FAIL: PlanosAtivos.tsx não parece usar DrMindSetfitContext. Abra o arquivo e confirme o hook/context usado.");
  process.exit(1);
}

// 2) injetar selector do treinoPlan (state.treino || fallback workoutProtocolWeekly.treinoPlan)
if (!s.includes("const treinoPlan =")) {
  // tentar inserir logo após a linha que pega state do context
  // Ex: const { state, ... } = useDrMindSetfit()
  const m = s.match(/const\s*\{\s*([^}]*)\s*\}\s*=\s*useDrMindSetfit\(\s*\)\s*;?/);
  if (!m) {
    console.error("PATCH_FAIL: não achei destructuring do useDrMindSetfit().");
    process.exit(1);
  }
  const insertAfter = m[0];
  const injected = [
    insertAfter,
    "\n\n  // Fonte da verdade do treino ativo (gerado no Step5)\n",
    "  const treinoPlan = (state as any)?.treino ?? (state as any)?.workoutProtocolWeekly?.treinoPlan ?? null;\n",
  ].join("");
  s = s.replace(insertAfter, injected);
}

// 3) injetar UI dentro da aba treino.
// Procurar TabsContent value=\"treino\" (ou value='treino')
let replaced = false;

const patterns = [
  /<TabsContent\s+value=["']treino["'][^>]*>/m,
  /<TabsContent\s+value=["']treinos["'][^>]*>/m,
];

for (const pat of patterns) {
  const mm = s.match(pat);
  if (!mm) continue;

  const openTag = mm[0];
  if (s.includes("data-testid=\"active-workout-protocol\"")) {
    replaced = true;
    break; // já patchado
  }

  const block = [
    "\n",
    "        {/* Protocolo Inteligente (Active Workouts) */}\n",
    "        <div data-testid=\"active-workout-protocol\" className=\"mt-4 space-y-3\">\n",
    "          {!treinoPlan ? (\n",
    "            <div className=\"rounded-xl border border-border/50 p-4 text-sm text-muted-foreground\">\n",
    "              Nenhum treino ativo gerado ainda. Finalize o onboarding e clique em <strong>Gerar Treino</strong> no Step 5.\n",
    "            </div>\n",
    "          ) : (\n",
    "            <div className=\"space-y-3\">\n",
    "              <div className=\"rounded-xl border border-border/50 p-4\">\n",
    "                <div className=\"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2\">\n",
    "                  <div>\n",
    "                    <p className=\"text-base font-semibold\">Treinos Ativos</p>\n",
    "                    <p className=\"text-xs text-muted-foreground\">\n",
    "                      {treinoPlan?.divisaoSemanal} • {treinoPlan?.frequencia}x/semana\n",
    "                    </p>\n",
    "                  </div>\n",
    "                  <div className=\"text-xs text-muted-foreground\">\n",
    "                    Fonte: <span className=\"font-medium\">treinoPlan</span>\n",
    "                  </div>\n",
    "                </div>\n",
    "              </div>\n",
    "\n",
    "              <div className=\"space-y-3\">\n",
    "                {(treinoPlan?.treinos ?? []).map((dia, idx) => (\n",
    "                  <div key={idx} className=\"rounded-xl border border-border/50 p-4\">\n",
    "                    <div className=\"flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2\">\n",
    "                      <div>\n",
    "                        <p className=\"text-sm font-semibold\">{dia?.dia} • {dia?.modalidade}</p>\n",
    "                        <p className=\"text-xs text-muted-foreground mt-1\">{dia?.titulo}</p>\n",
    "                        {Array.isArray(dia?.grupamentos) && dia.grupamentos.length > 0 && (\n",
    "                          <p className=\"text-xs text-muted-foreground mt-1\">\n",
    "                            Grupamentos: <span className=\"font-medium\">{dia.grupamentos.join(\" + \")}</span>\n",
    "                          </p>\n",
    "                        )}\n",
    "                      </div>\n",
    "                      <div className=\"text-xs text-muted-foreground\">\n",
    "                        {(dia?.exercicios?.length ?? 0)} exercícios\n",
    "                      </div>\n",
    "                    </div>\n",
    "\n",
    "                    <div className=\"mt-3 space-y-2\">\n",
    "                      {(dia?.exercicios ?? []).map((ex, eIdx) => (\n",
    "                        <div key={eIdx} className=\"rounded-lg bg-muted/40 p-3\">\n",
    "                          <div className=\"flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1\">\n",
    "                            <p className=\"text-sm font-medium\">{ex?.nome}</p>\n",
    "                            <p className=\"text-xs text-muted-foreground\">\n",
    "                              {ex?.series ? `${ex.series}x` : \"\"}\n",
    "                              {ex?.reps ? ` ${ex.reps}` : \"\"}\n",
    "                              {ex?.descanso ? ` • Desc: ${ex.descanso}` : \"\"}\n",
    "                              {ex?.rpe ? ` • ${ex.rpe}` : \"\"}\n",
    "                            </p>\n",
    "                          </div>\n",
    "                          {ex?.observacoes && (\n",
    "                            <p className=\"text-xs text-muted-foreground mt-1\">{ex.observacoes}</p>\n",
    "                          )}\n",
    "                        </div>\n",
    "                      ))}\n",
    "                    </div>\n",
    "                  </div>\n",
    "                ))}\n",
    "              </div>\n",
    "            </div>\n",
    "          )}\n",
    "        </div>\n"
  ].join("");

  s = s.replace(openTag, openTag + block);
  replaced = true;
  break;
}

if (!replaced) {
  console.error("PATCH_FAIL: não encontrei <TabsContent value=\"treino\"> (ou treinos) para injetar o protocolo.");
  process.exit(1);
}

fs.writeFileSync(file, s, "utf8");
console.log("PATCH_OK: PlanosAtivos agora exibe Treinos Ativos lendo state.treino (primary) + workoutProtocolWeekly.treinoPlan (fallback).");
