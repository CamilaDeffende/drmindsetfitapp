#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
FILE_DASH="src/pages/DashboardPremium.tsx"

BK=".backups/DashboardPremium.tsx.before_treinos_ativos.$(date +%Y%m%d_%H%M%S).bak"
mkdir -p .backups

echo "==> Backup: $BK"
cp -a "$FILE_DASH" "$BK"

echo "==> (1) Criar helper ultra seguro: getActiveWorkoutWeek()"
mkdir -p src/lib/treino
cat > src/lib/treino/activeWorkout.ts <<'TS'
/**
 * Helper ultra-seguro para extrair "treinos ativos" do state.
 * NÃO assume um único formato; tenta múltiplos caminhos conhecidos.
 * Retorna uma lista de dias/treinos (array) ou [].
 */

type AnyObj = Record<string, unknown>;

function asObj(v: unknown): AnyObj | null {
  if (v && typeof v === "object") return v as AnyObj;
  return null;
}

function asArr(v: unknown): unknown[] | null {
  return Array.isArray(v) ? v : null;
}

function pickFirstArray(...candidates: unknown[]): unknown[] {
  for (const c of candidates) {
    const a = asArr(c);
    if (a && a.length) return a;
  }
  return [];
}

export function getActiveWorkoutWeek(state: unknown): unknown[] {
  const s = asObj(state);
  if (!s) return [];

  // state.treino (muito provável)
  const treino = asObj(s["treino"]);
  if (treino) {
    // caminhos prováveis
    const a =
      pickFirstArray(
        treino["treinosAtivos"],
        treino["treinoAtivo"],
        treino["planoSemanal"],
        treino["semana"],
        treino["week"],
        treino["treinos"],
        treino["protocoloSemanal"],
        treino["protocolo"]
      );

    // alguns formatos guardam { treinos: [...] }
    if (!a.length) {
      const wrapped = asObj(treino["plano"]) || asObj(treino["protocol"]) || asObj(treino["treinoPlan"]);
      if (wrapped) {
        const inner = pickFirstArray(wrapped["treinos"], wrapped["week"], wrapped["semana"], wrapped["dias"]);
        if (inner.length) return inner;
      }
    }

    if (a.length) return a;
  }

  // fallback: state.treinos / state.planoSemanal etc.
  const fallback = pickFirstArray(
    s["treinosAtivos"],
    s["treinoAtivo"],
    s["planoSemanal"],
    s["semana"],
    s["week"],
    s["treinos"]
  );

  // fallback extra: onboarding pode ter preview salvo em chaves internas
  const mfTreinoPreview = (s as AnyObj)["__mfTreinoPreview"];
  const mfObj = asObj(mfTreinoPreview);
  if (!fallback.length && mfObj) {
    const inner = pickFirstArray(mfObj["treinos"], mfObj["week"], mfObj["semana"]);
    if (inner.length) return inner;
  }

  return fallback;
}

export function getActiveWorkoutSummary(items: unknown[]): { totalDays: number; totalExercises: number } {
  let days = 0;
  let ex = 0;

  for (const it of items) {
    const o = asObj(it);
    if (!o) continue;
    days++;

    // formatos comuns: exercicios: []
    const exercicios = asArr(o["exercicios"]);
    if (exercicios) ex += exercicios.length;

    // formatos alternativos: blocks/items
    const blocks = asArr(o["blocks"]) || asArr(o["items"]);
    if (!exercicios && blocks) ex += blocks.length;
  }

  return { totalDays: days, totalExercises: ex };
}
TS

echo "==> (2) Criar componente premium: DashboardActiveWorkouts"
mkdir -p src/components/dashboard
cat > src/components/dashboard/DashboardActiveWorkouts.tsx <<'TSX'
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dumbbell, CalendarDays, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getActiveWorkoutSummary, getActiveWorkoutWeek } from "@/lib/treino/activeWorkout";

type Props = { state: unknown };

function safeText(v: unknown, fallback: string) {
  if (typeof v === "string" && v.trim()) return v;
  return fallback;
}

