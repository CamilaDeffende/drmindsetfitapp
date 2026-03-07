// MF_ONBOARDING_CONTRACT_V1
// REGRA_FIXA_NO_HEALTH_CONTEXT_STEP: nunca criar etapa de Segurança/Contexto de saúde/Sinais do corpo.
// PREMIUM_REFINEMENT_PHASE3_STEP2_UI_V1

import { GlobalProfilePicker } from "@/features/global-profile/ui/GlobalProfilePicker";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import type { AvaliacaoFisica, MetodoComposicao } from "@/types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveOnboardingProgress } from "@/lib/onboardingProgress";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { useOnboardingStore } from "@/store/onboarding/onboardingStore";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

type OnboardingStepProps = {
  value?: any;
  onChange?: (v: any) => void;
  onNext?: () => void;
  onBack?: () => void;
};

const avaliacaoSchema = z
  .object({
    peso: z.coerce.number().min(30).max(300),
    altura: z.coerce.number().min(100).max(250),

    metodoComposicao: z.enum(["bioimpedancia", "pollock7", "nenhum"]),

    frequenciaAtividadeSemanal: z.enum([
      "sedentario",
      "moderadamente_ativo",
      "ativo",
      "muito_ativo",
    ]),
    biotipo: z.enum(["ectomorfo", "mesomorfo", "endomorfo"]),

    cintura: z.coerce.number().optional().or(z.literal("")),
    quadril: z.coerce.number().optional().or(z.literal("")),
    abdomen: z.coerce.number().optional().or(z.literal("")),
    torax: z.coerce.number().optional().or(z.literal("")),
    gluteo: z.coerce.number().optional().or(z.literal("")),

    peitoral: z.coerce.number().optional().or(z.literal("")),
    axilarMedia: z.coerce.number().optional().or(z.literal("")),
    triceps: z.coerce.number().optional().or(z.literal("")),
    subescapular: z.coerce.number().optional().or(z.literal("")),
    abdominal: z.coerce.number().optional().or(z.literal("")),
    supraIliaca: z.coerce.number().optional().or(z.literal("")),
    coxa: z.coerce.number().optional().or(z.literal("")),

    bioPercentualGordura: z.coerce.number().optional().or(z.literal("")),
    bioPercentualMassaMagra: z.coerce.number().optional().or(z.literal("")),
    bioAguaCorporal: z.coerce.number().optional().or(z.literal("")),
    bioIdadeMetabolica: z.coerce.number().optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const metodo = String(data.metodoComposicao ?? "").toLowerCase();
    const isPollock = metodo.includes("pollock");
    const isBio = metodo.includes("bio");

    const req = (key: keyof typeof data, label: string) => {
      const v = (data as any)[key];
      const bad =
        v === undefined ||
        v === null ||
        v === "" ||
        (typeof v === "number" && Number.isNaN(v));

      if (bad) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${label} é obrigatório.`,
        });
      }
    };

    if (isPollock) {
      req("peitoral", "Dobra Peitoral");
      req("axilarMedia", "Dobra Axilar média");
      req("triceps", "Dobra Tríceps");
      req("subescapular", "Dobra Subescapular");
      req("abdominal", "Dobra Abdominal");
      req("supraIliaca", "Dobra Supra-ilíaca");
      req("coxa", "Dobra Coxa");
    }

    if (isBio) {
      req("bioPercentualGordura", "% Gordura (Bioimpedância)");
      req("bioPercentualMassaMagra", "% Massa magra (Bioimpedância)");
    }
  });

type AvaliacaoFormData = z.infer<typeof avaliacaoSchema>;

const biotipos = [
  {
    key: "ectomorfo",
    label: "Ectomorfo",
    desc: "Tende a perder peso com facilidade.",
  },
  {
    key: "mesomorfo",
    label: "Mesomorfo",
    desc: "Atlético • ganha massa com mais facilidade.",
  },
  {
    key: "endomorfo",
    label: "Endomorfo",
    desc: "Tende a ganhar/reter peso com facilidade.",
  },
] as const;

export function Step2Avaliacao({
  value,
  onChange,
  onNext,
  onBack,
}: OnboardingStepProps) {
  void value;
  void onChange;

  const draftSSOT = useOnboardingStore((st) => st.draft) as Record<string, any>;
  const { state, updateState, nextStep } = useDrMindSetfit();
  const navigate = useNavigate();

  const [mfInvalidMsg, setMfInvalidMsg] = useState<string | null>(null);

  const form = useForm<AvaliacaoFormData>({
    resolver: zodResolver(avaliacaoSchema),
    defaultValues: {
      ...(draftSSOT as any),

      peso:
        state.perfil?.pesoAtual ??
        state.avaliacao?.peso ??
        (draftSSOT as any)?.peso ??
        undefined,

      altura:
        state.perfil?.altura ??
        state.avaliacao?.altura ??
        (draftSSOT as any)?.altura ??
        undefined,

      metodoComposicao: (draftSSOT as any)?.metodoComposicao ?? "nenhum",

      frequenciaAtividadeSemanal:
        (draftSSOT as any)?.frequenciaAtividadeSemanal ??
        state.avaliacao?.frequenciaAtividadeSemanal ??
        "moderadamente_ativo",

      biotipo:
        (draftSSOT as any)?.biotipo ??
        state.avaliacao?.biotipo ??
        "mesomorfo",

      cintura: (draftSSOT as any)?.cintura ?? "",
      quadril: (draftSSOT as any)?.quadril ?? "",
      abdomen: (draftSSOT as any)?.abdomen ?? "",
      torax: (draftSSOT as any)?.torax ?? "",
      gluteo: (draftSSOT as any)?.gluteo ?? "",
      peitoral: (draftSSOT as any)?.peitoral ?? "",
      axilarMedia: (draftSSOT as any)?.axilarMedia ?? "",
      triceps: (draftSSOT as any)?.triceps ?? "",
      subescapular: (draftSSOT as any)?.subescapular ?? "",
      abdominal: (draftSSOT as any)?.abdominal ?? "",
      supraIliaca: (draftSSOT as any)?.supraIliaca ?? "",
      coxa: (draftSSOT as any)?.coxa ?? "",
      bioPercentualGordura: (draftSSOT as any)?.bioPercentualGordura ?? "",
      bioPercentualMassaMagra: (draftSSOT as any)?.bioPercentualMassaMagra ?? "",
      bioAguaCorporal: (draftSSOT as any)?.bioAguaCorporal ?? "",
      bioIdadeMetabolica: (draftSSOT as any)?.bioIdadeMetabolica ?? "",
    },
  });

  const _watchAll = form.watch();
  const metodoSelecionado = (form.watch("metodoComposicao") || "nenhum") as MetodoComposicao;
  const biotipoAtual = form.watch("biotipo");

  useOnboardingDraftSaver(
    {
      step2: _watchAll as any,
    },
    400
  );

  const calcularIMCValor = (pesoVal: any, alturaVal: any) => {
    const p = Number(pesoVal);
    const a = Number(alturaVal);
    if (!p || !a) return null;
    const v = p / Math.pow(a / 100, 2);
    return Number(v.toFixed(1));
  };

  const calcularPollock7 = (data: AvaliacaoFormData, sexo: string) => {
    if (
      !data.peitoral ||
      !data.axilarMedia ||
      !data.triceps ||
      !data.subescapular ||
      !data.abdominal ||
      !data.supraIliaca ||
      !data.coxa
    ) {
      return null;
    }

    const somaDobras =
      Number(data.peitoral) +
      Number(data.axilarMedia) +
      Number(data.triceps) +
      Number(data.subescapular) +
      Number(data.abdominal) +
      Number(data.supraIliaca) +
      Number(data.coxa);

    let densidadeCorporal: number;
    let percentualGordura = 0;

    if (sexo === "masculino") {
      densidadeCorporal =
        1.112 -
        0.00043499 * somaDobras +
        0.00000055 * Math.pow(somaDobras, 2) -
        0.00028826 * (state.perfil?.idade || 30);
    } else {
      densidadeCorporal =
        1.097 -
        0.00046971 * somaDobras +
        0.00000056 * Math.pow(somaDobras, 2) -
        0.00012828 * (state.perfil?.idade || 30);
    }

    percentualGordura = ((4.95 / densidadeCorporal) - 4.5) * 100;

    return {
      densidadeCorporal: Number(densidadeCorporal.toFixed(4)),
      percentualGordura: Number(percentualGordura.toFixed(1)),
      percentualMassaMagra: Number((100 - percentualGordura).toFixed(1)),
    };
  };

  const onSubmit = (data: AvaliacaoFormData) => {
    try {
      setMfInvalidMsg(null);
    } catch {}

    try {
      saveOnboardingProgress({ step: 2, data: { step2: data } });
    } catch (e) {
      console.warn("[Step2Avaliacao] erro ao salvar progresso:", e);
    }

    const imcNumber = calcularIMCValor(data.peso, data.altura);

    const avaliacao: AvaliacaoFisica = {
      frequenciaAtividadeSemanal: data.frequenciaAtividadeSemanal,
      peso: data.peso,
      altura: data.altura,
      imc: imcNumber ?? 0,
      circunferencias: {
        cintura: data.cintura ? Number(data.cintura) : undefined,
        quadril: data.quadril ? Number(data.quadril) : undefined,
        abdomen: data.abdomen ? Number(data.abdomen) : undefined,
        torax: data.torax ? Number(data.torax) : undefined,
        gluteo: data.gluteo ? Number(data.gluteo) : undefined,
      },
      composicao: {
        metodo: data.metodoComposicao,
      },
      biotipo: data.biotipo,
    } as any;

    if (data.metodoComposicao === "pollock7") {
      const resultado = calcularPollock7(data, state.perfil?.sexo || "masculino");
      if (resultado) {
        avaliacao.composicao.pollock7 = {
          peitoral: Number(data.peitoral),
          axilarMedia: Number(data.axilarMedia),
          triceps: Number(data.triceps),
          subescapular: Number(data.subescapular),
          abdominal: Number(data.abdominal),
          supraIliaca: Number(data.supraIliaca),
          coxa: Number(data.coxa),
        };
        avaliacao.composicao.densidadeCorporal = resultado.densidadeCorporal;
        avaliacao.composicao.percentualGordura = resultado.percentualGordura;
        avaliacao.composicao.percentualMassaMagra = resultado.percentualMassaMagra;
      }
    } else if (data.metodoComposicao === "bioimpedancia") {
      if (data.bioPercentualGordura && data.bioPercentualMassaMagra) {
        avaliacao.composicao.bioimpedancia = {
          percentualGordura: Number(data.bioPercentualGordura),
          percentualMassaMagra: Number(data.bioPercentualMassaMagra),
          aguaCorporal: data.bioAguaCorporal ? Number(data.bioAguaCorporal) : 0,
          idadeMetabolica: data.bioIdadeMetabolica ? Number(data.bioIdadeMetabolica) : 0,
        };
        avaliacao.composicao.percentualGordura = Number(data.bioPercentualGordura);
        avaliacao.composicao.percentualMassaMagra = Number(data.bioPercentualMassaMagra);
      }
    }

    updateState({ avaliacao });

    try {
      if (typeof onNext === "function") {
        onNext();
      } else {
        try {
          navigate("/onboarding/step-3", { replace: true });
        } catch {
          try {
            if (typeof nextStep === "function") nextStep();
          } catch {}
        }
      }
    } catch (e) {
      console.error("[Step2Avaliacao] erro ao avançar:", e);
    }
  };

  const peso = form.watch("peso");
  const altura = form.watch("altura");
  const imcDisplay = (() => {
    const v = calcularIMCValor(peso, altura);
    return v == null ? "--" : v.toFixed(1);
  })();

  return (
    <div className="w-full text-white" data-testid="mf-step-root">
      <div className="mb-5">
        <GlobalProfilePicker title="Localização, fuso e unidades" />
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, (errors) => {
            console.warn("[Step2Avaliacao] invalid:", errors);
            try {
              setMfInvalidMsg("Revise os campos obrigatórios antes de continuar.");
            } catch {}
          })}
          className="space-y-6"
        >
          {mfInvalidMsg && (
            <Alert className="border-red-500/20 bg-red-500/10 text-white">
              <AlertTitle>Não foi possível avançar</AlertTitle>
              <AlertDescription>{mfInvalidMsg}</AlertDescription>
            </Alert>
          )}

          {/* BLOCO 1 */}
          <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
            <div className="mb-4">
              <h3 className="text-[22px] font-semibold tracking-tight text-white">
                Atividade física semanal
              </h3>
              <p className="mt-1 text-[13px] leading-5 text-white/48">
                Esse dado ajuda a calibrar seu gasto energético total diário.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="frequenciaAtividadeSemanal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] text-white/80">
                      Como está sua rotina geral?
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-black/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sedentario">Sedentário</SelectItem>
                        <SelectItem value="moderadamente_ativo">
                          Moderadamente ativo (1–3x/sem)
                        </SelectItem>
                        <SelectItem value="ativo">Ativo (3–5x/sem)</SelectItem>
                        <SelectItem value="muito_ativo">Muito ativo (+5x/sem)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-white/40">
                      Não conta só treino. Considera sua rotina, trabalho e movimentação diária.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          {/* BLOCO 2 */}
          <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
            <div className="mb-4">
              <h3 className="text-[22px] font-semibold tracking-tight text-white">
                Autoavaliação de biotipo
              </h3>
              <p className="mt-1 text-[13px] leading-5 text-white/48">
                Referência prática para individualizar calorias.
              </p>
            </div>

            <FormField
              control={form.control}
              name="biotipo"
              render={({ field }) => (
                <FormItem>
                  <div className="space-y-3">
                    {biotipos.map((item) => {
                      const active = biotipoAtual === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => field.onChange(item.key)}
                          className={[
                            "w-full rounded-[20px] border px-4 py-3 text-left transition-all",
                            active
                              ? "border-emerald-400/40 bg-emerald-400/10 shadow-[0_0_24px_rgba(34,197,94,0.08)]"
                              : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                          ].join(" ")}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={[
                                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                                active
                                  ? "border-emerald-400 bg-emerald-400 text-black"
                                  : "border-white/20 bg-transparent text-transparent",
                              ].join(" ")}
                            >
                              <Check className="h-3 w-3" />
                            </div>

                            <div className="min-w-0">
                              <div className="text-[15px] font-semibold text-white">
                                {item.label}
                              </div>
                              <div className="mt-1 text-[12px] leading-5 text-white/50">
                                {item.desc}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 text-[12px] leading-5 text-white/45">
                    {biotipoAtual === "ectomorfo" && (
                      <>Ectomorfo recebe ajuste automático de calorias para manter sustentabilidade do plano.</>
                    )}
                    {biotipoAtual === "mesomorfo" && (
                      <>Mesomorfo recebe distribuição equilibrada entre ganho de massa e controle de gordura.</>
                    )}
                    {biotipoAtual === "endomorfo" && (
                      <>Endomorfo recebe foco extra em controle calórico e preservação de massa magra.</>
                    )}
                  </div>

                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          {/* BLOCO 3 */}
          <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
            <div className="mb-4">
              <h3 className="text-[22px] font-semibold tracking-tight text-white">
                Base antropométrica
              </h3>
              <p className="mt-1 text-[13px] leading-5 text-white/48">
                Peso e altura para cálculo de IMC e estimativas metabólicas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="peso"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] text-white/80">Peso (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        {...field}
                        className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/28 focus-visible:ring-1 focus-visible:ring-[#28C7FF] focus-visible:border-[#28C7FF]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="altura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[13px] text-white/80">Altura (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/28 focus-visible:ring-1 focus-visible:ring-[#28C7FF] focus-visible:border-[#28C7FF]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="rounded-[20px] border border-white/10 bg-black/20 px-4 py-3 flex flex-col justify-center">
                <div className="text-[12px] text-white/45">IMC</div>
                <div className="mt-1 text-[28px] font-semibold text-white">{imcDisplay}</div>
                <div className="mt-1 text-[11px] text-white/35">
                  Indicador geral, sem definir composição corporal.
                </div>
              </div>
            </div>
          </section>

          {/* BLOCO 4 */}
          <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
            <div className="mb-4">
              <h3 className="text-[22px] font-semibold tracking-tight text-white">
                Circunferências
              </h3>
              <p className="mt-1 text-[13px] leading-5 text-white/48">
                Opcional. Útil para acompanhar evolução de medidas.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["cintura", "Cintura (cm)"],
                ["quadril", "Quadril (cm)"],
                ["abdomen", "Abdômen (cm)"],
                ["torax", "Tórax (cm)"],
                ["gluteo", "Glúteo (cm)"],
              ].map(([name, label]) => (
                <FormField
                  key={name}
                  control={form.control}
                  name={name as keyof AvaliacaoFormData}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[13px] text-white/80">{label}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="h-12 rounded-2xl border-white/10 bg-black/20 text-white placeholder:text-white/28 focus-visible:ring-1 focus-visible:ring-[#28C7FF] focus-visible:border-[#28C7FF]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>
          </section>

          {/* BLOCO 5 */}
          <section className="rounded-[24px] border border-white/10 bg-[rgba(8,10,18,0.82)] p-4 sm:p-5 shadow-[0_0_32px_rgba(0,149,255,0.06)]">
            <div className="mb-4">
              <h3 className="text-[22px] font-semibold tracking-tight text-white">
                Composição corporal
              </h3>
              <p className="mt-1 text-[13px] leading-5 text-white/48">
                Opcional. Use se tiver avaliação recente por bioimpedância ou dobras.
              </p>
            </div>

            <FormField
              control={form.control}
              name="metodoComposicao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-[13px] text-white/80">Método utilizado</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-black/20 text-white">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nenhum">Não tenho avaliação</SelectItem>
                      <SelectItem value="bioimpedancia">Bioimpedância</SelectItem>
                      <SelectItem value="pollock7">Dobras cutâneas (Pollock 7)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-white/40">
                    Se não tiver agora, escolha “Não tenho avaliação” e siga adiante.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {metodoSelecionado === "bioimpedancia" && (
              <div className="mt-4 space-y-3 rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="text-[14px] font-semibold text-white">Dados da bioimpedância</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ["bioPercentualGordura", "% Gordura"],
                    ["bioPercentualMassaMagra", "% Massa magra"],
                    ["bioAguaCorporal", "% Água corporal (opcional)"],
                    ["bioIdadeMetabolica", "Idade metabólica (opcional)"],
                  ].map(([name, label]) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name as keyof AvaliacaoFormData}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[13px] text-white/80">{label}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.1"
                              {...field}
                              className="h-12 rounded-2xl border-white/10 bg-[rgba(255,255,255,0.02)] text-white placeholder:text-white/28 focus-visible:ring-1 focus-visible:ring-[#28C7FF] focus-visible:border-[#28C7FF]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              </div>
            )}

            {metodoSelecionado === "pollock7" && (
              <div className="mt-4 space-y-3 rounded-[20px] border border-white/10 bg-black/20 p-4">
                <div className="text-[14px] font-semibold text-white">Dobras cutâneas (Pollock 7)</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    ["peitoral", "Peitoral (mm)"],
                    ["axilarMedia", "Axilar média (mm)"],
                    ["triceps", "Tríceps (mm)"],
                    ["subescapular", "Subescapular (mm)"],
                    ["abdominal", "Abdominal (mm)"],
                    ["supraIliaca", "Supra-ilíaca (mm)"],
                    ["coxa", "Coxa (mm)"],
                  ].map(([name, label]) => (
                    <FormField
                      key={name}
                      control={form.control}
                      name={name as keyof AvaliacaoFormData}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[13px] text-white/80">{label}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              className="h-12 rounded-2xl border-white/10 bg-[rgba(255,255,255,0.02)] text-white placeholder:text-white/28 focus-visible:ring-1 focus-visible:ring-[#28C7FF] focus-visible:border-[#28C7FF]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-white/38">
                  Use a mesma avaliação (mesmo avaliador / adipômetro) para comparar evolução.
                </p>
              </div>
            )}
          </section>

          {/* CTA LOCAL */}
          <div className="pt-1 flex gap-3">
            {onBack && (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="h-14 w-[120px] rounded-[20px] border border-white/15 bg-black/20 text-white hover:bg-white/5"
              >
                Voltar
              </Button>
            )}

            <Button
              type="submit"
              className="h-14 flex-1 rounded-[20px] border border-cyan-300/20 bg-gradient-to-r from-[#193B72] via-[#255AA8] to-[#7FE9D6] text-[15px] font-semibold text-white shadow-[0_10px_30px_rgba(0,149,255,0.18)] transition-all hover:brightness-110"
            >
              Continuar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}