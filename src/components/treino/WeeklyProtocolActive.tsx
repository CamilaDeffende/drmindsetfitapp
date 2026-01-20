import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";

const WEEK_ORDER: Record<string, number> = {
  "Segunda": 0, "Terça": 1, "Terca": 1, "Quarta": 2, "Quinta": 3, "Sexta": 4, "Sábado": 5, "Sabado": 5, "Domingo": 6,
  "seg": 0, "ter": 1, "qua": 2, "qui": 3, "sex": 4, "sab": 5, "dom": 6,
};

const dayIndex = (d: unknown) => {
  const k = String(d ?? "").trim();
  if (k in WEEK_ORDER) return WEEK_ORDER[k];
  const k3 = k.toLowerCase().slice(0, 3);
  if (k3 in WEEK_ORDER) return WEEK_ORDER[k3];
  return 999;
};

const labelMod = (k: unknown) => {
  const key = String(k ?? "");
  const map: Record<string, string> = {
    musculacao: "Musculação",
    funcional: "Funcional",
    corrida: "Corrida",
    bikeindoor: "Bike Indoor",
    spinning: "Bike Indoor",
    bike: "Bike Indoor",
    crossfit: "CrossFit",
  };
  return map[key] ?? (key ? key[0].toUpperCase() + key.slice(1) : "Treino");
};

const cap = (v: unknown) =>
  String(v ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());

export function WeeklyProtocolActive() {
  const { state } = useDrMindSetfit();
  const proto = (state as any)?.workoutProtocolWeekly;
  const sessions = Array.isArray(proto?.sessions) ? proto.sessions.slice() : [];

  if (!sessions.length) return null;

  sessions.sort((a: any, b: any) => dayIndex(a?.day) - dayIndex(b?.day));

  return (
    <div className="mt-4 grid grid-cols-1 gap-3 sm:gap-4">
      {sessions.map((ss: any, idx: number) => {
        const day = ss?.day ?? "-";
        const mod = ss?.modality ?? "-";
        const lvl = ss?.modalityLevel ?? (proto?.levelByModality?.[mod] ?? "-");
        const goal = ss?.goal ?? "";
        const st = ss?.structure ?? null;

        // exercícios (se o engine preencher)
        const plan = ss?.plan ?? ss?.workout ?? ss?.details ?? null;
        const exs = Array.isArray(plan?.exercises)
          ? plan.exercises
          : Array.isArray(ss?.exercises)
            ? ss.exercises
            : [];

        return (
          <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm text-muted-foreground">{cap(day)}</div>
                <div className="text-lg font-semibold">{labelMod(mod)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Nível: <span className="capitalize">{String(lvl)}</span>
                </div>
              </div>
              {!!goal && (
                <div className="text-xs rounded-full border border-white/10 bg-black/10 px-3 py-1">
                  {goal}
                </div>
              )}
            </div>

            {st ? (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="rounded-xl border border-white/10 bg-black/10 p-2">
                  <div className="text-muted-foreground">Tipo</div>
                  <div className="font-semibold">{String(st.type ?? "-")}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 p-2">
                  <div className="text-muted-foreground">Intensidade</div>
                  <div className="font-semibold capitalize">{String(st.intensidade ?? "-")}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 p-2">
                  <div className="text-muted-foreground">Descanso</div>
                  <div className="font-semibold">{String(st.descanso ?? "-")}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/10 p-2">
                  <div className="text-muted-foreground">Duração</div>
                  <div className="font-semibold">{String(st.duracaoEstimada ?? "-")}</div>
                </div>
              </div>
            ) : null}

            {exs.length ? (
              <div className="mt-4 space-y-2">
                <div className="text-sm font-semibold">Treino do dia</div>
                <div className="space-y-2">
                  {exs.map((ex: any, i: number) => {
                    const name = ex?.name ?? ex?.nome ?? ex?.title ?? `Exercício ${i + 1}`;
                    const sets = ex?.sets ?? ex?.series ?? ex?.setCount ?? "-";
                    const reps = ex?.reps ?? ex?.repeticoes ?? ex?.repRange ?? "-";
                    const rest = ex?.rest ?? ex?.descanso ?? ex?.intervalo ?? "-";
                    return (
                      <div key={i} className="rounded-xl border border-white/10 bg-black/10 p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="text-sm font-semibold">{name}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {sets}x {reps} • {rest}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
