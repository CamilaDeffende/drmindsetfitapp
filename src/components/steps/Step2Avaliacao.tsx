// MF_ONBOARDING_CONTRACT_V1
// REGRA_FIXA_NO_HEALTH_CONTEXT_STEP: nunca criar etapa de Segurança/Contexto de saúde/Sinais do corpo.
// PREMIUM_REFINEMENT_PHASE2_1: copy clara, validação explícita, feedback visual, sem sobrecarga cognitiva.

import { GlobalProfilePicker } from "@/features/global-profile/ui/GlobalProfilePicker";
import { useForm } from "react-hook-form";
import { BrandIcon } from "@/components/branding/BrandIcon";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useDrMindSetfit } from "@/contexts/DrMindSetfitContext";
import type { AvaliacaoFisica, MetodoComposicao } from "@/types";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveOnboardingProgress } from "@/lib/onboardingProgress";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { useOnboardingDraftSaver } from "@/store/onboarding/useOnboardingDraftSaver";
import { useOnboardingStore } from "@/store/onboarding/onboardingStore";
import { Button } from "@/components/ui/button";

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

    // Circunferências (opcionais)
    cintura: z.coerce.number().optional().or(z.literal("")),
    quadril: z.coerce.number().optional().or(z.literal("")),
    abdomen: z.coerce.number().optional().or(z.literal("")),
    torax: z.coerce.number().optional().or(z.literal("")),
    gluteo: z.coerce.number().optional().or(z.literal("")),

    // Pollock 7 Dobras (opcionais)
    peitoral: z.coerce.number().optional().or(z.literal("")),
    axilarMedia: z.coerce.number().optional().or(z.literal("")),
    triceps: z.coerce.number().optional().or(z.literal("")),
    subescapular: z.coerce.number().optional().or(z.literal("")),
    abdominal: z.coerce.number().optional().or(z.literal("")),
    supraIliaca: z.coerce.number().optional().or(z.literal("")),
    coxa: z.coerce.number().optional().or(z.literal("")),

    // Bioimpedância (opcionais)
    bioPercentualGordura: z.coerce.number().optional().or(z.literal("")),
    bioPercentualMassaMagra: z
      .coerce.number()
      .optional()
      .or(z.literal("")),
    bioAguaCorporal: z.coerce.number().optional().or(z.literal("")),
    bioIdadeMetabolica: z.coerce
      .number()
      .optional()
      .or(z.literal("")),
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
      req(
        "bioPercentualMassaMagra",
        "% Massa magra (Bioimpedância)"
      );
    }
  });

type AvaliacaoFormData = z.infer<typeof avaliacaoSchema>;

