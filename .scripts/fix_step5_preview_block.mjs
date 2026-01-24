import fs from "node:fs";

const file = "src/components/steps/Step5Treino.tsx";
let s = fs.readFileSync(file, "utf8");
const before = s;

// bloco preview novo (limpo)
const previewBlock = `
      {/* PREVIEW TREINO GERADO */}
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
              {(__mfTreinoPreview?.treinos ?? []).map((dia: any, idx: number) => (
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
                    {(dia?.exercicios ?? []).map((ex: any, eIdx: number) => (
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

// 1) localizar início do preview
const start = s.indexOf("{/* PREVIEW TREINO GERADO */");
if (start === -1) {
  console.error("MISSING: marcador do preview: {/* PREVIEW TREINO GERADO */}");
  process.exit(1);
}

// 2) localizar final do preview (fecha o ternário) — pega o primeiro `) : null}` após o marcador
const tailNeedle = ") : null}";
const end = s.indexOf(tailNeedle, start);
if (end === -1) {
  console.error("MISSING: final do preview: \") : null}\" após o marcador");
  process.exit(1);
}

// inclui o tailNeedle completo
const endPos = end + tailNeedle.length;

// 3) substituir bloco inteiro por versão limpa
s = s.slice(0, start) + previewBlock + s.slice(endPos);

// 4) hardening: remover qualquer resíduo do picker no preview, se tiver sobrado
// (não deve existir mais que 1 ocorrência no arquivo e ela precisa ser do bloco 1.5)
const needle = "<StrengthMuscleGroupsPicker";
const all = [...s.matchAll(new RegExp(needle, "g"))].length;
if (all > 1) {
  // remove tudo após a primeira ocorrência (ultra seguro: apenas dentro do preview já reconstruído não tem)
  // então se ainda tiver >1, é resíduo fora do bloco 1.5 -> remove última ocorrência simples
  const last = s.lastIndexOf(needle);
  s = s.slice(0, last) + s.slice(last).replace(needle, "<!--REMOVED-->");
}

if (s === before) {
  console.log("ℹ️ Nenhuma alteração detectada (preview já estava limpo).");
} else {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Preview reconstruído (JSX limpo) e dedup hardening aplicado.");
}
