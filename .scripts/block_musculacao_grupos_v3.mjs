import fs from "node:fs";

const file = "src/components/steps/Step5Treino.tsx";
if (!fs.existsSync(file)) {
  console.error("MISSING:", file);
  process.exit(1);
}

let s = fs.readFileSync(file, "utf8");
const before = s;

// Idempotência: se já existe o bloco, sai
if (s.includes("Grupamentos musculares (Musculação)")) {
  console.log("ℹ️ Bloco de grupamentos já existe. Nada a fazer.");
  process.exit(0);
}

// Ponto ultra-seguro: inserir ANTES do comentário da seção 2
const marker = "{/* 2) Nível por modalidade */}";
const idx = s.indexOf(marker);
if (idx === -1) {
  console.error("❌ Marker não encontrado:", marker);
  console.error("➡️ Não apliquei nada para não quebrar.");
  process.exit(1);
}

const uiBlock = `
      {/* 1.5) Grupamentos musculares (Musculação) */}
      {selectedModalities.includes("musculacao") && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Grupamentos musculares (Musculação)</CardTitle>
            <CardDescription>
              Selecione quais grupamentos você quer priorizar. Isso personaliza a distribuição da semana de musculação.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {strengthGroupsError ? (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {strengthGroupsError}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                Dica premium: escolha 2–4 grupamentos para um plano mais consistente e inteligente.
              </div>
            )}

            {/* Picker premium (mesmo padrão dos demais) */}
            <div onClick={() => setStrengthGroupsError(null)} className="rounded-xl border bg-background/60 p-3">
              <StrengthMuscleGroupsPicker />
            </div>

            <div className="text-xs text-muted-foreground">
              Obrigatório para gerar o plano de <span className="font-medium">Musculação</span>.
            </div>
          </CardContent>
        </Card>
      )}
`;

s = s.slice(0, idx) + uiBlock + "\n" + s.slice(idx);

if (s === before) {
  console.log("ℹ️ Nenhuma alteração detectada.");
} else {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Bloco inserido com sucesso em Step5Treino.tsx (antes do nível por modalidade).");
}
