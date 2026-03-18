import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { ChevronLeft, ChevronRight, Flame, Scale, Gauge, ActivitySquare } from "lucide-react";

type Props = {
  value?: any;
  onChange?: (v: any) => void;
  onNext?: () => void;
  onBack?: () => void;
};

function getFaixaIMC(imc: number) {
  if (imc < 18.5) return "baixo peso";
  if (imc < 25) return "normal";
  if (imc < 30) return "elevado";
  if (imc < 35) return "obesidade I";
  if (imc < 40) return "obesidade II";
  return "obesidade III";
}

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

function loadDraftStep2() {
  try {
    const raw = localStorage.getItem("mf:onboarding:draft:v1");
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed?.step2 ?? {};
  } catch {
    return {};
  }
}

function toNumber(value: unknown) {
  const n = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export default function Step3Metabolismo({
  value,
  onChange,
  onNext,
  onBack,
}: Props) {
  const { state } = useDrMindSetfit();

  const perfil = state?.perfil ?? {};
  const avaliacao = state?.avaliacao ?? {};
  const step1Draft = loadDraftStep1();
  const step2Draft = loadDraftStep2();

  const peso = useMemo(() => {
    return (
      toNumber((step1Draft as any)?.peso) ||
      toNumber((step1Draft as any)?.pesoAtual) ||
      toNumber((perfil as any)?.pesoAtual) ||
      toNumber((perfil as any)?.peso) ||
      toNumber((avaliacao as any)?.peso) ||
      toNumber((avaliacao as any)?.pesoAtual) ||
      toNumber(step2Draft?.peso) ||
      0
    );
  }, [step1Draft, perfil, avaliacao, step2Draft]);

  const altura = useMemo(() => {
    return (
      toNumber((step1Draft as any)?.altura) ||
      toNumber((perfil as any)?.altura) ||
      toNumber((avaliacao as any)?.altura) ||
      toNumber(step2Draft?.altura) ||
      0
    );
  }, [step1Draft, perfil, avaliacao, step2Draft]);

  const cintura = useMemo(() => {
    return toNumber(step2Draft?.cintura) || 0;
  }, [step2Draft]);

  const sexo = String(
    (perfil as any)?.sexo ??
      (step1Draft as any)?.sexo ??
      "masculino"
  ).toLowerCase();

  const idade = toNumber(
    (perfil as any)?.idade ??
      (step1Draft as any)?.idade ??
      30
  );

  const imc =
    peso > 0 && altura > 0
      ? Number((peso / Math.pow(altura / 100, 2)).toFixed(1))
      : null;

  const tmb =
    peso > 0 && altura > 0
      ? sexo === "masculino"
        ? 10 * peso + 6.25 * altura - 5 * idade + 5
        : 10 * peso + 6.25 * altura - 5 * idade - 161
      : 0;

  const atividade = String(step2Draft?.atividadeHabitual ?? "").toLowerCase();
  const fatorAtividade =
    atividade === "alto" ? 1.55 : atividade === "moderado" ? 1.4 : 1.3;

  const metaCalorica = tmb > 0 ? Math.round(tmb * fatorAtividade) : 0;

  useOnboardingDraftSaver(
    {
      step3: {
        peso,
        altura,
        cintura,
        imc,
        tmb: Math.round(tmb || 0),
        metaCalorica,
      },
      step3Metabolismo: {
        peso,
        altura,
        cintura,
        imc,
        tmb: Math.round(tmb || 0),
        metaCalorica,
      },
    } as any,
    400
  );

  useEffect(() => {
    onChange?.({
      ...(value ?? {}),
      peso,
      altura,
      cintura,
      imc,
      tmb: Math.round(tmb || 0),
      metaCalorica,
    });
  }, [peso, altura, cintura, imc, tmb, metaCalorica, onChange, value]);

  return (
    <div className="w-full text-white space-y-6">
      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <h2 className="text-[22px] font-semibold tracking-tight">
          Metabolismo calibrado
        </h2>

        <p className="mt-1 text-[13px] leading-5 text-white/50">
          Base científica para estimar suas calorias diárias e estruturar o plano.
        </p>

        <div className="mt-4 rounded-[20px] border border-white/10 bg-[linear-gradient(180deg,rgba(20,30,56,0.55),rgba(8,10,18,0.9))] p-4">
          <div className="text-[12px] uppercase tracking-[0.18em] text-white/35">
            Interpretação inteligente
          </div>
          <p className="mt-2 text-[14px] leading-6 text-white/72">
            O app cruza peso, altura, rotina e nível de atividade para gerar uma base
            metabólica mais coerente com sua realidade.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-[22px] border border-white/10 bg-black/30 p-5">
          <div className="flex items-center gap-2 text-[12px] text-white/45">
            <Gauge className="h-4 w-4 text-cyan-300" />
            TMB (repouso)
          </div>

          <div className="mt-2 text-[30px] font-semibold text-cyan-300">
            {tmb > 0 ? Math.round(tmb) : "—"}
          </div>

          <div className="text-[12px] text-white/40">kcal</div>
        </div>

        <div className="rounded-[22px] border border-emerald-400/30 bg-emerald-400/10 p-5 shadow-[0_0_25px_rgba(34,197,94,0.15)]">
          <div className="flex items-center gap-2 text-[12px] text-white/45">
            <Flame className="h-4 w-4 text-emerald-300" />
            Meta diária estimada
          </div>

          <div className="mt-2 text-[30px] font-semibold text-emerald-300">
            {metaCalorica > 0 ? metaCalorica : "—"}
          </div>

          <div className="text-[12px] text-white/40">kcal</div>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-cyan-300" />
          <h3 className="text-[18px] font-semibold">Base antropométrica</h3>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-center">
            <div className="text-[22px] font-semibold text-white">{peso || "—"}</div>
            <div className="text-[12px] text-white/50">Peso (kg)</div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-center">
            <div className="text-[22px] font-semibold text-white">{altura || "—"}</div>
            <div className="text-[12px] text-white/50">Altura (cm)</div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-center">
            <div className="text-[22px] font-semibold text-white">
              {imc != null ? imc.toFixed(1) : "—"}
            </div>
            <div className="text-[12px] text-white/50">IMC</div>
          </div>

          <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-center">
            <div className="text-[22px] font-semibold text-white">
              {cintura > 0 ? cintura : "—"}
            </div>
            <div className="text-[12px] text-white/50">Cintura (cm)</div>
          </div>
        </div>

        <div className="mt-5 h-2 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-yellow-400"
            style={{
              width: imc ? `${Math.min(imc * 3, 100)}%` : "0%",
            }}
          />
        </div>

        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-[12px] text-white/40">
          <span>
            Atividade: {step2Draft?.atividadeHabitual ? String(step2Draft.atividadeHabitual) : "—"}
          </span>
          <span>Indicador geral ({imc ? getFaixaIMC(imc) : "—"})</span>
        </div>
      </section>

      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 sm:p-6 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
        <div className="flex items-center gap-2">
          <ActivitySquare className="h-4 w-4 text-cyan-300" />
          <h3 className="text-[18px] font-semibold">Leitura inicial</h3>
        </div>

        <div className="mt-4 space-y-3">
          <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-[13px] leading-6 text-white/72">
            Sua taxa metabólica basal representa a energia mínima que o corpo precisa em
            repouso. A meta diária usa esse valor como base para calibrar alimentação e
            evolução.
          </div>

          <div className="rounded-[18px] border border-cyan-300/15 bg-cyan-400/10 p-4 text-[13px] leading-6 text-cyan-100/90">
            Essa estimativa ainda será refinada pelo seu objetivo, rotina de treino,
            aderência e evolução dentro do app.
          </div>
        </div>
      </section>

      <div className="flex gap-3 pt-1">
        {onBack ? (
          <Button
            variant="outline"
            onClick={onBack}
            className="h-14 w-[120px] rounded-[20px] border border-white/15 bg-black/20 text-white hover:bg-white/5"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        ) : null}

        <Button
          onClick={() => onNext?.()}
          variant="ghost"
          className="h-14 flex-1 overflow-hidden rounded-[20px] border-0 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] transition-all hover:brightness-110 hover:bg-transparent"
        >
          Continuar
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}