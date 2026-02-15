#!/usr/bin/env bash
set -euo pipefail

echo "==> [BLOCO 1 v2] Frequência semanal (FAF) | global-profile store + Step2Avaliacao + metabolismo.ts"
echo "==> (1) Scanner alvo"
rg -n "frequenciaAtividadeSemanal|global-profile/store|calcularMetabolismo|fafBase|getFAF|GET = TMB" \
  src/features/global-profile/store.ts src/components/steps/Step2Avaliacao.tsx src/lib/metabolismo.ts || true

echo "==> (2) Backup"
SHA="$(git rev-parse --short HEAD)"
TS="$(date +%Y%m%d_%H%M%S)"
mkdir -p .backups scripts
tar -czf ".backups/bloco1v2_${TS}_${SHA}.tgz" --exclude=".git" --exclude="node_modules" --exclude="dist" --exclude=".backups" .
cp -a src/features/global-profile/store.ts ".backups/bloco1v2_global-profile.store.${TS}.bak"
cp -a src/components/steps/Step2Avaliacao.tsx ".backups/bloco1v2_Step2Avaliacao.${TS}.bak"
cp -a src/lib/metabolismo.ts ".backups/bloco1v2_metabolismo.${TS}.bak"
echo "✅ Backup: .backups/bloco1v2_${TS}_${SHA}.tgz"

echo "==> (3) Patch cirúrgico (perl)"
perl -0777 -i -pe '
if ($ARGV eq "src/features/global-profile/store.ts") {
  if ($_ !~ /frequenciaAtividadeSemanal\s*:/) {
    $_ =~ s/(return\s*\{\s*\n)/$1  frequenciaAtividadeSemanal: \"moderadamente\", \n/s;
  }
  if ($_ !~ /setFrequenciaAtividadeSemanal\s*:/) {
    $_ =~ s/(\n\s*\}\s*\)\s*;?\s*\n?)/\n  setFrequenciaAtividadeSemanal: (v: string) => set(() => ({ frequenciaAtividadeSemanal: v })),\n$1/s;
  }
}

