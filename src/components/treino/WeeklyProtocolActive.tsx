import { useMemo } from "react";
import { toWeekdayKey } from "@/utils/strength/weekdayMap";
import { loadWeekPlan } from "@/utils/strength/strengthWeekStorage";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { getCanonicalTrainingWorkouts } from "@/services/training/activeTrainingSessions.bridge";

type Session = {
  day: string;
  modality: string;
  modalityLevel?: string | null;
  strategy?: string | null;
  rationale?: string | null;
  structure?: {
    type?: string;
    intensidade?: string;
    descanso?: string;
    duracaoEstimada?: string;
  } | null;
  plan?: any;
};

const LABEL: Record<string, string> = {
  musculacao: "Musculação",
  funcional: "Funcional",
  corrida: "Corrida",
  bike: "Bike",
  bike_indoor: "Bike Indoor",
  crossfit: "CrossFit",
};

const ORDER: Record<string, number> = {
  Segunda: 1,
  "Segunda-feira": 1,
  Terça: 2,
  Terca: 2,
  "Terça-feira": 2,
  Quarta: 3,
  "Quarta-feira": 3,
  Quinta: 4,
  "Quinta-feira": 4,
  Sexta: 5,
  "Sexta-feira": 5,
  Sábado: 6,
  Sabado: 6,
  Domingo: 7,
};

function fmt(v: unknown) {
  const s = String(v ?? "").trim();
  return s.length ? s : "-";
}

