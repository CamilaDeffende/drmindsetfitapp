import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Activity,
  Ruler,
  Weight,
  ScanLine,
  ClipboardList,
} from "lucide-react";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";

type MetodoAvaliativo =
  | "bioimpedancia"
  | "dobras-cutaneas"
  | "medidas-corporais"
  | "visual"
  | "nenhum";

type Step2Value = {
  biotipo?: string | null;
  peso?: string;
  altura?: string;

  cintura?: string;
  pescoco?: string;
  quadril?: string;

  atividadeHabitual?: string | null;
  metodoAvaliativo?: MetodoAvaliativo | null;

  percentualGordura?: string;
  massaMagra?: string;

  dobraTriceps?: string;
  dobraAbdomen?: string;
  dobraCoxa?: string;
};

type Props = {
  value?: Step2Value;
  onChange?: (v: Step2Value) => void;
  onNext?: () => void;
  onBack?: () => void;
};

const ACTIVITY_OPTIONS = [
  {
    key: "baixo",
    label: "Baixa",
    desc: "Pouco movimento ao longo do dia",
  },
  {
    key: "moderado",
    label: "Moderada",
    desc: "Rotina ativa com alguma constância",
  },
  {
    key: "alto",
    label: "Alta",
    desc: "Muito deslocamento, treino ou trabalho físico",
  },
] as const;

const METODO_OPTIONS: {
  key: MetodoAvaliativo;
  label: string;
  desc: string;
}[] = [
  {
    key: "bioimpedancia",
    label: "Bioimpedância",
    desc: "Quando você tem balança ou exame com composição corporal",
  },
  {
    key: "dobras-cutaneas",
    label: "Dobras cutâneas",
    desc: "Quando a avaliação foi feita com adipômetro",
  },
  {
    key: "medidas-corporais",
    label: "Medidas corporais",
    desc: "Usando perímetros como base inicial",
  },
  {
    key: "visual",
    label: "Estimativa visual",
    desc: "Quando você quer apenas uma referência prática inicial",
  },
  {
    key: "nenhum",
    label: "Nenhum agora",
    desc: "Seguir sem método específico nesta etapa",
  },
];

function loadDraftStep1() {
  try {
    const raw = localStorage.getItem("mf:onboarding:draft:v1");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed?.step1 ?? {};
  } catch {
    return {};
  }
}

