#!/usr/bin/env bash
set -euo pipefail

BR="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
FILE="src/components/steps/Step5Treino.tsx"
STAMP="$(date +%Y%m%d_%H%M%S)"
mkdir -p .backups .scripts
BK=".backups/Step5Treino.tsx.before_preview_rebuild_v2.${STAMP}.bak"
cp -a "$FILE" "$BK"

echo "==> BRANCH: $BR"
echo "==> Backup: $BK"

cat > .scripts/fix_step5_preview_block_v2.mjs <<'MJS'
import fs from "node:fs";

const file = "src/components/steps/Step5Treino.tsx";
let s = fs.readFileSync(file, "utf8");
const before = s;

const startMarker = "{/* PREVIEW TREINO GERADO */";
const start = s.indexOf(startMarker);
if (start === -1) {
  console.error("MISSING: marcador do preview:", startMarker);
  process.exit(1);
}

// âncora estável: footer dos botões
const footerNeedle = '<div className="mt-6 flex items-center justify-between gap-3">';
let end = s.indexOf(footerNeedle, start);
if (end === -1) {
  const idx = s.indexOf("mt-6 flex items-center justify-between", start);
  if (idx !== -1) end = s.lastIndexOf("<div", idx);
}
if (end === -1) {
  console.error("MISSING: âncora do footer de botões (mt-6 flex ... justify-between).");
  process.exit(1);
}

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
                        {ex?.series ? (
                          <>
                            {" "}
                            — {ex.series}x{ex?.reps ?? ""}
                          </>
                        ) : null}
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

s = s.slice(0, start) + previewBlock + "\n\n      " + s.slice(end);

// hardening: remover qualquer bloco legacy do preview (se existir)
const marker = "/* Grupamentos da semana (apenas Musculação) */";
const mi = s.indexOf(marker);
if (mi !== -1) {
  const next = s.indexOf("<CardTitle", mi);
  if (next !== -1) s = s.slice(0, mi) + s.slice(next);
}

// garantir só 1 picker
const needle = "<StrengthMuscleGroupsPicker";
const count = [...s.matchAll(new RegExp(needle, "g"))].length;
if (count > 1) {
  // remove última ocorrência de forma simples
  const last = s.lastIndexOf(needle);
  s = s.slice(0, last) + s.slice(last).replace(needle, "<!--REMOVED-->");
}

// normalização de segurança
s = s.split('includes("musculação")').join('includes("musculacao")');

if (s === before) {
  console.log("ℹ️ Nenhuma alteração detectada.");
} else {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ Preview rebuild V2 aplicado (footer delimiter).");
}
MJS

echo "==> Rodar patcher V2..."
node .scripts/fix_step5_preview_block_v2.mjs

echo "==> CHECK: picker deve ficar 1x"
rg -n "<StrengthMuscleGroupsPicker" "$FILE" || true

echo "==> ESLint só no arquivo..."
npx eslint "$FILE" --quiet --ignore-pattern "dist/**" --ignore-pattern ".scan/**" --ignore-pattern "Drmindsetfitpro/**"

echo "==> VERIFY (BUILD VERDE)..."
npm run verify

echo "==> Commit + push..."
git add -A
git commit -m "fix(step5): rebuild preview (jsx clean) + keep muscle groups only in 1.5 (build green)" || echo "ℹ️ Nada para commitar."
git push origin "$BR"

echo "✅ HOTFIX V2 OK | BUILD VERDE"