function getStrengthFocusGroupsForDay(dayLabel: string): string[] {
  try {
    const plan = loadWeekPlan();
    if (!plan) return [];
    const k = toWeekdayKey(dayLabel);
    if (!k) return [];
    const arr = (plan as any)[k];
    return Array.isArray(arr) ? arr.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function focusChip(groups: string[]) {
  if (!groups.length) return null;
  return (
    <div className="rounded-full border border-white/10 bg-gradient-to-r from-white/10 to-white/5 px-3 py-1 text-[11px]">
      <span className="text-muted-foreground">Foco do dia:</span>{" "}
      <span className="font-semibold">{groups.join(" • ")}</span>
    </div>
  );
}

function chip(label: string, value: string) {
  if (!value || value === "-") return null;
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px]">
      <span className="text-muted-foreground">{label}:</span>{" "}
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function buildSessionsFromCanonicalWorkouts(): Session[] {
  const workouts = getCanonicalTrainingWorkouts();
  if (!workouts.length) return [];

  return workouts.map((w) => {
    const firstBlock = Array.isArray(w.blocks) ? w.blocks[0] : null;
    const exercises = Array.isArray(firstBlock?.exercises) ? firstBlock.exercises : [];
    const descanso =
      exercises.length && typeof exercises[0]?.restSec === "number"
        ? `${exercises[0].restSec}s`
        : "";

    return {
      day: String(w.dayLabel ?? w.dayKey ?? "Dia"),
      modality: String(w.modality ?? "musculacao"),
      modalityLevel: String(w.level ?? "auto"),
      strategy: String(w.title ?? "Sessão planejada"),
      rationale: w.rationale ? String(w.rationale) : null,
      structure: {
        type: String(firstBlock?.label ?? "Bloco principal"),
        intensidade: String(w.intensity ?? ""),
        descanso,
        duracaoEstimada: w.estimatedDurationMin ? `${w.estimatedDurationMin} min` : "",
      },
      plan: {
        blocks: w.blocks ?? [],
        focus: w.focus ?? "",
        tags: w.tags ?? [],
      },
    };
  });
}

export function WeeklyProtocolActive() {
  const { state } = useDrMindSetfit();

  const canonicalSessions = useMemo(() => buildSessionsFromCanonicalWorkouts(), []);
  const protocol = (state as any)?.workoutProtocolWeekly ?? null;

  const sessions = useMemo(() => {
    if (canonicalSessions.length) {
      return [...canonicalSessions].sort((a, b) => (ORDER[a.day] ?? 99) - (ORDER[b.day] ?? 99));
    }

    const raw = protocol?.sessions;
    const arr: Session[] = Array.isArray(raw) ? raw : [];
    return [...arr].sort((a, b) => (ORDER[a.day] ?? 99) - (ORDER[b.day] ?? 99));
  }, [canonicalSessions, protocol]);

  const grouped = useMemo(() => {
    const map: Record<string, Session[]> = {};
    for (const s of sessions) {
      const d = String(s.day ?? "");
      if (!d) continue;
      (map[d] ||= []).push(s);
    }
    return Object.entries(map).sort((a, b) => (ORDER[a[0]] ?? 99) - (ORDER[b[0]] ?? 99));
  }, [sessions]);

  const modalities = useMemo(() => {
    if (canonicalSessions.length) {
      return Array.from(new Set(canonicalSessions.map((s) => String(s.modality)).filter(Boolean)));
    }
    const m = protocol?.modalities;
    const arr: string[] = Array.isArray(m) ? m.map(String) : [];
    return arr.filter(Boolean);
  }, [canonicalSessions, protocol]);

  const strategiesByModality = useMemo(() => {
    if (canonicalSessions.length) {
      const out: Record<string, any> = {};
      for (const s of canonicalSessions) {
        if (!out[s.modality]) {
          out[s.modality] = {
            strategy: s.strategy ?? "Sessão planejada",
            rationale: s.rationale ?? "Plano derivado do contrato oficial salvo.",
          };
        }
      }
      return out;
    }
    const st = protocol?.modalityStrategies;
    return st && typeof st === "object" ? st : {};
  }, [canonicalSessions, protocol]);

  if (!sessions.length) return null;

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Treinos Ativos</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Plano semanal gerado automaticamente.
            </div>
            <div className="mt-1 text-[11px] text-white/45">
              Fonte: <span className="font-semibold text-white/70">{canonicalSessions.length ? "training.workouts" : "workoutProtocolWeekly"}</span>
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Atualizado: <span className="font-semibold">{canonicalSessions.length ? "plano ativo" : fmt(protocol?.generatedAt).slice(0, 10)}</span>
          </div>
        </div>

        {modalities.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {modalities.map((k) => (
              <div key={k} className="rounded-full border border-white/10 bg-black/10 px-3 py-1 text-[11px]">
                <span className="font-semibold">{LABEL[k] ?? k}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {modalities.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="text-sm font-semibold">Estratégia por modalidade</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Resumo do racional aplicado ao plano atual.
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            {modalities.map((m) => {
              const st = strategiesByModality?.[m] ?? {};
              const title = LABEL[m] ?? m;
              const strategy = fmt(st?.strategy);
              const rationale = fmt(st?.rationale);

              return (
                <div key={m} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-semibold">{title}</div>
                    <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px]">
                      <span className="text-muted-foreground">Estratégia:</span>{" "}
                      <span className="font-semibold">{strategy}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    {rationale}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {grouped.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-2 sm:p-3">
          {grouped.map(([day, items]) => (
            <details key={day} className="group rounded-2xl border border-white/10 bg-black/10 p-3 sm:p-4 mb-2 last:mb-0">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-sm font-semibold">{day}</div>
                  <div className="text-[11px] text-muted-foreground">
                    {items.length} sessão(ões)
                  </div>
                </div>
                <div className="text-[11px] text-muted-foreground group-open:hidden">Abrir</div>
                <div className="text-[11px] text-muted-foreground hidden group-open:block">Fechar</div>
              </summary>

              <div className="mt-3 grid grid-cols-1 gap-3">
                {items.map((s, idx) => {
                  const modKey = String(s.modality ?? "");
                  const focusGroups = modKey === "musculacao" ? getStrengthFocusGroupsForDay(day) : [];

                  const modLabel = LABEL[modKey] ?? modKey;
                  const lvl = fmt(s.modalityLevel);
                  const st = s.structure ?? null;

                  const type = st?.type ? String(st.type) : "";
                  const intensidade = st?.intensidade ? String(st.intensidade) : "";
                  const descanso = st?.descanso ? String(st.descanso) : "";
                  const duracao = st?.duracaoEstimada ? String(st.duracaoEstimada) : "";

                  return (
                    <div key={`${day}-${modKey}-${idx}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-[160px]">
                          <div className="text-sm font-semibold">{modLabel}</div>
                          <div className="text-[11px] text-muted-foreground">
                            Nível: <span className="font-semibold capitalize">{lvl}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {focusChip(focusGroups)}
                          {chip("Tipo", type)}
                          {chip("Intensidade", intensidade)}
                          {chip("Descanso", descanso)}
                          {chip("Duração", duracao)}
                        </div>
                      </div>

                      {s.rationale ? (
                        <div className="mt-3 text-xs text-muted-foreground leading-relaxed">
                          {String(s.rationale)}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      ) : null}
    </div>
  );
}