function toDisplay(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function buildStep2Value(
  value: Step2Value | undefined,
  pesoFromStep1: string,
  alturaFromStep1: string
): Step2Value {
  return {
    biotipo: value?.biotipo ?? null,
    peso: pesoFromStep1,
    altura: alturaFromStep1,

    cintura: value?.cintura ?? "",
    pescoco: value?.pescoco ?? "",
    quadril: value?.quadril ?? "",

    atividadeHabitual: value?.atividadeHabitual ?? null,
    metodoAvaliativo: value?.metodoAvaliativo ?? null,

    percentualGordura: value?.percentualGordura ?? "",
    massaMagra: value?.massaMagra ?? "",

    dobraTriceps: value?.dobraTriceps ?? "",
    dobraAbdomen: value?.dobraAbdomen ?? "",
    dobraCoxa: value?.dobraCoxa ?? "",
  };
}

function isSameStep2Value(a: Step2Value, b: Step2Value) {
  return (
    a.biotipo === b.biotipo &&
    a.peso === b.peso &&
    a.altura === b.altura &&
    a.cintura === b.cintura &&
    a.pescoco === b.pescoco &&
    a.quadril === b.quadril &&
    a.atividadeHabitual === b.atividadeHabitual &&
    a.metodoAvaliativo === b.metodoAvaliativo &&
    a.percentualGordura === b.percentualGordura &&
    a.massaMagra === b.massaMagra &&
    a.dobraTriceps === b.dobraTriceps &&
    a.dobraAbdomen === b.dobraAbdomen &&
    a.dobraCoxa === b.dobraCoxa
  );
}

function MetricInput({
  label,
  value,
  onChange,
  placeholder,
  unit,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  unit?: string;
}) {
  return (
    <label className="rounded-[18px] border border-white/10 bg-black/20 p-4">
      <div className="mb-2 text-[12px] uppercase tracking-[0.14em] text-white/35">
        {label}
      </div>
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Opcional"}
        className="w-full bg-transparent text-[20px] font-semibold text-white outline-none placeholder:text-white/20"
      />
      <div className="mt-1 text-[12px] text-white/35">{unit ?? ""}</div>
    </label>
  );
}

export default function Step2Avaliacao({
  value,
  onChange,
  onNext,
  onBack,
}: Props) {
  const { state } = useDrMindSetfit();

  const perfil = (state as any)?.perfil ?? {};
  const avaliacao = (state as any)?.avaliacao ?? {};
  const step1Draft = useMemo(() => loadDraftStep1(), []);

  const pesoFromStep1 = toDisplay(
    perfil?.pesoAtual ??
      perfil?.peso ??
      avaliacao?.peso ??
      (step1Draft as any)?.pesoAtual ??
      (step1Draft as any)?.peso ??
      (step1Draft as any)?.weightKg
  );

  const alturaFromStep1 = toDisplay(
    perfil?.altura ??
      avaliacao?.altura ??
      (step1Draft as any)?.altura ??
      (step1Draft as any)?.heightCm
  );

  const incomingValue = useMemo(
    () => buildStep2Value(value, pesoFromStep1, alturaFromStep1),
    [value, pesoFromStep1, alturaFromStep1]
  );

  const [local, setLocal] = useState<Step2Value>(() => incomingValue);

  useEffect(() => {
    setLocal((prev) => (isSameStep2Value(prev, incomingValue) ? prev : incomingValue));
  }, [incomingValue]);

  const updateValue = (patch: Partial<Step2Value>) => {
    let nextValue = local;

    setLocal((prev) => {
      const next: Step2Value = {
        ...prev,
        ...patch,
        peso: pesoFromStep1,
        altura: alturaFromStep1,
      };

      nextValue = next;
      return isSameStep2Value(prev, next) ? prev : next;
    });

    if (!isSameStep2Value(local, nextValue)) {
      onChange?.(nextValue);
    }
  };

  const cards = useMemo(
    () => [
      {
        id: "ectomorfo",
        title: "Ectomorfo",
        desc: "Tende a perder peso com mais facilidade",
        img: "/biotypes/ectomorfo.png",
        glow: "rgba(0,183,255,0.35)",
      },
      {
        id: "mesomorfo",
        title: "Mesomorfo",
        desc: "Estrutura atlética e boa resposta ao treino",
        img: "/biotypes/mesomorfo.png",
        glow: "rgba(168,85,247,0.35)",
      },
      {
        id: "endomorfo",
        title: "Endomorfo",
        desc: "Tende a ganhar ou reter peso com mais facilidade",
        img: "/biotypes/endomorfo.png",
        glow: "rgba(34,197,94,0.35)",
      },
    ],
    []
  );

  const showBioimpedancia = local.metodoAvaliativo === "bioimpedancia";
  const showDobras = local.metodoAvaliativo === "dobras-cutaneas";
  const showMedidas = local.metodoAvaliativo === "medidas-corporais";
  const showVisual = local.metodoAvaliativo === "visual";

  const canContinue = Boolean(local.biotipo) && Boolean(local.metodoAvaliativo);

  return (
    <div className="w-full text-white space-y-6">
      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <h2 className="text-[22px] font-semibold tracking-tight">
          Base corporal inicial
        </h2>

        <p className="mt-1 text-[13px] leading-5 text-white/50">
          Usamos esses dados para calibrar metabolismo, gasto diário e lógica do plano.
        </p>

        <div className="mt-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,30,56,0.55),rgba(8,10,18,0.9))] p-4">
          <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
            Direcionamento premium
          </div>
          <p className="mt-2 text-[14px] leading-6 text-white/72">
            O app combina biotipo, método avaliativo, medidas base e atividade habitual
            para ajustar melhor calorias, recuperação e estrutura do protocolo.
          </p>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <div className="flex items-center gap-2">
          <ScanLine className="h-4 w-4 text-cyan-300" />
          <h3 className="text-[18px] font-semibold">Autoavaliação de biotipo</h3>
        </div>

        <p className="mt-1 text-[13px] text-white/50">
          Referência prática para individualizar sua estratégia corporal.
        </p>

        <div className="mt-5 grid grid-cols-2 gap-4">
          {cards.slice(0, 2).map((card) => {
            const active = local.biotipo === card.id;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => updateValue({ biotipo: card.id })}
                className={[
                  "group relative overflow-hidden rounded-[22px] border transition-all duration-300",
                  active
                    ? "border-white/30 scale-[1.03]"
                    : "border-white/10 hover:border-white/20 hover:scale-[1.02]",
                ].join(" ")}
                style={{
                  boxShadow: active ? `0 0 35px ${card.glow}` : undefined,
                }}
              >
                <img
                  src={card.img}
                  alt={card.title}
                  className="h-[170px] w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                <div
                  className={[
                    "absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border transition-all",
                    active
                      ? "border-emerald-400 bg-emerald-400 text-black"
                      : "border-white/30 bg-black/40",
                  ].join(" ")}
                >
                  {active ? <span className="text-[12px] font-bold">✓</span> : null}
                </div>

                <div className="absolute bottom-0 left-0 p-4 text-left">
                  <div className="text-[16px] font-semibold">{card.title}</div>
                  <div className="text-[12px] text-white/60">{card.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex justify-center">
          {cards.slice(2).map((card) => {
            const active = local.biotipo === card.id;

            return (
              <button
                key={card.id}
                type="button"
                onClick={() => updateValue({ biotipo: card.id })}
                className={[
                  "group relative w-full max-w-[320px] overflow-hidden rounded-[22px] border transition-all duration-300",
                  active
                    ? "border-white/30 scale-[1.03]"
                    : "border-white/10 hover:border-white/20 hover:scale-[1.02]",
                ].join(" ")}
                style={{
                  boxShadow: active ? `0 0 35px ${card.glow}` : undefined,
                }}
              >
                <img
                  src={card.img}
                  alt={card.title}
                  className="h-[170px] w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                <div
                  className={[
                    "absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full border transition-all",
                    active
                      ? "border-emerald-400 bg-emerald-400 text-black"
                      : "border-white/30 bg-black/40",
                  ].join(" ")}
                >
                  {active ? <span className="text-[12px] font-bold">✓</span> : null}
                </div>

                <div className="absolute bottom-0 left-0 p-4 text-left">
                  <div className="text-[16px] font-semibold">{card.title}</div>
                  <div className="text-[12px] text-white/60">{card.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <p className="mt-5 text-[12px] text-white/40">
          Essa leitura não é absoluta, mas ajuda o motor a calibrar seu ponto de partida.
        </p>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-cyan-300" />
          <h3 className="text-[18px] font-semibold">Método avaliativo</h3>
        </div>

        <p className="mt-1 text-[13px] text-white/50">
          Escolha como sua composição corporal será estimada nesta etapa.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {METODO_OPTIONS.map((item) => {
            const active = local.metodoAvaliativo === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => updateValue({ metodoAvaliativo: item.key })}
                className={[
                  "rounded-[20px] border p-4 text-left transition-all",
                  active
                    ? "border-cyan-400/35 bg-cyan-400/10 shadow-[0_0_24px_rgba(0,183,255,0.12)]"
                    : "border-white/10 bg-black/20 hover:bg-white/[0.04] hover:border-white/20",
                ].join(" ")}
              >
                <div className="text-[16px] font-semibold text-white">{item.label}</div>
                <div className="mt-1 text-[12px] leading-5 text-white/48">{item.desc}</div>
              </button>
            );
          })}
        </div>

        {showBioimpedancia ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MetricInput
              label="Percentual de gordura"
              value={local.percentualGordura ?? ""}
              onChange={(v) => updateValue({ percentualGordura: v })}
              placeholder="Ex: 18"
              unit="%"
            />
            <MetricInput
              label="Massa magra"
              value={local.massaMagra ?? ""}
              onChange={(v) => updateValue({ massaMagra: v })}
              placeholder="Ex: 62"
              unit="kg"
            />
          </div>
        ) : null}

        {showDobras ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricInput
              label="Dobra tríceps"
              value={local.dobraTriceps ?? ""}
              onChange={(v) => updateValue({ dobraTriceps: v })}
              placeholder="Ex: 12"
              unit="mm"
            />
            <MetricInput
              label="Dobra abdômen"
              value={local.dobraAbdomen ?? ""}
              onChange={(v) => updateValue({ dobraAbdomen: v })}
              placeholder="Ex: 18"
              unit="mm"
            />
            <MetricInput
              label="Dobra coxa"
              value={local.dobraCoxa ?? ""}
              onChange={(v) => updateValue({ dobraCoxa: v })}
              placeholder="Ex: 20"
              unit="mm"
            />
          </div>
        ) : null}

        {showMedidas ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricInput
              label="Cintura"
              value={local.cintura ?? ""}
              onChange={(v) => updateValue({ cintura: v })}
              placeholder="Ex: 82"
              unit="cm"
            />
            <MetricInput
              label="Pescoço"
              value={local.pescoco ?? ""}
              onChange={(v) => updateValue({ pescoco: v })}
              placeholder="Ex: 36"
              unit="cm"
            />
            <MetricInput
              label="Quadril"
              value={local.quadril ?? ""}
              onChange={(v) => updateValue({ quadril: v })}
              placeholder="Ex: 98"
              unit="cm"
            />
          </div>
        ) : null}

        {showVisual ? (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MetricInput
              label="Percentual de gordura estimado"
              value={local.percentualGordura ?? ""}
              onChange={(v) => updateValue({ percentualGordura: v })}
              placeholder="Ex: 20"
              unit="%"
            />

            <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 flex items-center">
              <p className="text-[13px] leading-5 text-white/48">
                Use uma estimativa aproximada. O app pode recalibrar depois com dados mais precisos.
              </p>
            </div>
          </div>
        ) : null}
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <div className="flex items-center gap-2">
          <Weight className="h-4 w-4 text-cyan-300" />
          <h3 className="text-[18px] font-semibold">Base antropométrica</h3>
        </div>

        <p className="mt-1 text-[13px] text-white/50">
          Peso e altura vêm do Step 1 e permanecem como base para os próximos cálculos.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-white/35">
              <Weight className="h-3.5 w-3.5" />
              Peso
            </div>
            <div className="text-[20px] font-semibold text-white">
              {pesoFromStep1 || "—"}
            </div>
            <div className="mt-1 text-[12px] text-white/35">kg</div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-black/20 p-4">
            <div className="mb-2 flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-white/35">
              <Ruler className="h-3.5 w-3.5" />
              Altura
            </div>
            <div className="text-[20px] font-semibold text-white">
              {alturaFromStep1 || "—"}
            </div>
            <div className="mt-1 text-[12px] text-white/35">cm</div>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-300" />
          <h3 className="text-[18px] font-semibold">Atividade física semanal</h3>
        </div>

        <p className="mt-1 text-[13px] text-white/50">
          Isso ajuda a calibrar melhor seu gasto energético total diário.
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ACTIVITY_OPTIONS.map((item) => {
            const active = local.atividadeHabitual === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => updateValue({ atividadeHabitual: item.key })}
                className={[
                  "rounded-[20px] border p-4 text-left transition-all",
                  active
                    ? "border-cyan-400/35 bg-cyan-400/10 shadow-[0_0_24px_rgba(0,183,255,0.12)]"
                    : "border-white/10 bg-black/20 hover:bg-white/[0.04] hover:border-white/20",
                ].join(" ")}
              >
                <div className="text-[16px] font-semibold text-white">{item.label}</div>
                <div className="mt-1 text-[12px] leading-5 text-white/48">{item.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex gap-3 pt-1">
        {onBack ? (
          <Button
            onClick={onBack}
            variant="outline"
            className="h-14 w-[120px] rounded-[20px] border-white/15 bg-black/20 text-white hover:bg-white/5"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        ) : null}

        <Button
          disabled={!canContinue}
          onClick={onNext}
          variant="ghost"
          className="h-14 flex-1 overflow-hidden rounded-[20px] border-0 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] transition-all hover:brightness-110 hover:bg-transparent disabled:opacity-50"
        >
          Continuar
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
