import { useMemo } from "react";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";

type Session = {
  day: string;
  modality: string;
  modalityLevel?: string | null;
  goal?: string | null;
  structure?: {
    type?: string;
    volume?: number;
    intensidade?: string;
    descanso?: string;
    duracaoEstimada?: string;
  } | null;
  strategy?: string | null;
  rationale?: string | null;
  plan?: any;
};

const LABEL: Record<string, string> = {
  musculacao: "Musculação",
  funcional: "Funcional",
  corrida: "Corrida",
  bike_indoor: "Bike Indoor",
  crossfit: "CrossFit",
};

const ORDER: Record<string, number> = {
  "Segunda": 1,
  "Terça": 2,
  "Terca": 2,
  "Quarta": 3,
  "Quinta": 4,
  "Sexta": 5,
  "Sábado": 6,
  "Sabado": 6,
  "Domingo": 7,
};

function fmt(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : "-";
}

export function WeeklyProtocolActive() {
  const { state } = useDrMindSetfit();

  const sessions = useMemo(() => {
    const raw = (state as any)?.workoutProtocolWeekly?.sessions;
    const arr: Session[] = Array.isArray(raw) ? raw : [];
    return [...arr].sort((a, b) => (ORDER[a.day] ?? 99) - (ORDER[b.day] ?? 99));
  }, [state]);

  if (!sessions.length) return null;

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Treinos Ativos</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Protocolo semanal gerado automaticamente com base nas modalidades, níveis e dias escolhidos.
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3">
        {sessions.map((s, idx) => {
          const modKey = String(s.modality ?? "");
          const modLabel = LABEL[modKey] ?? modKey;
          const lvl = fmt(s.modalityLevel);
          const st = s.structure ?? null;
          const strategy = s.strategy ? String(s.strategy) : "";
          const type = st?.type ? String(st.type) : "";
          const intensidade = st?.intensidade ? String(st.intensidade) : "";
          const descanso = st?.descanso ? String(st.descanso) : "";
          const duracao = st?.duracaoEstimada ? String(st.duracaoEstimada) : "";

          return (
            <div key={`${s.day}-${modKey}-${idx}`} className="rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-[180px]">
                  <div className="text-xs text-muted-foreground">{fmt(s.day)}</div>
                  <div className="text-sm font-semibold">{modLabel}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                    <span className="text-muted-foreground">Nível:</span>{" "}
                    <span className="font-semibold capitalize">{lvl}</span>
                  </div>

                  {strategy ? (
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                      <span className="text-muted-foreground">Estratégia:</span>{" "}
                      <span className="font-semibold">{strategy.split("_").join(" ")}</span>
                    </div>
                  ) : null}

                  {type ? (
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                      <span className="text-muted-foreground">Tipo:</span>{" "}
                      <span className="font-semibold">{type}</span>
                    </div>
                  ) : null}

                  {intensidade ? (
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                      <span className="text-muted-foreground">Intensidade:</span>{" "}
                      <span className="font-semibold capitalize">{intensidade}</span>
                    </div>
                  ) : null}

                  {descanso ? (
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                      <span className="text-muted-foreground">Descanso:</span>{" "}
                      <span className="font-semibold">{descanso}</span>
                    </div>
                  ) : null}

                  {duracao ? (
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                      <span className="text-muted-foreground">Duração:</span>{" "}
                      <span className="font-semibold">{duracao}</span>
                    </div>
                  ) : null}
                </div>
              </div>

              {s.rationale ? (
                <div className="mt-3 text-xs text-muted-foreground">
                  {String(s.rationale)}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