export function Step2Avaliacao({
  value,
  onChange,
  onNext,
  onBack,
}: OnboardingStepProps) {
  const draftSSOT = useOnboardingStore((st) => st.draft) as Record<
    string,
    any
  >;

  void value;
  void onChange;
  void onNext;
  void onBack;

  const { state, updateState, nextStep } = useDrMindSetfit();
  const navigate = useNavigate();

  const [mfInvalidMsg, setMfInvalidMsg] = useState<string | null>(null);

  const form = useForm<AvaliacaoFormData>({
    resolver: zodResolver(avaliacaoSchema),
    defaultValues: {
      ...(draftSSOT as any),

      // Peso/altura puxados do Step1, sem defaults 70/170
      peso:
        (draftSSOT as any)?.peso ??
        state.perfil?.pesoAtual ??
        undefined,
      altura:
        (draftSSOT as any)?.altura ??
        state.perfil?.altura ??
        undefined,

      metodoComposicao:
        (draftSSOT as any)?.metodoComposicao ?? "nenhum",

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
      bioPercentualGordura:
        (draftSSOT as any)?.bioPercentualGordura ?? "",
      bioPercentualMassaMagra:
        (draftSSOT as any)?.bioPercentualMassaMagra ?? "",
      bioAguaCorporal:
        (draftSSOT as any)?.bioAguaCorporal ?? "",
      bioIdadeMetabolica:
        (draftSSOT as any)?.bioIdadeMetabolica ?? "",
    },
  });

  const _watchAll = form.watch();
  const metodoSelecionado = (form.watch(
    "metodoComposicao"
  ) || "nenhum") as MetodoComposicao;

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
    let percentualGordura: number = 0;
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
      percentualMassaMagra: Number(
        (100 - percentualGordura).toFixed(1)
      ),
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
      const resultado = calcularPollock7(
        data,
        state.perfil?.sexo || "masculino"
      );
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
        avaliacao.composicao.densidadeCorporal =
          resultado.densidadeCorporal;
        avaliacao.composicao.percentualGordura =
          resultado.percentualGordura;
        avaliacao.composicao.percentualMassaMagra =
          resultado.percentualMassaMagra;
      }
    } else if (data.metodoComposicao === "bioimpedancia") {
      if (
        data.bioPercentualGordura &&
        data.bioPercentualMassaMagra
      ) {
        avaliacao.composicao.bioimpedancia = {
          percentualGordura: Number(data.bioPercentualGordura),
          percentualMassaMagra: Number(
            data.bioPercentualMassaMagra
          ),
          aguaCorporal: data.bioAguaCorporal
            ? Number(data.bioAguaCorporal)
            : 0,
          idadeMetabolica: data.bioIdadeMetabolica
            ? Number(data.bioIdadeMetabolica)
            : 0,
        };
        avaliacao.composicao.percentualGordura = Number(
          data.bioPercentualGordura
        );
        avaliacao.composicao.percentualMassaMagra = Number(
          data.bioPercentualMassaMagra
        );
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
    <div
      className="max-w-4xl mx-auto px-4 py-8"
      data-testid="mf-step-root"
    >
      <div className="mb-6">
        <GlobalProfilePicker title="Localização, fuso e unidades" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
          Composição corporal
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Essas medidas ajudam a estimar composição corporal e o padrão
          de distribuição de gordura. Quanto mais fiel o registro, mais
          preciso fica o seu plano (treino, dieta e metas) nas próximas
          etapas.
        </p>
      </div>

      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center">
          <BrandIcon size={64} />
        </div>
        <h2 className="text-3xl font-bold mb-2">
          Calibração corporal
        </h2>
        <p className="text-muted-foreground">
          Antropometria + composição (opcional)
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(
            onSubmit,
            (errors) => {
              console.warn("[Step2Avaliacao] invalid:", errors);
              try {
                setMfInvalidMsg(
                  "Revise os campos obrigatórios antes de continuar."
                );
              } catch {}
            }
          )}
          className="space-y-6 sm:space-y-7"
        >
          {mfInvalidMsg && (
            <Alert>
              <AlertTitle>Não foi possível avançar</AlertTitle>
              <AlertDescription>{mfInvalidMsg}</AlertDescription>
            </Alert>
          )}

          {/* Rotina geral */}
          <Card>
            <CardHeader>
              <CardTitle>Rotina geral</CardTitle>
              <CardDescription>
                Usamos isso para ajustar o fator de atividade e a
                estratégia do plano nas próximas etapas.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="frequenciaAtividadeSemanal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Atividade semanal geral</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sedentario">
                          Sedentário
                        </SelectItem>
                        <SelectItem value="moderadamente_ativo">
                          Moderadamente ativo (1–3x/sem)
                        </SelectItem>
                        <SelectItem value="ativo">
                          Ativo (3–5x/sem)
                        </SelectItem>
                        <SelectItem value="muito_ativo">
                          Muito ativo (+5x/sem)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Não é só treino. Conta também rotina, trabalho e
                      dia a dia.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Autoavaliação de biotipo – card com 3 botões */}
          <Card>
            <CardHeader>
              <CardTitle>Autoavaliação de biotipo</CardTitle>
              <CardDescription>
                Referência prática para individualizar calorias.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Qual biotipo mais se parece com você?
              </p>

              <FormField
                control={form.control}
                name="biotipo"
                render={({ field }) => {
                  const selected = field.value;

                  const baseBtn =
                    "flex flex-col items-start justify-start text-left px-4 py-3 rounded-2xl border transition-all w-full h-full";

                  const getClasses = (value: string) =>
                    baseBtn +
                    " " +
                    (selected === value
                      ? "border-sky-400 bg-sky-500/10 shadow-md"
                      : "border-white/10 bg-white/5 hover:bg-white/10");

                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Ectomorfo */}
                        <button
                          type="button"
                          className={getClasses("ectomorfo")}
                          onClick={() => field.onChange("ectomorfo")}
                        >
                          <span className="font-semibold">
                            Ectomorfo
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Tende a perder peso com facilidade.
                          </span>
                        </button>

                        {/* Mesomorfo */}
                        <button
                          type="button"
                          className={getClasses("mesomorfo")}
                          onClick={() => field.onChange("mesomorfo")}
                        >
                          <span className="font-semibold">
                            Mesomorfo
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Atlético • ganha massa com mais
                            facilidade.
                          </span>
                        </button>

                        {/* Endomorfo */}
                        <button
                          type="button"
                          className={getClasses("endomorfo")}
                          onClick={() => field.onChange("endomorfo")}
                        >
                          <span className="font-semibold">
                            Endomorfo
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Tende a ganhar/reter peso com
                            facilidade.
                          </span>
                        </button>
                      </div>

                      <div className="mt-2 text-xs text-muted-foreground">
                        {selected === "ectomorfo" && (
                          <>
                            Ectomorfo recebe ajuste automático de
                            calorias para manter sustentabilidade do
                            plano.
                          </>
                        )}
                        {selected === "mesomorfo" && (
                          <>
                            Mesomorfo recebe distribuição equilibrada
                            entre ganho de massa e controle de
                            gordura.
                          </>
                        )}
                        {selected === "endomorfo" && (
                          <>
                            Endomorfo recebe foco extra em controle
                            calórico e preservação de massa magra.
                          </>
                        )}
                        {!selected && (
                          <>
                            Escolha a opção que mais se aproxima de
                            você. É só uma referência prática, não
                            diagnóstico.
                          </>
                        )}
                      </div>

                      <FormMessage />
                    </>
                  );
                }}
              />
            </CardContent>
          </Card>

          {/* Base antropométrica */}
          <Card>
            <CardHeader>
              <CardTitle>Base antropométrica</CardTitle>
              <CardDescription>
                Peso e altura para IMC e cálculos metabólicos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="peso"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Peso (kg)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          {...field}
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
                      <FormLabel>Altura (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex flex-col justify-between">
                  <FormLabel>IMC</FormLabel>
                  <div className="h-10 flex items-center px-3 bg-muted rounded-md">
                    <span className="text-lg font-bold">
                      {imcDisplay}
                    </span>
                  </div>
                  <FormDescription className="text-xs mt-1">
                    Indicador geral (não define composição).
                  </FormDescription>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Circunferências */}
          <Card>
            <CardHeader>
              <CardTitle>Circunferências (opcional)</CardTitle>
              <CardDescription>
                Ajudam a acompanhar evolução de gordura abdominal,
                quadril e tronco.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="cintura"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cintura (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quadril"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quadril (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="abdomen"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Abdômen (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="torax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tórax (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gluteo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Glúteo (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Composição corporal */}
          <Card>
            <CardHeader>
              <CardTitle>Composição corporal (opcional)</CardTitle>
              <CardDescription>
                Preencha se tiver avaliação recente por bioimpedância
                ou dobras cutâneas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="metodoComposicao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Método utilizado</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="nenhum">
                          Não tenho avaliação
                        </SelectItem>
                        <SelectItem value="bioimpedancia">
                          Bioimpedância
                        </SelectItem>
                        <SelectItem value="pollock7">
                          Dobras cutâneas (Pollock 7)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Se não tiver esses dados agora, escolha &quot;Não
                      tenho avaliação&quot; e siga adiante.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Bioimpedância */}
              {metodoSelecionado === "bioimpedancia" && (
                <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold">
                    Dados da bioimpedância
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bioPercentualGordura"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>% Gordura</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bioPercentualMassaMagra"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>% Massa magra</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bioAguaCorporal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>% Água corporal (opcional)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="bioIdadeMetabolica"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idade metabólica (opcional)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* Pollock 7 */}
              {metodoSelecionado === "pollock7" && (
                <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold">
                    Dobras cutâneas (Pollock 7)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="peitoral"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Peitoral (mm)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="axilarMedia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Axilar média (mm)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="triceps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tríceps (mm)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subescapular"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subescapular (mm)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="abdominal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Abdominal (mm)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supraIliaca"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supra-ilíaca (mm)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="coxa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Coxa (mm)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use a mesma avaliação (mesmo avaliador / adipômetro)
                    para comparar evolução.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Botão principal do step */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              className="w-full sm:w-auto bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF]"
            >
              Continuar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}