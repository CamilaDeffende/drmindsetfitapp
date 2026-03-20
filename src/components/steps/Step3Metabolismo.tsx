// MF_ONBOARDING_CONTRACT_V1
// PREMIUM_REFINEMENT_PHASE3_STEP3_UI_V2
// FIX_IMC_CALCULATION_V1

import { Button } from "@/components/ui/button";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

export default function Step3Metabolismo({
  onNext,
  onBack,
}: Props) {
  const { state } = useDrMindSetfit();

  const perfil = state?.perfil ?? {};
  const avaliacao = state?.avaliacao ?? {};

  useOnboardingDraftSaver(
    {
      peso: (avaliacao as any)?.peso ?? "",
      altura: (avaliacao as any)?.altura ?? "",
    },
    400
  );

  // =========================
  // PESO / ALTURA
  // =========================

  const pesoRaw =
    (avaliacao as any)?.peso ??
    (avaliacao as any)?.pesoAtual ??
    (perfil as any)?.pesoAtual ??
    (perfil as any)?.peso ??
    0;

  const alturaRaw =
    (avaliacao as any)?.altura ??
    (perfil as any)?.altura ??
    0;

  const peso = Number(String(pesoRaw).replace(",", "."));
  const altura = Number(String(alturaRaw).replace(",", "."));

  // =========================
  // IMC
  // =========================

  const imc =
    Number.isFinite(peso) &&
    Number.isFinite(altura) &&
    peso > 0 &&
    altura > 0
      ? Number((peso / Math.pow(altura / 100, 2)).toFixed(1))
      : null;

  // =========================
  // METABOLISMO BASAL
  // =========================

  const sexo = (perfil as any)?.sexo ?? "masculino";
  const idade = Number((perfil as any)?.idade ?? 30);

  const tmb =
    sexo === "masculino"
      ? 10 * peso + 6.25 * altura - 5 * idade + 5
      : 10 * peso + 6.25 * altura - 5 * idade - 161;

  const metaCalorica = Math.round(tmb * 1.35);

  return (
    <div className="w-full text-white space-y-6">

      {/* HERO */}
      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">

        <h2 className="text-[22px] font-semibold tracking-tight">
          Metabolismo calibrado
        </h2>

        <p className="mt-1 text-[13px] text-white/50">
          Base científica para estimar calorias e ajustar o plano.
        </p>

      </section>

      {/* CARD METABÓLICO */}
      <section className="grid grid-cols-2 gap-4">

        <div className="rounded-[22px] border border-white/10 bg-black/30 p-5">
          <div className="text-white/50 text-[12px]">
            TMB (repouso)
          </div>

          <div className="mt-1 text-[28px] font-semibold text-cyan-300">
            {Math.round(tmb)}
          </div>

          <div className="text-[12px] text-white/40">
            kcal
          </div>
        </div>

        <div className="rounded-[22px] border border-emerald-400/30 bg-emerald-400/10 p-5 shadow-[0_0_25px_rgba(34,197,94,0.15)]">

          <div className="text-white/50 text-[12px]">
            Meta diária
          </div>

          <div className="mt-1 text-[28px] font-semibold text-emerald-300">
            {metaCalorica}
          </div>

          <div className="text-[12px] text-white/40">
            kcal
          </div>

        </div>

      </section>

      {/* BASE ANTROPOMÉTRICA */}
      <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">

        <h3 className="text-[18px] font-semibold">
          Base antropométrica
        </h3>

        <div className="grid grid-cols-3 gap-3 mt-4">

          <div className="rounded-[18px] border border-white/10 p-4 bg-black/20 text-center">
            <div className="text-[22px] font-semibold text-white">
              {peso || "--"}
            </div>
            <div className="text-white/50 text-[12px]">
              Peso (kg)
            </div>
          </div>

          <div className="rounded-[18px] border border-white/10 p-4 bg-black/20 text-center">
            <div className="text-[22px] font-semibold text-white">
              {altura || "--"}
            </div>
            <div className="text-white/50 text-[12px]">
              Altura (cm)
            </div>
          </div>

          <div className="rounded-[18px] border border-white/10 p-4 bg-black/20 text-center">
            <div className="text-[22px] font-semibold text-white">
              {imc != null ? imc.toFixed(1) : "--"}
            </div>
            <div className="text-white/50 text-[12px]">
              IMC
            </div>
          </div>

        </div>

        {/* BARRA */}
        <div className="mt-5 h-2 w-full rounded-full bg-white/10 overflow-hidden">

          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-yellow-400"
            style={{
              width: imc ? `${Math.min(imc * 3, 100)}%` : "0%",
            }}
          />

        </div>

        <div className="flex justify-between mt-2 text-[12px] text-white/40">

          <span>
            {(perfil as any)?.nivelTreino ?? "—"}
          </span>

          <span>
            Indicador geral ({imc ? getFaixaIMC(imc) : "—"})
          </span>

        </div>

      </section>

      {/* CTA */}
      <div className="flex gap-3 pt-2">

        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            className="h-14 w-[120px] rounded-[20px] border border-white/15 bg-black/20 text-white hover:bg-white/5"
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Voltar
          </Button>
        )}

        <Button
          onClick={() => onNext?.()}
          className="h-14 flex-1 rounded-[20px] border border-cyan-300/20 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] hover:brightness-110"
        >
          Continuar
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>

      </div>

    </div>
  );
}