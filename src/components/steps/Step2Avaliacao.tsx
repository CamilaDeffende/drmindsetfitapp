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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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

    // Pollock 7 Dobras
    peitoral: z.coerce.number().optional().or(z.literal("")),
    axilarMedia: z.coerce.number().optional().or(z.literal("")),
    triceps: z.coerce.number().optional().or(z.literal("")),
    subescapular: z.coerce.number().optional().or(z.literal("")),
    abdominal: z.coerce.number().optional().or(z.literal("")),
    supraIliaca: z.coerce.number().optional().or(z.literal("")),
    coxa: z.coerce.number().optional().or(z.literal("")),

    // Bioimpedância
    bioPercentualGordura: z.coerce.number().optional().or(z.literal("")),
    bioPercentualMassaMagra: z.coerce
      .number()
      .optional()
      .or(z.literal("")),
    bioAguaCorporal: z.coerce.number().optional().or(z.literal("")),
    bioIdadeMetabolica: z.coerce
      .number()
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    const metodo = String(data.metodoComposicao || "").toLowerCase();

    const isPollock = metodo === "pollock7";
    const isBio = metodo === "bioimpedancia";

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

  const { state, updateState } = useDrMindSetfit();
  const navigate = useNavigate();

  const initialMetodo = (draftSSOT as any)?.metodoComposicao ?? "nenhum";

  const [metodoSelecionado, setMetodoSelecionado] =
    useState<MetodoComposicao>(initialMetodo as MetodoComposicao);

  const [mfInvalidMsg, setMfInvalidMsg] = useState<string | null>(null);

  const form = useForm<AvaliacaoFormData>({
    resolver: zodResolver(avaliacaoSchema),
    defaultValues: {
      ...(draftSSOT as any),

      peso:
        (draftSSOT as any)?.peso ??
        state.perfil?.pesoAtual ??
        undefined,
      altura:
        (draftSSOT as any)?.altura ??
        state.perfil?.altura ??
        undefined,

      metodoComposicao: initialMetodo as MetodoComposicao,

      frequenciaAtividadeSemanal:
        (draftSSOT as any)?.frequenciaAtividadeSemanal ??
        (state as any)?.avaliacao?.frequenciaAtividadeSemanal ??
        "moderadamente_ativo",
      biotipo:
        (draftSSOT as any)?.biotipo ??
        (state as any)?.avaliacao?.biotipo ??
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
      bioAguaCorporal: (draftSSOT as any)?.bioAguaCorporal ?? "",
      bioIdadeMetabolica:
        (draftSSOT as any)?.bioIdadeMetabolica ?? "",
    },
  });

  const _watchAll = form.watch();
  useOnboardingDraftSaver(
    {
      step2: _watchAll as any,
    },
    400
  );

  const calcularIMC = (peso: number, altura: number) => {
    if (!peso || !altura) return "--";
    const imc = peso / Math.pow(altura / 100, 2);
    if (!Number.isFinite(imc)) return "--";
    return imc.toFixed(1);
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

    const imcNumber = Number(
      calcularIMC(data.peso, data.altura) || 0
    );

    const avaliacao: AvaliacaoFisica = {
      frequenciaAtividadeSemanal: data.frequenciaAtividadeSemanal,
      peso: data.peso,
      altura: data.altura,
      imc: imcNumber,
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
    } as any;

    // biotipo armazenado junto da avaliação (para Step3)
    (avaliacao as any).biotipo = data.biotipo;

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

    updateState({ avaliacao } as any);

    try {
      if (typeof onNext === "function") {
        onNext();
      } else {
        try {
          navigate("/onboarding/step-3", { replace: true });
        } catch {
          // fallback: deixa o OnboardingFlow cuidar
        }
      }
    } catch (e) {
      console.error("[Step2Avaliacao] erro ao avançar:", e);
    }
  };

  const peso = form.watch("peso");
  const altura = form.watch("altura");

  const handleInvalid = (errors: any) => {
    console.warn("[Step2Avaliacao] invalid:", errors);
    try {
      setMfInvalidMsg(
        "Revise os campos obrigatórios antes de continuar."
      );
    } catch {}
  };

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
          onSubmit={form.handleSubmit(onSubmit, handleInvalid)}
          className="space-y-6 sm:space-y-7"
        >
          {mfInvalidMsg && (
            <Alert>
              <AlertTitle>Não foi possível avançar</AlertTitle>
              <AlertDescription>{mfInvalidMsg}</AlertDescription>
            </Alert>
          )}

          {/* Atividade semanal + Biotipo */}
          <Card>
            <CardHeader>
              <CardTitle>Rotina e biotipo</CardTitle>
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
                      Não é só treino. Conta também rotina, trabalho e dia
                      a dia.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="biotipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biotipo (tendência prática)</FormLabel>
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
                        <SelectItem value="ectomorfo">
                          Ectomorfo
                        </SelectItem>
                        <SelectItem value="mesomorfo">
                          Mesomorfo
                        </SelectItem>
                        <SelectItem value="endomorfo">
                          Endomorfo
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Só uma referência de tendência, não é diagnóstico.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
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
                      {calcularIMC(peso as any, altura as any)}
                    </span>
                  </div>
                  <FormDescription className="text-xs mt-1">
                    Indicador geral (não define composição).
                  </FormDescription>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Circunferências (opcional) */}
          <Card>
            <CardHeader>
              <CardTitle>Circunferências (opcional)</CardTitle>
              <CardDescription>
                Úteis para acompanhar progresso visual e distribuição de
                gordura.
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
              <CardTitle>Composição corporal</CardTitle>
              <CardDescription>
                Se tiver medidas de dobras ou bioimpedância, o plano
                fica ainda mais preciso. Se não tiver, pode seguir em
                frente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                value={metodoSelecionado}
                onValueChange={(v: string) => {
                  const m = v as MetodoComposicao;
                  setMetodoSelecionado(m);
                  form.setValue("metodoComposicao", m, {
                    shouldValidate: true,
                  });
                }}
              >
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="nenhum">Sem medidas</TabsTrigger>
                  <TabsTrigger value="pollock7">
                    Pollock 7 dobras
                  </TabsTrigger>
                  <TabsTrigger value="bioimpedancia">
                    Bioimpedância
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="nenhum" className="pt-4">
                  <p className="text-sm text-muted-foreground">
                    Se você não tiver dados de dobras ou bioimpedância,
                    não tem problema. O app usa seu perfil, peso e
                    rotina para estimar o resto.
                  </p>
                </TabsContent>

                <TabsContent value="pollock7" className="pt-4">
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
                </TabsContent>

                <TabsContent value="bioimpedancia" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <FormField
                      control={form.control}
                      name="bioPercentualGordura"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>% Gordura</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
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
                            <Input type="number" {...field} />
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
                          <FormLabel>% Água corporal</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
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
                          <FormLabel>Idade metabólica</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                try {
                  if (typeof onBack === "function") onBack();
                  else navigate("/onboarding/step-1", {
                    replace: true,
                  });
                } catch {}
              }}
            >
              Voltar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#1E6BFF] via-[#00B7FF] to-[#00B7FF] hover:from-[#1E6BFF] hover:to-[#00B7FF]"
            >
              Continuar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}