import { useMemo } from "react";
import { loadWeekPlan } from "@/utils/strength/strengthWeekStorage";
import type { WeekdayKey } from "@/utils/strength/strengthWeekStorage";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";

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



/* MF_FOCO_DO_DIA_CHIPS_V1
   Chips premium de "Foco do dia" (Musculação), lendo weekPlan salvo (StrengthWeekPlan).
   - Tolerante a variações de shape do weekPlan (tentativas em cascata).
   - Nunca quebra a UI se não houver dados.
*/
function getFocusGroupsFromWeekPlan(dayLabel: string): string[] {
  return getStrengthFocusGroupsForDay(dayLabel);
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


function toWeekdayKeyFromLabel(day: string): WeekdayKey | null {
  const raw = String(day ?? "").trim();
  if (!raw) return null;

  // normaliza para comparação
  const lower = raw.toLowerCase();
  const norm = lower
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos (terça -> terca)

  // aceita abreviações e labels completos
  if (norm.startsWith("seg")) return "seg";
  if (norm.startsWith("ter")) return "ter";
  if (norm.startsWith("qua")) return "qua";
  if (norm.startsWith("qui")) return "qui";
  if (norm.startsWith("sex")) return "sex";
  if (norm.startsWith("sab")) return "sab";
  if (norm.startsWith("dom")) return "dom";

  // fallback ultra defensivo
  if (norm.includes("segunda")) return "seg";
  if (norm.includes("terca")) return "ter";
  if (norm.includes("quarta")) return "qua";
  if (norm.includes("quinta")) return "qui";
  if (norm.includes("sexta")) return "sex";
  if (norm.includes("sabado")) return "sab";
  if (norm.includes("domingo")) return "dom";

  return null;
}


function getStrengthFocusGroupsForDay(dayLabel: string): string[] {
  try {
    const plan = loadWeekPlan();
    if (!plan) return [];
    const k = toWeekdayKeyFromLabel(dayLabel);
    if (!k) return [];
    const arr = (plan as any)[k];
    return Array.isArray(arr) ? arr.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function WeeklyProtocolActive() {
  const { state } = useDrMindSetfit();

  const protocol = (state as any)?.workoutProtocolWeekly ?? null;

  const sessions = useMemo(() => {
    const raw = protocol?.sessions;
    const arr: Session[] = Array.isArray(raw) ? raw : [];
    return [...arr].sort((a, b) => (ORDER[a.day] ?? 99) - (ORDER[b.day] ?? 99));
  }, [protocol]);

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
    const m = protocol?.modalities;
    const arr: string[] = Array.isArray(m) ? m.map(String) : [];
    return arr.filter(Boolean);
  }, [protocol]);

  const strategiesByModality = useMemo(() => {
    const s = protocol?.modalityStrategies;
    return (s && typeof s === "object") ? s : {};
  }, [protocol]);

  if (!protocol) return null;

  return (
    <div className="mt-4 space-y-4">
      {/* Header ultra clean */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Treinos Ativos</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Plano semanal gerado automaticamente a partir das modalidades, níveis e dias selecionados.
            </div>
          </div>
          <div className="text-[11px] text-muted-foreground">
            Atualizado: <span className="font-semibold">{fmt(protocol?.generatedAt).slice(0, 10)}</span>
          </div>
        </div>

        {/* Modalidades ativas (chips) */}
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

      {/* Estratégia por modalidade (sempre para todas as selecionadas) */}
      {modalities.length ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="text-sm font-semibold">Estratégia por modalidade</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Resumo do racional aplicado pelo motor (determinístico) para cada modalidade escolhida.
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

      {/* Accordion por dia */}
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
                  const focusGroups = (modKey === "musculacao") ? getFocusGroupsFromWeekPlan(day) : [];

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
                          {chip("Intensidade", intensidade ? intensidade : "")}
                          {chip("Descanso", descanso)}
                          {chip("Duração", duracao)}
                        </div>
                      </div>

                      {/* Observação/racional curto (se existir por sessão) */}
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