export function DashboardActiveWorkouts({ state }: Props) {
  const navigate = useNavigate();
  const items = getActiveWorkoutWeek(state);
  const { totalDays, totalExercises } = getActiveWorkoutSummary(items);

  const has = items.length > 0;

  return (
    <Card className="glass-effect neon-border overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10">
              <Dumbbell className="w-5 h-5 text-[#1E6BFF]" />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-white/90">Treinos Ativos</div>
              <div className="text-[12px] text-white/60">
                {has ? "Seu protocolo semanal gerado no onboarding." : "Ainda não há treino gerado nesta conta."}
              </div>
            </div>
          </div>

          <Button
            onClick={() => navigate("/treino")}
            className="gap-2 bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF]"
            size="sm"
          >
            Ver treino <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-3">
        {has ? (
          <>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] text-white/60 flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" /> Dias
                </div>
                <div className="text-[18px] font-bold text-white/90">{totalDays}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] text-white/60">Exercícios</div>
                <div className="text-[18px] font-bold text-white/90">{totalExercises}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <div className="text-[11px] text-white/60">Status</div>
                <div className="text-[18px] font-bold text-green-400">Ativo</div>
              </div>
            </div>

            <div className="space-y-2">
              {items.slice(0, 5).map((it, idx) => {
                const o = (it && typeof it === "object") ? (it as any) : {};
                const dia = safeText(o?.dia, `Dia ${idx + 1}`);
                const foco = safeText(o?.foco, "");
                const qtd = Array.isArray(o?.exercicios) ? o.exercicios.length : 0;

                return (
                  <div key={idx} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[13px] font-semibold text-white/90">{dia}</div>
                      <div className="text-[12px] text-white/60">{qtd ? `${qtd} exercícios` : "Sessão"}</div>
                    </div>
                    {foco ? <div className="mt-1 text-[12px] text-white/60">{foco}</div> : null}
                  </div>
                );
              })}
            </div>

            {items.length > 5 ? (
              <div className="mt-3 text-[12px] text-white/55">
                +{items.length - 5} dias adicionais. Veja a semana completa em <b>/treino</b>.
              </div>
            ) : null}
          </>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-[13px] text-white/80 font-semibold">Gere seu treino semanal</div>
            <div className="text-[12px] text-white/60 mt-1">
              Finalize o onboarding e clique em <b>Gerar minha semana</b> na etapa de treino.
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" onClick={() => navigate("/onboarding")} className="border-white/15">
                Ir para Onboarding
              </Button>
              <Button onClick={() => navigate("/treino")} className="gap-2">
                Abrir Treino <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
TSX

echo "==> (3) Injetar no DashboardPremium (sem quebrar o layout)"
node - <<NODE
const fs = require("fs");

const file = "src/pages/DashboardPremium.tsx";
let s = fs.readFileSync(file, "utf8");
const before = s;

// garante import
if (!s.includes(DashboardActiveWorkouts)) {
  // tenta inserir após imports existentes
  s = s.replace(
    /from date-fns/locale\n/g,
    "from date-fns/locale\nimport { DashboardActiveWorkouts } from @/components/dashboard/DashboardActiveWorkouts\n"
  );

  // fallback se padrão de import diferente
  if (!s.includes("DashboardActiveWorkouts")) {
    s = s.replace(
      /import\s+\{\s*ptBR\s*\}\s+from\s+date-fns/locale\s*\n/,
      (m) => m + "import { DashboardActiveWorkouts } from @/components/dashboard/DashboardActiveWorkouts\n"
    );
  }
}

// injeta bloco no <main ...> logo no começo do conteúdo
if (!s.includes("<DashboardActiveWorkouts")) {
  s = s.replace(
    /<main className="max-w-7xl mx-auto px-4 py-6 space-y-6">\s*\n/,
    `<main className="max-w-7xl mx-auto px-4 py-6 space-y-6">\n        {/* Treinos Ativos (espelha o treino gerado no onboarding) */}\n        <DashboardActiveWorkouts state={state} />\n`
  );
}

if (s === before) {
  console.log("ℹ️ Nenhuma mudança aplicada (provavelmente já estava injetado).");
} else {
  fs.writeFileSync(file, s, "utf8");
  console.log("✅ DashboardPremium: Treinos Ativos injetado com segurança.");
}
NODE

echo "==> (4) CHECK rápido: imports e uso"
rg -n "DashboardActiveWorkouts" src/pages/DashboardPremium.tsx src/components/dashboard/DashboardActiveWorkouts.tsx src/lib/treino/activeWorkout.ts || true

echo "==> (5) VERIFY (BUILD VERDE obrigatório)"
npm run verify

echo "==> (6) Commit + push"
BR="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
git add -A
git commit -m "feat(dashboard): add Treinos Ativos (from onboarding workout) + safe extractor (build green)" || echo "ℹ️ Nada para commitar."
git push origin "$BR"

echo "✅ OK | Treinos Ativos no Dashboard | BUILD VERDE"