if ($ARGV eq "src/components/steps/Step2Avaliacao.tsx") {
  if ($_ !~ /frequenciaAtividadeSemanal/) {
    $_ =~ s/(const\s+avaliacaoSchema\s*=\s*z\.object\s*\(\s*\{\s*)/$1\n  frequenciaAtividadeSemanal: z.enum([\"sedentario\",\"moderadamente\",\"ativo\",\"muito_ativo\"]).default(\"moderadamente\"),\n/s;
  }

  if ($_ =~ /useForm<[^>]+>\s*\(\s*\{\s*resolver:\s*zodResolver\(avaliacaoSchema\),/s && $_ !~ /defaultValues\s*:/s) {
    $_ =~ s/(useForm<[^>]+>\s*\(\s*\{\s*resolver:\s*zodResolver\(avaliacaoSchema\),)/$1\n    defaultValues: { frequenciaAtividadeSemanal: \"moderadamente\" },/s;
  }

  if ($_ =~ /const\s+avaliacao:\s*AvaliacaoFisica\s*=\s*\{/s && $_ !~ /frequenciaAtividadeSemanal\s*:/s) {
    $_ =~ s/(const\s+avaliacao:\s*AvaliacaoFisica\s*=\s*\{)/$1\n      frequenciaAtividadeSemanal: data.frequenciaAtividadeSemanal,\n/s;
  }

  if ($_ !~ /Qual a sua frequência de atividade física semanal\?/s) {
    my $ui = q{
            {/* BLOCO 1 (Premium): Frequência de atividade física semanal */}
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold text-white">
                Qual a sua frequência de atividade física semanal?
              </div>
              <div className="mt-2 text-xs text-white/60">
                Usamos isso para aplicar um multiplicador no FAF e estimar seu GET com mais precisão.
              </div>

              <div className="mt-3 grid gap-2">
                {[
                  { v: "sedentario", label: "Sedentário" },
                  { v: "moderadamente_ativo", label: "Moderadamente ativo (1 a 3x/semana)" },
                  { v: "ativo", label: "Ativo (3 a 5x/semana)" },
                  { v: "muito_ativo", label: "Muito ativo (+5x/semana)" },
                ].map((opt) => {
                  const current = form.watch("frequenciaAtividadeSemanal");
                  const active = current === opt.v;
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => form.setValue("frequenciaAtividadeSemanal", opt.v as any, { shouldDirty: true, shouldTouch: true })}
                      className={
                        "w-full rounded-xl border px-3 py-2 text-left text-sm transition " +
                        (active ? "border-white/30 bg-white/10" : "border-white/10 bg-transparent hover:bg-white/5")
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-white">{opt.label}</span>
                        <span className={"text-[10px] " + (active ? "text-white" : "text-white/40")}>
                          {active ? "Selecionado" : "Selecionar"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
    };

    if ($_ =~ /Autoavaliação de biotipo/s) {
      $_ =~ s/(<CardTitle>Autoavaliação de biotipo<\/CardTitle>)/$ui\n\n$1/s;
    } else {
      $_ =~ s/(\n\s*<\/CardContent>\s*\n\s*<\/Card>\s*\n)/$ui$1/s;
    }
  }
}

if ($ARGV eq "src/lib/metabolismo.ts") {
  if ($_ !~ /getWeeklyActivityMultiplier/) {
    $_ =~ s/(\/\/\s*Fator de Atividade Física \(FAF\)[\s\S]*?\n)/$1\n// BLOCO 1 (Premium): multiplicador por frequência semanal\nconst getWeeklyActivityMultiplier = (freq?: string): number => {\n  switch (String(freq || \"\").toLowerCase()) {\n    case \"sedentario\": return 1.20;\n    case \"moderadamente\": return 1.375;\n    case \"ativo\": return 1.55;\n    case \"muito_ativo\": return 1.725;\n    default: return 1.375;\n  }\n};\n\n/s;
  }

  $_ =~ s/const\s+freqSemanal\s*=\s*\(perfil\s+as\s+any\)\?\.\s*avaliacao\?\.\s*frequenciaAtividadeSemanal/const freqSemanal = (avaliacao as any)?.frequenciaAtividadeSemanal/s;

  if ($_ !~ /fafFinal/ ) {
    $_ =~ s/(const\s+fafBase\s*=\s*getFAF\([^\)]+\)\s*;)/$1\n  const fafMult = getWeeklyActivityMultiplier(freqSemanal);\n  const fafFinal = Math.min(2.4, Math.max(1.0, fafBase * fafMult));/s;
  }

  $_ =~ s/const\s+get\s*=\s*tmb\s*\*\s*fafBase\s*;/const get = Math.round(tmb * fafFinal);/s;
  $_ =~ s/const\s+get\s*=\s*Math\.round\(\s*tmb\s*\*\s*fafBase\s*\)\s*;/const get = Math.round(tmb * fafFinal);/s;

  if ($_ !~ /fafMultiplicador/ ) {
    $_ =~ s/(return\s*\{\s*)/$1\n    frequenciaSemanal: freqSemanal,\n    fafBase,\n    fafMultiplicador: fafMult,\n    fafFinal,\n/s;
  }
}
' src/features/global-profile/store.ts src/components/steps/Step2Avaliacao.tsx src/lib/metabolismo.ts

echo "==> (4) VERIFY"
npm run -s verify

echo "==> (5) Commit + Push"
git add -A
git commit -m "feat(bloco1): frequência semanal (FAF premium) + persist + UI Step2 + GET atualizado (build green)" || echo "ℹ️ Nada para commitar."
git push origin main

echo "✅ [BLOCO 1 v2] OK | BUILD VERDE | Próximo: BLOCO 2"
