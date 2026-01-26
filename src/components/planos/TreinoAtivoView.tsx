import { useMemo } from "react";

type AnyObj = Record<string, any>;

export type TreinoAtivoViewProps = {
  treinoAtivo: AnyObj;
};

function fmtDate(v: any, locale = "pt-BR") {
  if (!v) return "—";
  try {
    const d = typeof v === "string" || typeof v === "number" ? new Date(v) : v;
    if (d instanceof Date && !Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(locale);
    }
  } catch {}
  return String(v);
}

function safeArray(v: any): any[] {
  return Array.isArray(v) ? v : [];
}

export function TreinoAtivoView({ treinoAtivo }: TreinoAtivoViewProps) {
  const view = useMemo(() => {
    const t = (treinoAtivo || {}) as AnyObj;

    const treino = (t.treino || t.plan || t.programa || {}) as AnyObj;
    const estrategia = (t.estrategia || treino.estrategia || "Treino individualizado") as string;

    const dataInicio = t.dataInicio ?? t.inicio ?? treino.dataInicio;
    const dataFim = t.dataFim ?? t.fim ?? treino.dataFim;
    const duracaoSemanas = Number.isFinite(t.duracaoSemanas) ? t.duracaoSemanas : (Number.isFinite(t.semanas) ? t.semanas : 4);

    // tentativas comuns de estrutura:
    // treino.treinos[] => [{ dia: "A", exercicios: [...] }]
    // treino.dias[]    => [{ nome: "Seg", exercicios: [...] }]
    // weekPlan[]       => [{ dayLabel, exercises: [...] }]
    const dias =
      safeArray(treino.treinos).length ? safeArray(treino.treinos) :
      safeArray(treino.dias).length ? safeArray(treino.dias) :
      safeArray(treino.weekPlan).length ? safeArray(treino.weekPlan) :
      [];

    const diasFmt = dias.map((d: AnyObj, idx: number) => {
      const label =
        d?.dia ?? d?.nome ?? d?.dayLabel ?? d?.day ?? `Dia ${idx + 1}`;

      const exercicios =
        safeArray(d?.exercicios).length ? safeArray(d.exercicios) :
        safeArray(d?.exercises).length ? safeArray(d.exercises) :
        [];

      const exFmt = exercicios.map((ex: AnyObj, j: number) => {
        const nome = ex?.nome ?? ex?.name ?? ex?.titulo ?? `Exercício ${j + 1}`;
        const series = ex?.series ?? ex?.sets;
        const reps = ex?.reps ?? ex?.repeticoes;
        const obs = ex?.observacao ?? ex?.nota ?? ex?.note ?? "";
        return { nome: String(nome), series, reps, obs: String(obs || "") };
      });

      return { label: String(label), exercicios: exFmt };
    });

    return {
      estrategia,
      dataInicio,
      dataFim,
      duracaoSemanas,
      dias: diasFmt,
    };
  }, [treinoAtivo]);

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-4 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white/90">Treino Ativo</div>
            <div className="mt-1 text-xs text-white/60">
              Estratégia: <span className="text-white/80">{view.estrategia}</span>
            </div>
            <div className="mt-1 text-xs text-white/60">
              Período: <span className="text-white/80">{fmtDate(view.dataInicio)} → {fmtDate(view.dataFim)}</span>
              {" • "}
              Semanas: <span className="text-white/80">{view.duracaoSemanas}</span>
            </div>
          </div>

          <div className="shrink-0 rounded-xl bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/80">
            {view.dias.length ? `${view.dias.length} dias` : "estrutura básica"}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {view.dias.length ? (
            view.dias.map((d, idx) => (
              <div key={`${d.label}-${idx}`} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                <div className="text-xs font-semibold text-white/85">{d.label}</div>

                {d.exercicios.length ? (
                  <ul className="mt-2 space-y-1">
                    {d.exercicios.map((ex, j) => (
                      <li key={`${ex.nome}-${j}`} className="text-[12px] text-white/70">
                        <span className="text-white/85">{ex.nome}</span>
                        {ex.series != null || ex.reps != null ? (
                          <span className="text-white/55">
                            {" "}
                            • {ex.series ?? "—"}x{ex.reps ?? "—"}
                          </span>
                        ) : null}
                        {ex.obs ? <span className="text-white/45"> • {ex.obs}</span> : null}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-2 text-[12px] text-white/45">Exercícios não informados nessa estrutura.</div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-3 text-[12px] text-white/55">
              Não encontrei uma lista de dias/exercícios no objeto atual. (Tudo certo: isso não quebra o app.)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
