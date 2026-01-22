const fs = require("fs");

const file = "src/components/steps/Step5Treino.tsx";
let s = fs.readFileSync(file, "utf8");

// 1) garantir estados locais p/ preview
if (!s.includes("const [__mfGenerated")) {
  s = s.replace(
    /const\s+\[planByDay,\s*setPlanByDay\][\s\S]*?\n\s*const\s+\[planByDay,\s*setPlanByDay\][\s\S]*?;/m,
    (m) => m
  );
  s = s.replace(
    /const\s+\[planByDay,\s*setPlanByDay\][^\n]*\n/m,
    (m) =>
      m +
      `  const [__mfGenerated, set__mfGenerated] = useState(false);\n` +
      `  const [__mfTreinoPreview, set__mfTreinoPreview] = useState<any>(null);\n` +
      `  const [__mfProtocolPreview, set__mfProtocolPreview] = useState<any>(null);\n`
  );
}

// 2) criar handler "Gerar Treino" (não avança step)
if (!s.includes("const handleGerarTreino")) {
  const anchor = "const handleContinuar = () => {";
  if (!s.includes(anchor)) {
    console.error("PATCH_FAIL: handleContinuar not found.");
    process.exit(1);
  }

  // duplicar lógica do handleContinuar, mas SEM nextStep()
  const re = /const\s+handleContinuar\s*=\s*\(\)\s*=>\s*\{[\s\S]*?\n\s*\};/m;
  const m = s.match(re);
  if (!m) {
    console.error("PATCH_FAIL: cannot capture handleContinuar block.");
    process.exit(1);
  }

  const original = m[0];

  // extrai corpo do handleContinuar
  const body = original
    .replace(/^const\s+handleContinuar\s*=\s*\(\)\s*=>\s*\{\s*/m, "")
    .replace(/\s*\};\s*$/m, "");

  const newGerar =
`  const handleGerarTreino = () => {
${body
  // remove nextStep() do fluxo de gerar (vamos avançar só no continuar)
  .replace(/\n\s*nextStep\(\);\s*/g, "\n")
  // garantir preview após updateState
  .replace(
    /updateState\(\s*\{\s*workoutProtocolWeekly:\s*__protocol\s*\}\s*as\s*any\s*\);\s*/m,
    (x) =>
      x +
      `\n    // Preview completo do protocolo (antes de avançar)\n` +
      `    set__mfTreinoPreview(treinoPlan);\n` +
      `    set__mfProtocolPreview(__protocol);\n` +
      `    set__mfGenerated(true);\n`
  )
}
  };`;

  // criar handleContinuar simples (só persiste + avança)
  const newContinuar =
`  const handleContinuar = () => {
    if (!__mfGenerated) return;
    // já gerado e persistido — apenas avança no fluxo
    nextStep();
  };`;

  s = s.replace(re, newGerar + "\n\n" + newContinuar);
}

// 3) UI: botão vira "Gerar Treino" e aparece "Continuar" quando gerado
// trocar onClick do botão principal para handleGerarTreino
s = s.replace(
  /onClick=\{handleContinuar\}/g,
  "onClick={__mfGenerated ? handleContinuar : handleGerarTreino}"
);

// trocar label "Próxima etapa" por "Gerar Treino" / "Continuar"
s = s.replace(
  /Próxima etapa\s*<ArrowRight/gs,
  `{__mfGenerated ? "Continuar" : "Gerar Treino"} <ArrowRight`
);

// 4) inserir preview do protocolo logo acima dos botões finais
if (!s.includes("/* PREVIEW TREINO GERADO */")) {
  const insertBefore = /<div className="mt-6 flex items-center justify-between gap-3">/m;
  if (!insertBefore.test(s)) {
    console.error("PATCH_FAIL: footer buttons container not found.");
    process.exit(1);
  }

  const preview =
`      {/* PREVIEW TREINO GERADO */}
      {__mfGenerated && (__mfTreinoPreview?.treinos?.length || __mfProtocolPreview) ? (
        <Card className="mt-4 border-white/10 bg-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Seu protocolo semanal</CardTitle>
            <CardDescription>
              Treino individualizado com base nas suas modalidades, nível e dias selecionados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(__mfTreinoPreview?.treinos ?? []).map((dia, idx) => (
                <div key={idx} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold">{dia?.dia ?? "Dia"}</div>
                    <Badge variant="secondary" className="text-xs">
                      {(dia?.exercicios?.length ?? 0)} exercícios
                    </Badge>
                  </div>
                  {dia?.foco ? (
                    <div className="mt-1 text-xs text-muted-foreground">{dia.foco}</div>
                  ) : null}
                  <div className="mt-3 space-y-1">
                    {(dia?.exercicios ?? []).map((ex, eIdx) => (
                      <div key={eIdx} className="text-xs text-muted-foreground">
                        • <span className="text-foreground/90">{ex?.nome ?? "Exercício"}</span>
                        {ex?.series ? <> — {ex.series}x{ex?.reps ?? ""}</> : null}
                        {ex?.tempo ? <> — {ex.tempo}</> : null}
                        {ex?.descanso ? <> • Desc: {ex.descanso}</> : null}
                        {ex?.intensidade ? <> • {ex.intensidade}</> : null}
                      </div>
                    ))}
                  </div>
                  {dia?.observacoes ? (
                    <div className="mt-3 text-xs text-muted-foreground italic">{dia.observacoes}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

`;

  s = s.replace(insertBefore, preview + "      " + s.match(insertBefore)[0]);
}

// 5) segurança: se não existir handleGerarTreino por algum motivo, falhar
if (!s.includes("handleGerarTreino")) {
  console.error("PATCH_FAIL: handleGerarTreino missing after patch.");
  process.exit(1);
}

fs.writeFileSync(file, s, "utf8");
console.log("PATCH_OK: Step5 agora gera treino, mostra preview completo e só depois avança (2 fases).");
